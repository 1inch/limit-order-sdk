import {UINT_256_MAX} from '@1inch/byte-utils'
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

    it('should inject and read track code via setSource/getTrackCode', () => {
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

        expect(order.getTrackCode()).toBe('0x00000000')

        order.setSource('my-dapp')

        expect(order.getTrackCode()).toBe('0xaba10994')
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

describe('Limit Order validation and hash', () => {
    const makerAsset = new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
    const takerAsset = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
    const maker = new Address('0x00000000219ab540356cbb839cbe05303d7705fa')

    it('should reject native maker or taker assets', () => {
        expect(
            () =>
                new LimitOrder({
                    makerAsset: Address.NATIVE_CURRENCY,
                    takerAsset,
                    makingAmount: 1n,
                    takingAmount: 1n,
                    maker
                })
        ).toThrow(/Maker asset can not be NATIVE/)

        expect(
            () =>
                new LimitOrder({
                    makerAsset,
                    takerAsset: Address.NATIVE_CURRENCY,
                    makingAmount: 1n,
                    takingAmount: 1n,
                    maker
                })
        ).toThrow(/can not be 'takerAsset'/)
    })

    it('should reject amounts or salt above uint256', () => {
        const tooBig = UINT_256_MAX + 1n

        expect(
            () =>
                new LimitOrder({
                    makerAsset,
                    takerAsset,
                    makingAmount: tooBig,
                    takingAmount: 1n,
                    maker
                })
        ).toThrow(/makingAmount too big/)

        expect(
            () =>
                new LimitOrder({
                    makerAsset,
                    takerAsset,
                    makingAmount: 1n,
                    takingAmount: tooBig,
                    maker
                })
        ).toThrow(/takingAmount too big/)

        expect(() =>
            LimitOrder.verifySalt(tooBig, Extension.default())
        ).toThrow(/salt too big/)
    })

    it('should reject salt that does not embed the extension hash', () => {
        const ext = new ExtensionBuilder().withCustomData('0xabcd').build()

        expect(() => LimitOrder.verifySalt(1n, ext)).toThrow(
            /lowest 160 bits should be extension hash/
        )
        expect(LimitOrder.verifySalt(10n, Extension.default())).toEqual(10n)
        expect(LimitOrder.buildSalt(Extension.default(), 42n)).toEqual(42n)
    })

    it('should rebuild an order whose calldata salt is zero', () => {
        const order = new LimitOrder({
            makerAsset,
            takerAsset,
            makingAmount: 1n,
            takingAmount: 1n,
            maker,
            salt: 0n
        })

        expect(
            LimitOrder.fromCalldata(order.toCalldata()).makingAmount
        ).toEqual(1n)
    })

    it('should optimize receiver to zero when it equals maker', () => {
        const order = new LimitOrder({
            makerAsset,
            takerAsset,
            makingAmount: 1n,
            takingAmount: 1n,
            maker,
            receiver: maker,
            salt: 10n
        })

        expect(order.receiver).toEqual(Address.ZERO_ADDRESS)
    })

    it('should keep a custom receiver and expose private fill', () => {
        const receiver = Address.fromBigInt(99n)
        const traits = MakerTraits.default().withAllowedSender(
            Address.fromBigInt(7n)
        )
        const order = new LimitOrder(
            {
                makerAsset,
                takerAsset,
                makingAmount: 1n,
                takingAmount: 1n,
                maker,
                receiver,
                salt: 10n
            },
            traits
        )

        expect(order.receiver).toEqual(receiver)
        expect(order.isPrivate()).toEqual(true)
        expect(order.getOrderHash(1)).toMatch(/^0x[0-9a-f]{64}$/)
        expect(order.getTypedData(1).primaryType).toEqual('Order')
    })

    it('should treat invalid native signatures as not native', () => {
        const nativeOrderFactory = new ProxyFactory(
            Address.fromBigInt(228n),
            Address.fromBigInt(2n)
        )
        const order = new LimitOrder({
            makerAsset,
            takerAsset,
            makingAmount: 1n,
            takingAmount: 1n,
            maker,
            salt: 10n
        })

        expect(
            LimitOrder.isNativeOrder(
                1,
                nativeOrderFactory,
                order.build(),
                'nope'
            )
        ).toEqual(false)
    })

    it('should keep a non-zero receiver on fromNative', () => {
        const nativeOrderFactory = new ProxyFactory(
            Address.fromBigInt(228n),
            Address.fromBigInt(2n)
        )
        const receiver = Address.fromBigInt(55n)
        const nativeOrder = LimitOrder.fromNative(
            1,
            nativeOrderFactory,
            {
                takerAsset,
                makingAmount: 1n,
                takingAmount: 1n,
                maker,
                receiver,
                salt: 10n
            },
            MakerTraits.default().withExtension(),
            Extension.default()
        )

        expect(nativeOrder.receiver).toEqual(receiver)
    })
})
