import {Fees} from './fees.js'
import {Whitelist} from './types.js'
import {Address} from '../../../address.js'
import {mulDiv, Rounding} from '../../../utils/mul-div.js'

export class FeeCalculator {
    constructor(
        public readonly fees: Fees,
        public readonly whitelist: Whitelist
    ) {}

    public getTakingAmount(taker: Address, orderTakingAmount: bigint): bigint {
        const fees = this.getFeesForTaker(taker)

        return mulDiv(
            orderTakingAmount,
            Fees.BASE_1E5 + fees.resolverFee + fees.integratorFee,
            Fees.BASE_1E5,
            Rounding.Ceil
        )
    }

    public getMakingAmount(taker: Address, makingAmount: bigint): bigint {
        const fees = this.getFeesForTaker(taker)

        return mulDiv(
            makingAmount,
            Fees.BASE_1E5,
            Fees.BASE_1E5 + fees.resolverFee + fees.integratorFee
        )
    }

    /**
     * Fee in `takerAsset` which resolver pays to resolver fee receiver
     *
     * @param taker who will fill order
     * @param orderTakingAmount taking amount from order struct
     */
    public getResolverFee(taker: Address, orderTakingAmount: bigint): bigint {
        // the logic copied from contract to avoid calculation issues
        // @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/FeeTaker.sol#L145

        const takingAmount = this.getTakingAmount(taker, orderTakingAmount)
        const fees = this.getFeesForTaker(taker)

        return mulDiv(
            takingAmount,
            fees.resolverFee,
            Fees.BASE_1E5 + fees.resolverFee + fees.integratorFee
        )
    }

    /**
     * Fee in `takerAsset` which integrator gets to integrator wallet
     *
     * @param taker who will fill order
     * @param orderTakingAmount taking amount from order struct
     */
    public getIntegratorFee(taker: Address, orderTakingAmount: bigint): bigint {
        // the logic copied from contract to avoid calculation issues
        // @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/FeeTaker.sol#L145

        const takingAmount = this.getTakingAmount(taker, orderTakingAmount)
        const fees = this.getFeesForTaker(taker)

        const total = mulDiv(
            takingAmount,
            fees.integratorFee,
            Fees.BASE_1E5 + fees.resolverFee + fees.integratorFee
        )

        return mulDiv(
            total,
            BigInt(this.fees.integrator.share.toFraction(Fees.BASE_1E2)),
            Fees.BASE_1E2
        )
    }

    /**
     * Fee in `takerAsset` which protocol gets as share from integrator fee
     *
     * @param taker who will fill order
     * @param orderTakingAmount taking amount from order struct
     */
    public getProtocolShareOfIntegratorFee(
        taker: Address,
        orderTakingAmount: bigint
    ): bigint {
        // the logic copied from contract to avoid calculation issues
        // @see https://github.com/1inch/limit-order-protocol/blob/22a18f7f20acfec69d4f50ce1880e8e662477710/contracts/extensions/FeeTaker.sol#L145

        const takingAmount = this.getTakingAmount(taker, orderTakingAmount)
        const fees = this.getFeesForTaker(taker)

        const total = mulDiv(
            takingAmount,
            fees.integratorFee,
            Fees.BASE_1E5 + fees.resolverFee + fees.integratorFee
        )

        return total - this.getIntegratorFee(taker, orderTakingAmount)
    }

    /**
     * Fee in `takerAsset` which protocol gets
     * It equals to `share from integrator fee plus resolver fee`
     *
     * @param taker who will fill order
     * @param orderTakingAmount taking amount from order struct
     */
    public getProtocolFee(taker: Address, orderTakingAmount: bigint): bigint {
        const resolverFee = this.getResolverFee(taker, orderTakingAmount)
        const integratorPart = this.getProtocolShareOfIntegratorFee(
            taker,
            orderTakingAmount
        )

        return integratorPart + resolverFee
    }

    private getFeesForTaker(taker: Address): {
        resolverFee: bigint
        integratorFee: bigint
    } {
        const discountNumerator = this.whitelist.isWhitelisted(taker)
            ? Number(Fees.BASE_1E2) -
              this.fees.resolver.whitelistDiscount.toFraction(Fees.BASE_1E2)
            : 100

        const resolverFee =
            BigInt(
                discountNumerator *
                    this.fees.resolver.fee.toFraction(Fees.BASE_1E5)
            ) / Fees.BASE_1E2

        const resolverFeeBN = BigInt(resolverFee)
        const integratorFeeBN = BigInt(
            this.fees.integrator.fee.toFraction(Fees.BASE_1E5)
        )

        return {
            resolverFee: resolverFeeBN,
            integratorFee: integratorFeeBN
        }
    }
}
