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
})
