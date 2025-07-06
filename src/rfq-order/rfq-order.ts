import {LimitOrder, MakerTraits, OrderInfoData} from '../limit-order/index.js'
import {Address} from '../address.js'

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
            usePermit2?: boolean
        }
    ) {
        const {allowedSender, nonce, expiration, usePermit2} = options

        const makerTraits = new MakerTraits(0n)
            .disableMultipleFills()
            .allowPartialFills()
            .withExpiration(expiration)
            .withNonce(nonce)

        if (allowedSender) {
            makerTraits.withAllowedSender(allowedSender)
        }

        if (usePermit2) {
            makerTraits.enablePermit2()
        }

        super(orderInfo, makerTraits)
    }
}
