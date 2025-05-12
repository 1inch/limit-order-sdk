import {Address} from '../address'
import {
    LimitOrderWithFee,
    MakerTraits,
    OrderInfoData,
    FeeTakerExt,
    Interaction
} from '../limit-order'
import {Api, ApiConfig} from '../api'
import {Bps} from '../bps'

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
        } = {}
    ): Promise<LimitOrderWithFee> {
        const feeParams = await this.api.getFeeParams({
            makerAsset: orderInfo.makerAsset,
            takerAsset: orderInfo.takerAsset,
            makerAmount: orderInfo.makingAmount,
            takerAmount: orderInfo.takingAmount
        })

        const feeExt = FeeTakerExt.FeeTakerExtension.new(
            new Address(feeParams.extensionAddress),
            FeeTakerExt.Fees.resolverFee(
                new FeeTakerExt.ResolverFee(
                    new Address(feeParams.protocolFeeReceiver),
                    new Bps(BigInt(feeParams.feeBps)),
                    Bps.fromPercent(feeParams.whitelistDiscountPercent)
                )
            ),
            feeParams.whitelist.map((w) => new Address(w)),
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
