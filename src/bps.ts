import assert from 'assert'

/**
 * Basis point in range [0, 100]%
 *
 * 1bps = 0.01%
 */
export class Bps {
    static ZERO = new Bps(0n)

    constructor(public readonly value: bigint) {
        assert(value >= 0 && value <= 10000, `invalid bps ${value}`)
    }

    /**
     * Create BPS from percent value.
     * If `value` has precision more than 1bps (with accounting to `base`), it will be rounded down
     * @param val
     * @param base what represents 100%
     */
    public static fromPercent(val: number, base = 1n): Bps {
        return Bps.fromSharePercent(val, base)
    }

    /**
     * Create BPS from a percent value (0–100) using decimal-safe parsing.
     * E.g. 84.45% → 8445 bps
     */
    public static fromSharePercent(val: number | string, base = 1n): Bps {
        const normalized = typeof val === 'number' ? val.toString() : val.trim()
        assert(!normalized.startsWith('-'), `invalid bps ${normalized}`)

        const [wholePart = '0', fracPart = ''] = normalized.split('.')
        const fracBps = (fracPart + '00').slice(0, 2)
        const bps = BigInt(wholePart || '0') * 100n + BigInt(fracBps || '0')

        return new Bps(bps / base)
    }

    /**
     * Create BPS from fraction value.
     * If `value` has precision more than 1bps (with accounting to `base`), it will be rounded down
     * @param val
     * @param base what represents 100%
     */
    public static fromFraction(val: number, base = 1n): Bps {
        return new Bps(BigInt(10000 * val) / base)
    }

    public equal(other: Bps): boolean {
        return this.value === other.value
    }

    public isZero(): boolean {
        return this.value === 0n
    }

    /**
     * @param base what represents 100%
     */
    public toPercent(base = 1n): number {
        return Number(this.value * base) / 100
    }

    /**
     * @param base what represents 100%
     */
    public toFraction(base = 1n): number {
        return Number(this.value * base) / 10000
    }

    public toString(): string {
        return this.value.toString()
    }
}
