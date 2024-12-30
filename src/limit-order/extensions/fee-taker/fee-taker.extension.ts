import {BN, BytesBuilder, BytesIter} from '@1inch/byte-utils'
import assert from 'assert'
import {
    Fee,
    IntegratorFee,
    Recipients,
    ResolverFee,
    WhitelistInfo
} from './types'
import {mulDiv, Rounding} from './mul-div'
import {ExtensionBuilder} from '../extension-builder'
import {Address} from '../../../address'
import {Interaction} from '../../interaction'
import {Extension} from '../extension'
import {Bps} from '../../../bps'

/**
 * @see https://github.com/1inch/limit-order-protocol/blob/master/contracts/extensions/FeeTaker.sol
 */
export class FeeTakerExtension {
    public fees: ResolverFee & IntegratorFee

    /**
     * 100% = 100000
     * @private
     */
    private static BASE_1E5 = 1e5

    /**
     * 100% = 100
     * @private
     */
    private static BASE_1E2 = 100

    /**
     * Flags for post-interaction data
     * @private
     */
    private static CUSTOM_RECEIVER_FLAG = 0n

    private constructor(
        public readonly address: Address,
        public readonly recipients: Recipients,
        fees: Fee,
        public readonly whitelist: WhitelistInfo,
        public readonly makerPermit?: Interaction,
        public readonly extraInteraction?: Interaction
    ) {
        this.fees = {
            integratorFee:
                'integratorFee' in fees
                    ? fees.integratorFee
                    : {share: Bps.ZERO, fee: Bps.ZERO},
            resolverFee: 'resolverFee' in fees ? fees.resolverFee : Bps.ZERO
        }
    }

