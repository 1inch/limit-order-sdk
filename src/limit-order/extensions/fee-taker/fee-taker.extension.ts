import {BN, BytesBuilder, BytesIter} from '@1inch/byte-utils'
import assert from 'assert'
import {Fees} from './fees.js'
import {ResolverFee} from './resolver-fee.js'
import {IntegratorFee} from './integrator-fee.js'
import {WhitelistHalfAddress} from './whitelist-half-address.js'
import {FeeCalculator} from './fee-calculator.js'
import {ExtensionBuilder} from '../extension-builder.js'
import {Address} from '../../../address.js'
import {Interaction} from '../../interaction.js'
import {Extension} from '../extension.js'
import {Bps} from '../../../bps.js'

/**
 * @see https://github.com/1inch/limit-order-protocol/blob/master/contracts/extensions/FeeTaker.sol
 */
export class FeeTakerExtension {
    /**
     * Flags for post-interaction data
     * @private
     */
    private static CUSTOM_RECEIVER_FLAG_BIT = 0n

    private constructor(
        public readonly address: Address,
        public readonly fees: Fees,
        public readonly whitelist: WhitelistHalfAddress,
        public readonly makerPermit?: Interaction,
        public readonly extraInteraction?: Interaction,
        public readonly customReceiver?: Address
    ) {}

    static new(
        /**
         * Address of extension
         */
        address: Address,
        /**
         * @see ResolverFee
         * @see IntegratorFee
         */
        fees: Fees,
        /**
         * If empty, then KYC token is required to fill order
         */
        whitelist?: Address[],
        extra?: {
            makerPermit?: Interaction
            /**
             * In case receiver of taker tokens is not maker
             */
            customReceiver?: Address

            /**
             * Will be called after FeeTaker.postInteraction
             */
            extraInteraction?: Interaction
        }
    ): FeeTakerExtension {
        return new FeeTakerExtension(
            address,
            fees,
            WhitelistHalfAddress.new(whitelist || []),
            extra?.makerPermit,
            extra?.extraInteraction,
            extra?.customReceiver
        )
    }

    /**
     * Create `FeeTakerExtension` from bytes
     *
     * @param bytes 0x prefixed bytes
     */
    public static decode(bytes: string): FeeTakerExtension {
        const extension = Extension.decode(bytes)

        return FeeTakerExtension.fromExtension(extension)
    }

    /**
     * Create `FeeTakerExtension` from `Extension`
     */
    public static fromExtension(extension: Extension): FeeTakerExtension {
        const extensionAddress = Address.fromFirstBytes(
            extension.makingAmountData
        )

        assert(
            Address.fromFirstBytes(extension.takingAmountData).equal(
                extensionAddress
            ) &&
                Address.fromFirstBytes(extension.postInteraction).equal(
                    extensionAddress
                ),
            'Invalid extension, all calls should be to the same address'
        )

        assert(
            extension.takingAmountData == extension.makingAmountData,
            'Invalid extension, taking amount data must be equal to making amount data'
        )

        // region Parse postInteraction data
        const interactionBytes = BytesIter.HexString(extension.postInteraction)
        interactionBytes.nextUint160() // skip address of extension
        const flags = BN.fromHex(interactionBytes.nextUint8())
        const integratorFeeRecipient = new Address(
            interactionBytes.nextUint160()
        )
        const protocolFeeRecipient = new Address(interactionBytes.nextUint160())

        const customTokensRecipient = flags.getBit(
            FeeTakerExtension.CUSTOM_RECEIVER_FLAG_BIT
        )
            ? new Address(interactionBytes.nextUint160())
            : undefined

        const interactionData = parseAmountData(interactionBytes)

        const extraInteraction = interactionBytes.isEmpty()
            ? undefined
            : Interaction.decode(interactionBytes.rest())

        //endregion Parse postInteraction data

        //region Parse amount data
        const amountBytes = BytesIter.HexString(extension.makingAmountData)
        amountBytes.nextUint160() // skip address of extension

        const amountData = parseAmountData(amountBytes)

        //endregion Parse amount data

        const permit = extension.hasMakerPermit
            ? Interaction.decode(extension.makerPermit)
            : undefined

        assert(
            amountData.fees.integratorFee.value ===
                interactionData.fees.integratorFee.value,
            `invalid extension: integrator fee must be same in interaction data and in amount data`
        )
        assert(
            amountData.fees.resolverFee.value ===
                interactionData.fees.resolverFee.value,
            `invalid extension: resolver fee must be same in interaction data and in amount data`
        )

        assert(
            amountData.whitelist.discount.value ===
                interactionData.whitelist.discount.value,
            `invalid extension: whitelist discount fee must be same in interaction data and in amount data`
        )
        assert(
            amountData.fees.integratorShare.value ===
                interactionData.fees.integratorShare.value,
            `invalid extension: integrator share must be same in interaction data and in amount data`
        )

        assert(
            interactionData.whitelist.addresses.length ===
                amountData.whitelist.addresses.length,
            'whitelist must be same in interaction data and in amount data'
        )
        assert(
            interactionData.whitelist.addresses.every(
                (val, i) => amountData.whitelist.addresses[i] === val
            ),
            'whitelist must be same in interaction data and in amount data'
        )

        return new FeeTakerExtension(
            extensionAddress,
            new Fees(
                amountData.fees.resolverFee.isZero()
                    ? ResolverFee.ZERO
                    : new ResolverFee(
                          protocolFeeRecipient,
                          amountData.fees.resolverFee,
                          amountData.whitelist.discount
                      ),
                amountData.fees.integratorFee.isZero()
                    ? IntegratorFee.ZERO
                    : new IntegratorFee(
                          integratorFeeRecipient,
                          protocolFeeRecipient,
                          amountData.fees.integratorFee,
                          amountData.fees.integratorShare
                      )
            ),
            new WhitelistHalfAddress(amountData.whitelist.addresses),
            permit,
            extraInteraction,
            customTokensRecipient
        )
    }

