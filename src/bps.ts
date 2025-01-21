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
        return new Bps(BigInt(100 * val) / base)
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
