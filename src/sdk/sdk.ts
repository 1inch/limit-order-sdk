import {buildIntegratorFeeFromFeeInfo} from './integrator-fee.util.js'
import {Address} from '../address.js'
import {
    ExtensionBuilder,
    LimitOrder,
    LimitOrderWithFee,
    MakerTraits,
    OrderInfoData,
    FeeTakerExt,
    Interaction
} from '../limit-order/index.js'
import {Api, ApiConfig, FeeInfoDTO} from '../api/index.js'
import {Bps} from '../bps.js'

export class Sdk {
    private readonly api: Api

    constructor(apiConfig: ApiConfig) {
        this.api = new Api(apiConfig)
    }

    /**
     * Create LimitOrder with an extension params from API
     *
     * Rejects when the pair has zero fees, so fee-configured integrators fail
     * fast instead of silently building orders without fees. Orgs with an
     * intentionally zero-fee setup should use `createOrderWithoutFees`.
     *
     * @returns LimitOrderWithFee to sign and submit to relayer
     */
    public async createOrder(
        orderInfo: OrderInfoData,
        makerTraits = MakerTraits.default(),
        extra: {
            makerPermit?: Interaction
            integratorFee?: FeeTakerExt.IntegratorFee
        } = {}
    ): Promise<LimitOrderWithFee> {
        const feeParams = await this.getFeeParams(orderInfo)

        const integratorFee =
            extra.integratorFee ?? buildIntegratorFeeFromFeeInfo(feeParams)

        // ResolverFee rejects a zero fee with a non-zero receiver (integrator-only case)
        const resolverFee =
            feeParams.feeBps > 0
                ? new FeeTakerExt.ResolverFee(
                      new Address(feeParams.protocolFeeReceiver),
                      new Bps(BigInt(feeParams.feeBps)),
                      Bps.fromPercent(feeParams.whitelistDiscountPercent)
                  )
                : FeeTakerExt.ResolverFee.ZERO

        if (resolverFee.fee.isZero() && integratorFee.fee.isZero()) {
            throw new Error(
                'pair has zero fees for this org - use createOrderWithoutFees() to build a plain order'
            )
        }

        const feeExt = FeeTakerExt.FeeTakerExtension.new(
            new Address(feeParams.extensionAddress),
            new FeeTakerExt.Fees(resolverFee, integratorFee),
            Object.values(feeParams.whitelist).map((w) => new Address(w)),
            {
                ...extra,
                customReceiver: orderInfo.receiver
            }
        )

        const order = new LimitOrderWithFee(orderInfo, makerTraits, feeExt)

        // Apply API-resolved track code when salt is auto-built
        if (orderInfo.salt === undefined) {
            order.setSource(feeParams.source)
        }

        return order
    }

    /**
     * Create a plain LimitOrder (no fee extension) for a pair with zero fees -
     * a zero-fee extension is not encodable, same shape as GET /build returns.
     *
     * Rejects when the org has fees configured, so it cannot be used to skip them.
     */
    public async createOrderWithoutFees(
        orderInfo: OrderInfoData,
        makerTraits = MakerTraits.default(),
        extra: {
            makerPermit?: Interaction
        } = {}
    ): Promise<LimitOrder> {
        const feeParams = await this.getFeeParams(orderInfo)
        const integratorFee = buildIntegratorFeeFromFeeInfo(feeParams)

        if (feeParams.feeBps > 0 || !integratorFee.fee.isZero()) {
            throw new Error(
                'org has fees configured for this pair - use createOrder() so the fees are embedded'
            )
        }

        const extension = extra.makerPermit
            ? new ExtensionBuilder()
                  .withMakerPermit(
                      extra.makerPermit.target,
                      extra.makerPermit.data
                  )
                  .build()
            : undefined

        const order = new LimitOrder(orderInfo, makerTraits, extension)

        // Apply API-resolved track code when salt is auto-built
        if (orderInfo.salt === undefined) {
            order.setSource(feeParams.source)
        }

        return order
    }

    public submitOrder(order: LimitOrder, signature: string): Promise<void> {
        return this.api.submitOrder(order, signature)
    }

    private getFeeParams(orderInfo: OrderInfoData): Promise<FeeInfoDTO> {
        return this.api.getFeeParams({
            makerAsset: orderInfo.makerAsset,
            takerAsset: orderInfo.takerAsset,
            makerAmount: orderInfo.makingAmount,
            takerAmount: orderInfo.takingAmount
        })
    }
}
