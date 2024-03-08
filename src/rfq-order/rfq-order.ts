import {LimitOrder, MakerTraits, OrderInfoData} from '../limit-order'
import {Address} from '../address'

/**
 * Light, gas efficient version of LimitOrder
 * It does not support multiple/partial fills and extension
 */
export class RfqOrder extends LimitOrder {
    private static DEFAULT_OPTIONS = {
        unwrapToNative: false,
        usePermit2: false
    }

    constructor(
        orderInfo: OrderInfoData,
        options: {
            allowedSender?: Address
            /**
             * Timestamp in seconds
             */
            expiration: bigint
            /**
             * Unique id among all maker orders
             */
            nonce: bigint
            /**
             * Should be dest token unwrapped to native currency, or not
             * Useful only when dest token is `WRAPPED` token
             *
             * @default false
             */
            unwrapToNative?: boolean
            /**
             * Should `permit2` be used to transfer funds from maker
             *
             * @default false
             * @see https://github.com/Uniswap/permit2
             */
            usePermit2?: boolean
        }
    ) {
        const {allowedSender, nonce, expiration, usePermit2, unwrapToNative} = {
            ...RfqOrder.DEFAULT_OPTIONS,
            ...options
        }

        const makerTraits = new MakerTraits(0n)
            .disableMultipleFills()
            .disablePartialFills()
            .withExpiration(expiration)
            .withNonce(nonce)

        if (allowedSender) {
            makerTraits.withAllowedSender(allowedSender)
        }

        if (unwrapToNative) {
            makerTraits.enableNativeUnwrap()
        }

        if (usePermit2) {
            makerTraits.enablePermit2()
        }

        super(orderInfo, makerTraits)
    }
}
