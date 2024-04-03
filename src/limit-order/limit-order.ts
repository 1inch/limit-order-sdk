import {AbiCoder} from 'ethers'
import {isHexString, UINT_160_MAX, UINT_256_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {
    buildOrderTypedData,
    getLimitOrderV4Domain,
    getOrderHash,
    EIP712TypedData
} from './eip712'
import {LimitOrderV4Struct, OrderInfoData} from './types'
import {MakerTraits} from './maker-traits'
import {Extension} from './extension'
import {Address} from '../address'
import {randBigInt} from '../utils/rand-bigint'

export class LimitOrder {
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

    public readonly salt: bigint

    public readonly maker: Address

    public readonly receiver: Address

    public readonly makerAsset: Address

    public readonly takerAsset: Address

    public readonly makingAmount: bigint

    public readonly takingAmount: bigint

    public readonly makerTraits: MakerTraits

    constructor(
        orderInfo: OrderInfoData,
        makerTraits = new MakerTraits(0n),
        public readonly extension: Extension = Extension.default()
    ) {
        this.makerAsset = orderInfo.makerAsset
        this.takerAsset = orderInfo.takerAsset
        this.makingAmount = orderInfo.makingAmount
        this.takingAmount = orderInfo.takingAmount
        this.salt = orderInfo.salt || LimitOrder.buildSalt(extension)
        this.maker = orderInfo.maker
        this.receiver = orderInfo.receiver?.equal(orderInfo.maker)
            ? Address.ZERO_ADDRESS
            : orderInfo.receiver || Address.ZERO_ADDRESS
        this.makerTraits = makerTraits

        assert(this.salt <= UINT_256_MAX, 'salt too big')
        assert(this.makingAmount <= UINT_256_MAX, 'makingAmount too big')
        assert(this.takingAmount <= UINT_256_MAX, 'takingAmount too big')

        if (!extension.isEmpty()) {
            this.makerTraits.withExtension()
        }
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
        baseSalt = randBigInt((2n << 96n) - 1n)
    ): bigint {
        if (extension.isEmpty()) {
            return baseSalt
        }

        return (baseSalt << 160n) | (extension.keccak256() & UINT_160_MAX)
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
                salt: order.salt && BigInt(order.salt),
                maker: new Address(order.maker),
                receiver: new Address(order.receiver),
                takingAmount: BigInt(order.takingAmount),
                makingAmount: BigInt(order.makingAmount),
                takerAsset: new Address(order.takerAsset),
                makerAsset: new Address(order.makerAsset)
            },
            new MakerTraits(BigInt(order.makerTraits))
        )
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