    public getFeeCalculator(): FeeCalculator {
        return new FeeCalculator(this.fees, this.whitelist)
    }

    public build(): Extension {
        const amountGetterData = this.buildAmountGetterData()

        const builder = new ExtensionBuilder()
            .withMakingAmountData(this.address, amountGetterData)
            .withTakingAmountData(this.address, amountGetterData)
            .withPostInteraction(
                new Interaction(this.address, this.buildInteractionData())
            )

        if (this.makerPermit) {
            builder.withMakerPermit(
                this.makerPermit.target,
                this.makerPermit.data
            )
        }

        return builder.build()
    }

    /**
     * Returns takingAmount with applied fees to it
     *
     * @param taker address which fill order
     * @param takingAmount amount to apply fee to
     */
    public getTakingAmount(taker: Address, takingAmount: bigint): bigint {
        return this.getFeeCalculator().getTakingAmount(taker, takingAmount)
    }

    /**
     * Returns makingAmount with applied fees to it
     *
     * @param taker address which fill order
     * @param makingAmount amount to apply fee to
     */
    public getMakingAmount(taker: Address, makingAmount: bigint): bigint {
        return this.getFeeCalculator().getMakingAmount(taker, makingAmount)
    }

    /**
     * Fee in `takerAsset` which resolver pays to resolver fee receiver
     *
     * @param taker who will fill order
     * @param takingAmount taking amount to apply fee to
     */
    public getResolverFee(taker: Address, takingAmount: bigint): bigint {
        return this.getFeeCalculator().getResolverFee(taker, takingAmount)
    }

    /**
     * Fee in `takerAsset` which integrator gets to integrator wallet
     *
     * @param taker who will fill order
     * @param takingAmount taking amount to calculate fee from
     */
    public getIntegratorFee(taker: Address, takingAmount: bigint): bigint {
        return this.getFeeCalculator().getIntegratorFee(taker, takingAmount)
    }

    /**
     * Fee in `takerAsset` which protocol gets as share from integrator fee
     *
     * @param taker who will fill order
     * @param takingAmount taking amount to calculate fee from
     */
    public getProtocolShareOfIntegratorFee(
        taker: Address,
        takingAmount: bigint
    ): bigint {
        return this.getFeeCalculator().getProtocolShareOfIntegratorFee(
            taker,
            takingAmount
        )
    }

