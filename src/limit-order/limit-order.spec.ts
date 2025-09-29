import {LimitOrder} from './limit-order.js'
import {ExtensionBuilder} from './extensions/extension-builder.js'
import {MakerTraits} from './maker-traits.js'
import {Extension} from './extensions/index.js'
import {Address} from '../address.js'
import {ProxyFactory} from '../limit-order-contract/index.js'

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

        expect(order.receiver).toEqual(Address.ZERO_ADDRESS)
        expect(LimitOrder.fromCalldata(order.toCalldata())).toEqual(order)
    })

    it('should create limit order and set receiver == maker', () => {
        const ext = new ExtensionBuilder().build()

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
            ext,
            {optimizeReceiverAddress: false}
        )

        expect(order.receiver).toEqual(order.maker)
        expect(LimitOrder.fromCalldata(order.toCalldata())).toEqual(order)
        expect(LimitOrder.fromDataAndExtension(order.build(), ext)).toEqual(
            order
        )
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

describe('Limit Order Native', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1)
    jest.spyOn(Date, 'now').mockReturnValue(1673549418040)

    it('should correct detect that order is from native asset', () => {
        const nativeOrderFactory = new ProxyFactory(
            Address.fromBigInt(228n),
            Address.fromBigInt(2n)
        )

        const maker = new Address('0x00000000219ab540356cbb839cbe05303d7705fa')

        const nativeOrder = LimitOrder.fromNative(
            1,
            nativeOrderFactory,
            {
                takerAsset: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                makingAmount: 1000000000000000000n,
                takingAmount: 1420000000n,
                maker,
                salt: 10n
            },
            MakerTraits.default().withExtension(),
            Extension.default()
        )

        expect(nativeOrder.receiver).toEqual(maker)

        expect(
            nativeOrder.isNative(
                1,
                nativeOrderFactory,
                nativeOrder.nativeSignature(maker)
            )
        ).toEqual(true)

        expect(
            LimitOrder.fromDataAndExtension(
                nativeOrder.build(),
                nativeOrder.extension
            ).isNative(
                1,
                nativeOrderFactory,
                nativeOrder.nativeSignature(maker)
            )
        ).toEqual(true)
    })

    it('should correct detect that order is from native asset (no salt)', () => {
        const nativeOrderFactory = new ProxyFactory(
            Address.fromBigInt(228n),
            Address.fromBigInt(2n)
        )

        const maker = new Address('0x00000000219ab540356cbb839cbe05303d7705fa')

        const nativeOrder = LimitOrder.fromNative(
            1,
            nativeOrderFactory,
            {
                takerAsset: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                makingAmount: 1000000000000000000n,
                takingAmount: 1420000000n,
                maker
            },
            MakerTraits.default().withExtension(),
            Extension.default()
        )

        expect(nativeOrder.receiver).toEqual(maker)

        expect(
            nativeOrder.isNative(
                1,
                nativeOrderFactory,
                nativeOrder.nativeSignature(maker)
            )
        ).toEqual(true)

        expect(
            LimitOrder.fromDataAndExtension(
                nativeOrder.build(),
                nativeOrder.extension
            ).isNative(
                1,
                nativeOrderFactory,
                nativeOrder.nativeSignature(maker)
            )
        ).toEqual(true)
    })

    it('should correct detect that order is NOT from native asset', () => {
        const nativeOrderFactory = new ProxyFactory(
            Address.fromBigInt(228n),
            Address.fromBigInt(2n)
        )

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
            maker
        })

        expect(order.receiver).toEqual(Address.ZERO_ADDRESS)
        expect(
            order.isNative(1, nativeOrderFactory, order.nativeSignature(maker))
        ).toEqual(false)

        expect(
            LimitOrder.fromDataAndExtension(
                order.build(),
                order.extension
            ).isNative(1, nativeOrderFactory, order.nativeSignature(maker))
        ).toEqual(false)
    })
})
