import {keccak256} from 'ethers'
import {BytesIter, isHexString, trim0x, UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {ZX} from '../../constants.js'

export class Extension {
    public static EMPTY = {
        makerAssetSuffix: ZX,
        takerAssetSuffix: ZX,
        makingAmountData: ZX,
        takingAmountData: ZX,
        predicate: ZX,
        makerPermit: ZX,
        preInteraction: ZX,
        postInteraction: ZX,
        customData: ZX
    }

    private static fields = [
        'makerAssetSuffix',
        'takerAssetSuffix',
        'makingAmountData',
        'takingAmountData',
        'predicate',
        'makerPermit',
        'preInteraction',
        'postInteraction'
    ] as const

    public readonly makerAssetSuffix: string = ZX

    public readonly takerAssetSuffix: string = ZX

    public readonly makingAmountData: string = ZX

    public readonly takingAmountData: string = ZX

    public readonly predicate: string = ZX

    public readonly makerPermit: string = ZX

    public readonly preInteraction: string = ZX

    public readonly postInteraction: string = ZX

    public readonly customData: string = ZX

    constructor(data = Extension.EMPTY) {
        Object.entries(data).forEach(([key, val]) =>
            assert(
                isHexString(val) || val === ZX,
                `${key} must be valid hex string`
            )
        )

        this.makerAssetSuffix = data.makerAssetSuffix
        this.takerAssetSuffix = data.takerAssetSuffix
        this.makingAmountData = data.makingAmountData
        this.takingAmountData = data.takingAmountData
        this.predicate = data.predicate
        this.makerPermit = data.makerPermit
        this.preInteraction = data.preInteraction
        this.postInteraction = data.postInteraction
        this.customData = data.customData
    }

    get hasPredicate(): boolean {
        return this.predicate !== ZX
    }

    get hasMakerPermit(): boolean {
        return this.makerPermit !== ZX
    }

    static decode(bytes: string): Extension {
        if (bytes === ZX) {
            return Extension.default()
        }

        const iter = BytesIter.HexString(bytes)
        let offsets = BigInt(iter.nextUint256())
        let consumed = 0

        const data = {} as Record<
            (typeof Extension.fields)[number] | 'customData',
            string
        >

        for (const field of Extension.fields) {
            const offset = Number(offsets & UINT_32_MAX)
            const bytesCount = offset - consumed
            data[field] = iter.nextBytes(bytesCount)

            consumed += bytesCount
            offsets = offsets >> 32n
        }

        data.customData = iter.rest()

        return new Extension(data)
    }

    static default(): Extension {
        return new Extension()
    }

    public keccak256(): bigint {
        return BigInt(keccak256(this.encode()))
    }

    public isEmpty(): boolean {
        const allInteractions = this.getAll()
        const allInteractionsConcat =
            allInteractions.map(trim0x).join('') + trim0x(this.customData)

        return allInteractionsConcat.length === 0
    }

    /**
     * Hex string with 0x
     */
    public encode(): string {
        const allInteractions = this.getAll()

        const allInteractionsConcat =
            allInteractions.map(trim0x).join('') + trim0x(this.customData)

        // https://stackoverflow.com/a/55261098/440168
        const cumulativeSum = (
            (sum) =>
            (value: number): number => {
                sum += value

                return sum
            }
        )(0)
        const offsets = allInteractions
            .map((a) => a.length / 2 - 1)
            .map(cumulativeSum)
            .reduce((acc, a, i) => acc + (BigInt(a) << BigInt(32 * i)), 0n)

        let extension = '0x'

        if (allInteractionsConcat.length > 0) {
            extension +=
                offsets.toString(16).padStart(64, '0') + allInteractionsConcat
        }

        return extension
    }

    private getAll(): string[] {
        return Extension.fields.map((f) => this[f])
    }
}