    /**
     * Fee in `takerAsset` which protocol gets
     * It equals to `share from integrator fee plus resolver fee`
     *
     * @param taker who will fill order
     * @param takingAmount taking amount to calculate fee from
     */
    public getProtocolFee(taker: Address, takingAmount: bigint): bigint {
        return this.getFeeCalculator().getProtocolFee(taker, takingAmount)
    }

    /**
     * Build data for AmountGetterWithFee
     *
     * 2 bytes — integrator fee percentage (in 1e5)
     * 1 byte - integrator share percentage (in 1e2)
     * 2 bytes — resolver fee percentage (in 1e5)
     * 1 byte - whitelist discount numerator (in 1e2)
     * 1 byte - size of the whitelist
     * (bytes10)[N] whitelisted addresses;
     *
     * @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/AmountGetterWithFee.sol#L56
     */
    private buildAmountGetterData(): string {
        const integrator = {
            fee: this.fees.integrator.fee.toFraction(Fees.BASE_1E5),
            share: this.fees.integrator.share.toFraction(Fees.BASE_1E2)
        }

        const resolverFee = this.fees.resolver.fee.toFraction(Fees.BASE_1E5)

        const builder = new BytesBuilder()
            .addUint16(BigInt(integrator.fee))
            .addUint8(BigInt(integrator.share))
            .addUint16(BigInt(resolverFee))
            .addUint8(
                BigInt(
                    // contract expects discount numerator, but class contain discount
                    Number(Fees.BASE_1E2) -
                        this.fees.resolver.whitelistDiscount.toFraction(
                            Fees.BASE_1E2
                        )
                )
            )

        this.whitelist.encodeTo(builder)

        return builder.asHex()
    }

    /**
     * Build data for `FeeTaker.postInteraction`
     *
     *
     * 1 byte - flags:
     *      01 bit `CUSTOM_RECEIVER_FLAG` - set to 1 if order has custom receiver
     * 20 bytes — integrator fee recipient
     * 20 bytes - protocol fee recipient
     * [20 bytes] — receiver of taking tokens (optional, if not set, maker is used). See `CUSTOM_RECEIVER_FLAG` flag
     * Same as in `buildAmountGetterData`
     * [bytes20, bytes] - optional extra interaction
     * @see buildAmountGetterData
     * @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/FeeTaker.sol#L114
     */
    private buildInteractionData(): string {
        const flags = new BN(0n).setBit(
            FeeTakerExtension.CUSTOM_RECEIVER_FLAG_BIT,
            Boolean(this.customReceiver)
        )

        const builder = new BytesBuilder()
            .addUint8(flags)
            .addAddress(this.fees.integrator.integrator.toString())
            .addAddress(this.fees.protocol.toString())

        if (this.customReceiver) {
            builder.addAddress(this.customReceiver.toString())
        }

        builder.addBytes(this.buildAmountGetterData())

        if (this.extraInteraction) {
            builder
                .addAddress(this.extraInteraction.target.toString())
                .addBytes(this.extraInteraction.data)
        }

        return builder.asHex()
    }
}

function parseAmountData(iter: BytesIter<string>): {
    fees: {integratorFee: Bps; integratorShare: Bps; resolverFee: Bps}
    whitelist: {addresses: string[]; discount: Bps}
} {
    const fees = {
        integratorFee: Bps.fromFraction(
            Number(iter.nextUint16()),
            Fees.BASE_1E5
        ),
        integratorShare: Bps.fromFraction(
            Number(iter.nextUint8()),
            Fees.BASE_1E2
        ),
        resolverFee: Bps.fromFraction(Number(iter.nextUint16()), Fees.BASE_1E5)
    }

    const whitelistDiscount = Bps.fromFraction(
        Number(Fees.BASE_1E2) - Number(iter.nextUint8()), // contract uses 1 - discount
        Fees.BASE_1E2
    )

    const whitelistAddresses: string[] = []
    const whitelistFromAmountSize = Number(iter.nextUint8())

    for (let i = 0; i < whitelistFromAmountSize; i++) {
        whitelistAddresses.push(iter.nextBytes(10))
    }

    return {
        fees,
        whitelist: {discount: whitelistDiscount, addresses: whitelistAddresses}
    }
}
