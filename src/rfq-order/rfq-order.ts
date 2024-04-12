import {LimitOrder, MakerTraits, OrderInfoData} from '../limit-order'
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
        }
    ) {
        const {allowedSender, nonce, expiration} = options

        const makerTraits = new MakerTraits(0n)
            .disableMultipleFills()
            .allowPartialFills()
            .withExpiration(expiration)
            .withNonce(nonce)

        if (allowedSender) {
            makerTraits.withAllowedSender(allowedSender)
        }

        super(orderInfo, makerTraits)
    }
}
