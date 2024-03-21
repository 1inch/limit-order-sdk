import {AbiCoder} from 'ethers'
import {isHexString, UINT_160_MAX} from '@1inch/byte-utils'
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

const ZeroAddressHalf = '0'.repeat(20)

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
        this.receiver = orderInfo.receiver || Address.ZERO_ADDRESS
        this.makerTraits = makerTraits

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
        baseSalt = BigInt(Math.round(Math.random() * Date.now()))
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

    public getTypedData(domain = getLimitOrderV4Domain(1)): EIP712TypedData {
        return buildOrderTypedData(
            domain.chainId,
            domain.verifyingContract,
            domain.name,
            domain.version,
            this.build()
        )
    }

    public getOrderHash(chainId: number): string {
        return getOrderHash(this.getTypedData(getLimitOrderV4Domain(chainId)))
    }

    public isOrderPrivate(): boolean {
        return this.makerTraits.allowedSender() !== ZeroAddressHalf
    }
}
