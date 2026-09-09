import {Bps} from './bps.js'

describe('Bps', () => {
    describe('fromSharePercent', () => {
        it('should convert decimal percent to bps without float error', () => {
            expect(Bps.fromSharePercent(84.45).value).toBe(8445n)
        })

        it('should parse percent from string', () => {
            expect(Bps.fromSharePercent('84.45').value).toBe(8445n)
        })

        it('should handle integer percent', () => {
            expect(Bps.fromSharePercent(90).value).toBe(9000n)
        })

        it('should handle zero', () => {
            expect(Bps.fromSharePercent(0).value).toBe(0n)
        })

        it('should preserve negative sign for decimal percent', () => {
            expect(() => Bps.fromSharePercent(-0.5)).toThrow(/invalid bps/)
            expect(() => Bps.fromSharePercent(-1.5)).toThrow(/invalid bps/)
        })
    })

    it('should convert percent and fraction both ways', () => {
        expect(Bps.fromPercent(1).value).toBe(100n)
        expect(Bps.fromFraction(0.01).value).toBe(100n)
        expect(Bps.fromPercent(1).toPercent()).toBe(1)
        expect(Bps.fromPercent(1).toFraction()).toBe(0.01)
        expect(Bps.fromPercent(1).toString()).toBe('100')
        expect(Bps.fromPercent(1).equal(new Bps(100n))).toBe(true)
        expect(Bps.ZERO.isZero()).toBe(true)
        expect(() => new Bps(-1n)).toThrow(/invalid bps/)
        expect(() => new Bps(10001n)).toThrow(/invalid bps/)
        expect(Bps.fromSharePercent('1.2', 1n).value).toBe(120n)
        expect(Bps.fromSharePercent('.').value).toBe(0n)
        expect(Bps.fromSharePercent('').value).toBe(0n)
    })
})
