import {
    ExtensionBuilder,
    LimitOrder,
    MakerTraits,
    OrderInfoData
} from '../limit-order'
import {Address} from '../address'

/**
 * Light, gas efficient version of LimitOrder
 * It does not support multiple fills and extension
 */
export class RfqOrder extends LimitOrder {
    constructor(
        orderInfo: Omit<OrderInfoData, 'salt' | 'receiver'>,
        options: {
            allowedSender?: Address
            /**
             * Timestamp in seconds
             */
            expiration: bigint
            /**
             * Unique id among all maker orders
             * Max value is UINT_40_MAX
             */
            nonce: bigint
            /**
             * Maker permit to approve tokens for LOP v4
             */
            permit?: {
                /**
                 * 0x prefixed without the token address
                 */
                data: string
                /**
                 * Default is false
                 */
                isPermit2?: boolean
            }
        }
    ) {
        const {allowedSender, nonce, expiration, permit} = options

        const makerTraits = new MakerTraits(0n)
            .disableMultipleFills()
            .allowPartialFills()
            .withExpiration(expiration)
            .withNonce(nonce)

        if (allowedSender) {
            makerTraits.withAllowedSender(allowedSender)
        }

        const extension = new ExtensionBuilder()

        if (permit) {
            extension.withMakerPermit(orderInfo.makerAsset, permit.data)

            if (permit.isPermit2) {
                makerTraits.enablePermit2()
            }
        }

        super(orderInfo, makerTraits, extension.build())
    }
}