    static new(
        /**
         * Address of extension
         */
        address: Address,
        recipients: Recipients,
        /**
         * @see ResolverFee
         * @see IntegratorFee
         */
        fees: Fee,
        /**
         * If empty, then KYC token is required to fill order
         */
        whitelist?: {
            addresses: Address[]
            /**
             * Whitelisted resolvers have discount on fee
             */
            discount: Bps
        },
        makerPermit?: Interaction,
        /**
         * Will be called after FeeTaker.postInteraction
         */
        extraInteraction?: Interaction
    ): FeeTakerExtension {
        const _whitelist = {
            addresses: whitelist?.addresses.map((w) => w.lastHalf()) || [],
            discount: whitelist?.discount || Bps.fromPercent(0)
        }

        return new FeeTakerExtension(
            address,
            recipients,
            fees,
            _whitelist,
            makerPermit,
            extraInteraction
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
        const interactionBytes = BytesIter.String(extension.postInteraction)
        interactionBytes.nextUint160() // skip address of extension
        const flags = BN.fromHex(interactionBytes.nextUint8())
        const integratorFeeRecipient = new Address(
            interactionBytes.nextUint160()
        )
        const protocolFeeRecipient = new Address(interactionBytes.nextUint160())

        const customTokensRecipient = flags.getBit(
            FeeTakerExtension.CUSTOM_RECEIVER_FLAG
        )
            ? new Address(interactionBytes.nextUint160())
            : undefined

        const feesFromInteraction = {
            integratorFee: Bps.fromFraction(
                Number(interactionBytes.nextUint16()),
                FeeTakerExtension.BASE_1E5
            ),
            integratorShare: Bps.fromFraction(
                Number(interactionBytes.nextUint8()),
                FeeTakerExtension.BASE_1E2
            ),
            resolverFee: Bps.fromFraction(
                Number(interactionBytes.nextUint16()),
                FeeTakerExtension.BASE_1E5
            )
        }

        const whitelistFromInteraction = [] as string[]
        const whitelistFromInteractionSize = Number(
            interactionBytes.nextUint8()
        )

        for (let i = 0; i < whitelistFromInteractionSize; i++) {
            whitelistFromInteraction.push(interactionBytes.nextBytes(10))
        }

        const extraInteraction = interactionBytes.isEmpty()
            ? undefined
            : Interaction.decode(interactionBytes.rest())

        //endregion Parse postInteraction data

        //region Parse amount data
        const amountBytes = BytesIter.String(extension.makingAmountData)
        amountBytes.nextUint160() // skip address of extension
        const feesFromAmount = {
            integratorFee: Bps.fromFraction(
                Number(amountBytes.nextUint16()),
                FeeTakerExtension.BASE_1E5
            ),
            integratorShare: Bps.fromFraction(
                Number(amountBytes.nextUint8()),
                FeeTakerExtension.BASE_1E2
            ),
            resolverFee: Bps.fromFraction(
                Number(amountBytes.nextUint16()),
                FeeTakerExtension.BASE_1E5
            )
        }

        const whitelistDiscount = Bps.fromFraction(
            FeeTakerExtension.BASE_1E2 - Number(amountBytes.nextUint8()), // contact uses 1 - discount
            FeeTakerExtension.BASE_1E2
        )

        const whitelistFromAmount = [] as string[]
        const whitelistFromAmountSize = Number(amountBytes.nextUint8())

        for (let i = 0; i < whitelistFromAmountSize; i++) {
            whitelistFromAmount.push(amountBytes.nextBytes(10))
        }
        //endregion Parse amount data

        const permit = extension.hasMakerPermit
            ? Interaction.decode(extension.makerPermit)
            : undefined

        assert(
            feesFromAmount.integratorFee.value ===
                feesFromInteraction.integratorFee.value,
            `invalid extension: integrator fee must be same in interaction data and in amount data`
        )
        assert(
            feesFromAmount.resolverFee.value ===
                feesFromInteraction.resolverFee.value,
            `invalid extension: resolver fee must be same in interaction data and in amount data`
        )
        assert(
            feesFromAmount.integratorShare.value ===
                feesFromInteraction.integratorShare.value,
            `invalid extension: integrator share must be same in interaction data and in amount data`
        )

        assert(
            whitelistFromInteraction.length === whitelistFromAmount.length,
            'whitelist must be same in interaction data and in amount data'
        )
        assert(
            whitelistFromInteraction.every(
                (val, i) => whitelistFromAmount[i] === val
            ),
            'whitelist must be same in interaction data and in amount data'
        )

        return new FeeTakerExtension(
            extensionAddress,
            {
                protocolFeeRecipient,
                integratorFeeRecipient,
                tokensRecipient: customTokensRecipient
            },
            {
                integratorFee: {
                    share: feesFromInteraction.integratorShare,
                    fee: feesFromInteraction.integratorFee
                },
                resolverFee: feesFromInteraction.resolverFee
            },
            {
                discount: whitelistDiscount,
                addresses: whitelistFromInteraction
            },
            permit,
            extraInteraction
        )
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

    public isWhitelisted(address: Address): boolean {
        const half = address.lastHalf()

        return this.whitelist.addresses.some((w) => w === half)
    }

    public getTakingAmount(taker: Address, takingAmount: bigint): bigint {
        const resolverFee = this.isWhitelisted(taker)
            ? (FeeTakerExtension.BASE_1E2 -
                  this.whitelist.discount.toFraction(
                      FeeTakerExtension.BASE_1E2
                  )) *
              this.fees.resolverFee.toFraction(FeeTakerExtension.BASE_1E5)
            : this.fees.resolverFee.toFraction(FeeTakerExtension.BASE_1E5)

        const resolverFeeBN = BigInt(resolverFee)
        const integratorFeeBN = BigInt(
            this.fees.integratorFee.fee.toFraction(FeeTakerExtension.BASE_1E5)
        )

        const baseBN = BigInt(FeeTakerExtension.BASE_1E5)

        return mulDiv(
            takingAmount,
            baseBN + resolverFeeBN + integratorFeeBN,
            baseBN,
            Rounding.Ceil
        )
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
        const integrator =
            'integratorFee' in this.fees
                ? {
                      fee: this.fees.integratorFee.fee.toFraction(
                          FeeTakerExtension.BASE_1E5
                      ),
                      share: this.fees.integratorFee.share.toFraction(
                          FeeTakerExtension.BASE_1E2
                      )
                  }
                : {fee: 0, share: 0}

        const resolverFee =
            'resolverFee' in this.fees
                ? this.fees.resolverFee.toFraction(FeeTakerExtension.BASE_1E5)
                : 0

        const builder = new BytesBuilder()
            .addUint16(BigInt(integrator.fee))
            .addUint8(BigInt(integrator.share))
            .addUint16(BigInt(resolverFee))
            .addUint8(
                BigInt(
                    // contract expects discount numerator, but class contain discount
                    FeeTakerExtension.BASE_1E2 -
                        this.whitelist.discount.toFraction(
                            FeeTakerExtension.BASE_1E2
                        )
                )
            )
            .addUint8(BigInt(this.whitelist.addresses.length))

        for (const halfAddress of this.whitelist.addresses) {
            builder.addBytes(halfAddress)
        }

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
     * 2 bytes — integrator fee percentage (in 1e5)
     * 1 bytes - integrator rev share percentage (in 1e2)
     * 2 bytes — resolver fee percentage (in 1e5)
     * 1 byte - size of the whitelist
     * (bytes10)[N] whitelisted addresses;
     * [bytes20, bytes] - optional extra interaction
     * @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/FeeTaker.sol#L114
     */
    private buildInteractionData(): string {
        const integrator =
            'integratorFee' in this.fees
                ? {
                      fee: this.fees.integratorFee.fee.toFraction(
                          FeeTakerExtension.BASE_1E5
                      ),
                      share: this.fees.integratorFee.share.toFraction(
                          FeeTakerExtension.BASE_1E2
                      )
                  }
                : {fee: 0, share: 0}

        const resolverFee =
            'resolverFee' in this.fees
                ? this.fees.resolverFee.toFraction(FeeTakerExtension.BASE_1E5)
                : 0

        const flags = this.recipients.tokensRecipient
            ? new BN(0n).setBit(FeeTakerExtension.CUSTOM_RECEIVER_FLAG, 1)
            : new BN(0n)

        const builder = new BytesBuilder()
            .addUint8(flags)
            .addAddress(this.recipients.integratorFeeRecipient.toString())
            .addAddress(this.recipients.protocolFeeRecipient.toString())

        if (this.recipients.tokensRecipient) {
            builder.addAddress(this.recipients.tokensRecipient.toString())
        }

        builder
            .addUint16(BigInt(integrator.fee))
            .addUint8(BigInt(integrator.share))
            .addUint16(BigInt(resolverFee))
            .addUint8(BigInt(this.whitelist.addresses.length))

        for (const halfAddress of this.whitelist.addresses) {
            builder.addBytes(halfAddress)
        }

        if (this.extraInteraction) {
            builder
                .addAddress(this.extraInteraction.target.toString())
                .addBytes(this.extraInteraction.data)
        }

        return builder.asHex()
    }
}
