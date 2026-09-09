import {NativeOrdersFactory} from './native-order-factory.js'
import {LimitOrder} from '../limit-order/limit-order.js'
import {Address} from '../address.js'
import {getNativeOrderFactoryContract} from '../constants.js'

describe('NativeOrdersFactory', () => {
    it('should use the chain default factory address', () => {
        const factory = NativeOrdersFactory.default(1)

        expect(factory.address).toEqual(
            new Address(getNativeOrderFactoryContract(1))
        )
    })

    it('should encode create calldata with maker and makingAmount as value', () => {
        const maker = new Address('0x00000000219ab540356cbb839cbe05303d7705fa')
        const order = new LimitOrder({
            makerAsset: new Address(
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            ),
            takerAsset: new Address(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ),
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker,
            salt: 10n
        })
        const factory = NativeOrdersFactory.default(1)
        const call = factory.create(maker, order.build())

        expect(call.to).toEqual(factory.address)
        expect(call.value).toEqual(order.makingAmount)
        expect(call.data.startsWith('0x')).toEqual(true)
        expect(call.data.length).toBeGreaterThan(10)
    })
})
