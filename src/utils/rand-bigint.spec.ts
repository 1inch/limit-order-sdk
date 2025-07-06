import {randBigInt} from './rand-bigint.js'

describe('randBigint', () => {
    it('should generate rand bigint in correct interval', () => {
        expect(randBigInt(1)).toBeGreaterThanOrEqual(0n)
        expect(randBigInt(1)).toBeLessThanOrEqual(1n)

        expect(randBigInt(10n)).toBeGreaterThanOrEqual(0)
        expect(randBigInt(10n)).toBeLessThanOrEqual(10n)

        expect(randBigInt(2n << 96n)).toBeGreaterThanOrEqual(0)
        expect(randBigInt(2n << 96n)).toBeLessThanOrEqual(2n << 96n)
    })
})
