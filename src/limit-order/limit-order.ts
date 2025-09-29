import {AbiCoder} from 'ethers'
import {isHexString, UINT_160_MAX, UINT_256_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {
    buildOrderTypedData,
    getLimitOrderV4Domain,
    getOrderHash,
    EIP712TypedData
} from './eip712/index.js'
import {LimitOrderV4Struct, OrderInfoData} from './types.js'
import {MakerTraits} from './maker-traits.js'
import {Extension} from './extensions/extension.js'
import {injectTrackCode} from './source-track.js'
import {Address} from '../address.js'
import {randBigInt} from '../utils/rand-bigint.js'
import {ProxyFactory} from '../limit-order-contract/index.js'

export class LimitOrder {
    public static readonly CHAIN_TO_WRAPPER: Record<number, Address> = {
        [1]: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
        [56]: new Address('0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'),
        [137]: new Address('0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'),
        [42161]: new Address('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'),
        [43114]: new Address('0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'),
        [100]: new Address('0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'),
        [8453]: new Address('0x4200000000000000000000000000000000000006'),
        [10]: new Address('0x4200000000000000000000000000000000000006'),
        [250]: new Address('0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'),
        [324]: new Address('0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'),
        [59144]: new Address('0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f'),
        [130]: new Address('0x4200000000000000000000000000000000000006'),
        [146]: new Address('0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38')
    }

    private static readonly Web3Type = `tuple(${[
        'uint256 salt',
        'address maker',
        'address receiver',
        'address makerAsset',
        'address takerAsset',
        'uint256 makingAmount',
        'uint256 takingAmount',
        'uint256 makerTraits'
    ]})`

    public readonly maker: Address

    public receiver: Address

    public readonly makerAsset: Address

    public readonly takerAsset: Address

    public readonly makingAmount: bigint

    public readonly takingAmount: bigint

    public readonly makerTraits: MakerTraits

    private _salt: bigint

    constructor(
        orderInfo: OrderInfoData,
        makerTraits = new MakerTraits(0n),
        public readonly extension: Extension = Extension.default(),
        config: {optimizeReceiverAddress: boolean} = {
            /**
             * When enabled, orders where maker == receiver will have ZERO_ADDRESS set
             * Used to save calldata costs
             */
            optimizeReceiverAddress: true
        }
    ) {
        assert(
            !orderInfo.takerAsset.isNative(),
            `${orderInfo.takerAsset} can not be 'takerAsset'. Use wrapper address as 'takerAsset' and 'makerTraits.enableNativeUnwrap' to swap to NATIVE currency`
        )

        assert(
            !orderInfo.makerAsset.isNative(),
            'Maker asset can not be NATIVE, use wrapper'
        )

        this.makerAsset = orderInfo.makerAsset
        this.takerAsset = orderInfo.takerAsset
        this.makingAmount = orderInfo.makingAmount
        this.takingAmount = orderInfo.takingAmount
        this._salt = LimitOrder.verifySalt(
            orderInfo.salt || LimitOrder.buildSalt(extension),
            extension
        )
        this.maker = orderInfo.maker

        if (config.optimizeReceiverAddress) {
            this.receiver = orderInfo.receiver?.equal(orderInfo.maker)
                ? Address.ZERO_ADDRESS
                : orderInfo.receiver || Address.ZERO_ADDRESS
        } else {
            this.receiver = orderInfo.receiver || orderInfo.maker
        }

        this.makerTraits = makerTraits

        assert(this.makingAmount <= UINT_256_MAX, 'makingAmount too big')
        assert(this.takingAmount <= UINT_256_MAX, 'takingAmount too big')

        if (!extension.isEmpty()) {
            this.makerTraits.withExtension()
        }
    }

    public get salt(): bigint {
        return this._salt
    }

    /**
     * Build correct salt for order
     *
     * If order has extension - it is crucial to build correct salt
     * otherwise order won't be ever filled
     *
     * @see https://github.com/1inch/limit-order-protocol/blob/7bc5129ae19832338169ca21e4cf6331e8ff44f6/contracts/OrderLib.sol#L153
     *
     */
    static buildSalt(
        extension: Extension,
        baseSalt = randBigInt((1n << 96n) - 1n)
    ): bigint {
        if (extension.isEmpty()) {
            return baseSalt
        }

        return (baseSalt << 160n) | (extension.keccak256() & UINT_160_MAX)
    }

    static verifySalt(salt: bigint, extension: Extension): bigint {
        assert(salt <= UINT_256_MAX, 'salt too big')

        if (extension.isEmpty()) {
            return salt
        }

        const hash = salt & UINT_160_MAX
        const expectedHash = extension.keccak256() & UINT_160_MAX
        assert(
            hash === expectedHash,
            'invalid salt: lowest 160 bits should be extension hash'
        )

        return salt
    }

    static fromNative(
        chainId: number,
        nativeOrderFactory: ProxyFactory,
        orderInfo: Omit<OrderInfoData, 'makerAsset'>,
        makerTraits: MakerTraits,
        extension: Extension
    ): LimitOrder {
        const _orderInfo: OrderInfoData = {
            ...orderInfo,
            makerAsset: LimitOrder.CHAIN_TO_WRAPPER[chainId],
            receiver:
                orderInfo.receiver && !orderInfo.receiver.isZero()
                    ? orderInfo.receiver
                    : orderInfo.maker
        }

        // create temp order to calc order hash
        const _order = new LimitOrder(_orderInfo, makerTraits, extension, {
            optimizeReceiverAddress: false
        })

        const finalOrderInfo: OrderInfoData = {
            ..._orderInfo,
            salt: _order.salt,
            maker: nativeOrderFactory.getProxyAddress(
                _order.getOrderHash(chainId)
            )
        }

        return new LimitOrder(finalOrderInfo, makerTraits, extension, {
            optimizeReceiverAddress: false
        })
    }

    static isNativeOrder(
        chainId: number,
        nativeOrderFactory: ProxyFactory,
        order: LimitOrderV4Struct,
        signature: string
    ): boolean {
        try {
            const orderWithRealMaker = LimitOrder.fromCalldata(signature)
            const expectedAddress = nativeOrderFactory.getProxyAddress(
                orderWithRealMaker.getOrderHash(chainId)
            )

            return expectedAddress.equal(new Address(order.maker))
        } catch {
            return false
        }
    }

    static fromCalldata(bytes: string): LimitOrder {
        assert(
            isHexString(bytes),
            'Bytes should be valid hex string with 0x prefix'
        )

        const info = AbiCoder.defaultAbiCoder().decode(
            [LimitOrder.Web3Type],
            bytes
        )

        const order = info[0]

        return new LimitOrder(
            {
                salt: order.salt ? BigInt(order.salt) : undefined,
                maker: new Address(order.maker),
                receiver: new Address(order.receiver),
                takingAmount: BigInt(order.takingAmount),
                makingAmount: BigInt(order.makingAmount),
                takerAsset: new Address(order.takerAsset),
                makerAsset: new Address(order.makerAsset)
            },
            new MakerTraits(BigInt(order.makerTraits)),
            undefined,
            {optimizeReceiverAddress: false}
        )
    }

    static fromDataAndExtension(
        data: LimitOrderV4Struct,
        extension: Extension
    ): LimitOrder {
        return new LimitOrder(
            {
                salt: BigInt(data.salt),
                maker: new Address(data.maker),
                receiver: new Address(data.receiver),
                takingAmount: BigInt(data.takingAmount),
                makingAmount: BigInt(data.makingAmount),
                takerAsset: new Address(data.takerAsset),
                makerAsset: new Address(data.makerAsset)
            },
            new MakerTraits(BigInt(data.makerTraits)),
            extension,
            {optimizeReceiverAddress: false}
        )
    }

    public isNative(
        chainId: number,
        nativeOrderFactory: ProxyFactory,
        signature: string
    ): boolean {
        return LimitOrder.isNativeOrder(
            chainId,
            nativeOrderFactory,
            this.build(),
            signature
        )
    }

    /**
     * Returns signature for submitting native order on-chain
     * Only valid if order is native
     *
     * @see FusionOrder.isNative
     * @see FusionOrder.fromNative
     */
    public nativeSignature(maker: Address): string {
        return new LimitOrder(
            {
                maker,
                makerAsset: this.makerAsset,
                makingAmount: this.makingAmount,
                takingAmount: this.takingAmount,
                takerAsset: this.takerAsset,
                receiver: this.receiver,
                salt: this.salt
            },
            this.makerTraits,
            undefined,
            {optimizeReceiverAddress: false}
        ).toCalldata()
    }

    /**
     * Injects source info to order `salt` [224, 255] bits
     * check `getTrackCodeForSource` implementation for exact injected data
     *
     * @param source order source identifier
     * @see getTrackCodeForSource
     */
    public setSource(source: string): this {
        this._salt = injectTrackCode(this.salt, source)

        return this
    }

    public toCalldata(): string {
        return AbiCoder.defaultAbiCoder().encode(
            [LimitOrder.Web3Type],
            [this.build()]
        )
    }

    public build(): LimitOrderV4Struct {
        return {
            maker: this.maker.toString(),
            makerAsset: this.makerAsset.toString(),
            takerAsset: this.takerAsset.toString(),
            makerTraits: (this.makerTraits?.asBigInt() || 0n).toString(),
            salt: this.salt.toString(),
            makingAmount: this.makingAmount.toString(),
            takingAmount: this.takingAmount.toString(),
            receiver: this.receiver.toString()
        }
    }

    public getTypedData(chainId: number): EIP712TypedData {
        const domain = getLimitOrderV4Domain(chainId)

        return buildOrderTypedData(
            domain.chainId,
            domain.verifyingContract,
            domain.name,
            domain.version,
            this.build()
        )
    }

    public getOrderHash(chainId: number): string {
        return getOrderHash(this.getTypedData(chainId))
    }

    /**
     * Returns true if only a specific address can fill order
     */
    public isPrivate(): boolean {
        return this.makerTraits.isPrivate()
    }
}
