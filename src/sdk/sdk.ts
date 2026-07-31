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
import {Api, ApiConfig} from '../api/index.js'
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
     * fast instead of silently building orders without fees. Pass
     * `allowFeeless: true` to build a plain LimitOrder (no fee extension) for
     * an intentionally feeless org - a zero-fee extension is not encodable.
     *
     * @returns LimitOrderWithFee to sign and submit to relayer
     */
    public async createOrder(
        orderInfo: OrderInfoData,
        makerTraits?: MakerTraits,
        extra?: {
            makerPermit?: Interaction
            integratorFee?: FeeTakerExt.IntegratorFee
            allowFeeless?: false
        }
    ): Promise<LimitOrderWithFee>

    public async createOrder(
        orderInfo: OrderInfoData,
        makerTraits?: MakerTraits,
        extra?: {
            makerPermit?: Interaction
            integratorFee?: FeeTakerExt.IntegratorFee
            allowFeeless: true
        }
    ): Promise<LimitOrder>

    public async createOrder(
        orderInfo: OrderInfoData,
        makerTraits = MakerTraits.default(),
        extra: {
            makerPermit?: Interaction
            integratorFee?: FeeTakerExt.IntegratorFee
            allowFeeless?: boolean
        } = {}
    ): Promise<LimitOrder> {
        const feeParams = await this.api.getFeeParams({
            makerAsset: orderInfo.makerAsset,
            takerAsset: orderInfo.takerAsset,
            makerAmount: orderInfo.makingAmount,
            takerAmount: orderInfo.takingAmount
        })

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

        const isFeeless = resolverFee.fee.isZero() && integratorFee.fee.isZero()

        if (isFeeless && !extra.allowFeeless) {
            throw new Error(
                'pair has zero fees for this org - pass allowFeeless: true to build a plain LimitOrder without the fee extension'
            )
        }

        const order = isFeeless
            ? this.createOrderWithoutFees(orderInfo, makerTraits, extra)
            : this.createOrderWithFees(
                  orderInfo,
                  makerTraits,
                  new FeeTakerExt.Fees(resolverFee, integratorFee),
                  feeParams.extensionAddress,
                  feeParams.whitelist,
                  extra
              )

        // Apply API-resolved track code when salt is auto-built
        if (orderInfo.salt === undefined) {
            order.setSource(feeParams.source)
        }

        return order
    }

    public submitOrder(order: LimitOrder, signature: string): Promise<void> {
        return this.api.submitOrder(order, signature)
    }

    private createOrderWithFees(
        orderInfo: OrderInfoData,
        makerTraits: MakerTraits,
        fees: FeeTakerExt.Fees,
        extensionAddress: string,
        whitelist: Record<string, string>,
        extra: {makerPermit?: Interaction}
    ): LimitOrderWithFee {
        const feeExt = FeeTakerExt.FeeTakerExtension.new(
            new Address(extensionAddress),
            fees,
            Object.values(whitelist).map((w) => new Address(w)),
            {
                ...extra,
                customReceiver: orderInfo.receiver
            }
        )

        return new LimitOrderWithFee(orderInfo, makerTraits, feeExt)
    }

    private createOrderWithoutFees(
        orderInfo: OrderInfoData,
        makerTraits: MakerTraits,
        extra: {makerPermit?: Interaction}
    ): LimitOrder {
        const extension = extra.makerPermit
            ? new ExtensionBuilder()
                  .withMakerPermit(
                      extra.makerPermit.target,
                      extra.makerPermit.data
                  )
                  .build()
            : undefined

        return new LimitOrder(orderInfo, makerTraits, extension)
    }
}
