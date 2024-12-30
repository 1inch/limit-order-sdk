import assert from 'assert'

/**
 * Basis point in range [0, 100]%
 *
 * 1bps = 0.01%
 */
export class Bps {
    static ZERO = new Bps(0)

    constructor(public readonly value: number) {
        assert(value >= 0 && value <= 10000, `invalid bps ${value}`)
    }

    public static fromPercent(val: number): Bps {
        return new Bps(100 * val)
    }

    public static fromFraction(val: number, base = 1): Bps {
        return new Bps((10000 * val) / base)
    }

    public toPercent(): number {
        return this.value / 100
    }

    public toFraction(base = 1): number {
        return (this.value * base) / 10000
    }

    public toString(): string {
        return this.value.toString()
    }
}
