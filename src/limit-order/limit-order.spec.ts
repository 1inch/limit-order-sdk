import {LimitOrder} from './limit-order.js'
import {ExtensionBuilder} from './extensions/extension-builder.js'
import {MakerTraits} from './maker-traits.js'
import {Address} from '../address.js'

describe('Limit Order', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1)
    jest.spyOn(Date, 'now').mockReturnValue(1673549418040)

    it('should create limit order', () => {
        const order = new LimitOrder({
            makerAsset: new Address(
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            ),
            takerAsset: new Address(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ),
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker: new Address('0x00000000219ab540356cbb839cbe05303d7705fa')
        })

        expect(LimitOrder.fromCalldata(order.toCalldata())).toEqual(order)
    })

    it('should create limit order with passed salt', () => {
        const order = new LimitOrder({
            makerAsset: new Address(
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            ),
            takerAsset: new Address(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ),
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker: new Address('0x00000000219ab540356cbb839cbe05303d7705fa'),
            salt: 10n
        })

        expect(LimitOrder.fromCalldata(order.toCalldata())).toEqual(order)
    })

    it('should create limit order with extension and salt', () => {
        const ext = new ExtensionBuilder().withCustomData('0xdeadbeef').build()
        const order = new LimitOrder(
            {
                makerAsset: new Address(
                    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                ),
                takerAsset: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                makingAmount: 1000000000000000000n,
                takingAmount: 1420000000n,
                maker: new Address(
                    '0x00000000219ab540356cbb839cbe05303d7705fa'
                ),
                salt: LimitOrder.buildSalt(ext)
            },
            MakerTraits.default(),
            ext
        )

        expect(LimitOrder.fromDataAndExtension(order.build(), ext)).toEqual(
            order
        )
    })
})
