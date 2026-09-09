import {NativeOrdersImpl} from './native-order-impl.js'
import {LimitOrder} from '../limit-order/limit-order.js'
import {Address} from '../address.js'
import {getNativeOrderImplContract} from '../constants.js'

describe('NativeOrdersImpl', () => {
    const maker = new Address('0x00000000219ab540356cbb839cbe05303d7705fa')
    const order = new LimitOrder({
        makerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
        takerAsset: new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
        makingAmount: 1000000000000000000n,
        takingAmount: 1420000000n,
        maker,
        salt: 10n
    })
    const impl = new NativeOrdersImpl(
        new Address(getNativeOrderImplContract(1))
    )

    it('should encode cancelOrder with zero value', () => {
        const call = impl.cancel(maker, order.build())

        expect(call.to).toEqual(impl.address)
        expect(call.value).toEqual(0n)
        expect(call.data.startsWith('0x')).toEqual(true)
    })

    it('should encode cancelExpiredOrderByResolver', () => {
        const call = impl.cancelExpiredOrderByResolver(maker, order.build(), 5n)

        expect(call.to).toEqual(impl.address)
        expect(call.value).toEqual(0n)
        expect(call.data.startsWith('0x')).toEqual(true)
        expect(call.data.length).toBeGreaterThan(10)
    })
})
