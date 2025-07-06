import {Address} from '../address.js'
import {
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
        const feeParams = await this.api.getFeeParams({
            makerAsset: orderInfo.makerAsset,
            takerAsset: orderInfo.takerAsset,
            makerAmount: orderInfo.makingAmount,
            takerAmount: orderInfo.takingAmount
        })

        const fees = new FeeTakerExt.Fees(
            new FeeTakerExt.ResolverFee(
                new Address(feeParams.protocolFeeReceiver),
                new Bps(BigInt(feeParams.feeBps)),
                Bps.fromPercent(feeParams.whitelistDiscountPercent)
            ),
            extra.integratorFee ?? FeeTakerExt.IntegratorFee.ZERO
        )

        const feeExt = FeeTakerExt.FeeTakerExtension.new(
            new Address(feeParams.extensionAddress),
            fees,
            Object.values(feeParams.whitelist).map((w) => new Address(w)),
            {
                ...extra,
                customReceiver: orderInfo.receiver
            }
        )

        return new LimitOrderWithFee(orderInfo, makerTraits, feeExt)
    }

    public submitOrder(
        order: LimitOrderWithFee,
        signature: string
    ): Promise<void> {
        return this.api.submitOrder(order, signature)
    }
}
