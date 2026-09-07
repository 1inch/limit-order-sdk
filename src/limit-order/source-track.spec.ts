import {extractTrackCode, injectTrackCode} from './source-track.js'

describe('source-track', () => {
    it('should clear track bits when source is omitted', () => {
        const salted = injectTrackCode((1n << 224n) | 99n)

        expect(extractTrackCode(salted)).toEqual('0x00000000')
        expect(salted & ((1n << 224n) - 1n)).toEqual(99n)
    })

    it('should inject a 4-byte hex source as-is', () => {
        const salted = injectTrackCode(10n, '0xdeadbeef')

        expect(extractTrackCode(salted)).toEqual('0xdeadbeef')
    })

    it('should take the first 4 bytes of a 32-byte hex source', () => {
        const hash =
            '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
        const salted = injectTrackCode(10n, hash)

        expect(extractTrackCode(salted)).toEqual('0xabcdef01')
    })

    it('should hash a non-hex or odd-length hex source', () => {
        const fromName = injectTrackCode(10n, 'my-dapp')
        const fromOddHex = injectTrackCode(10n, '0xabc')

        expect(extractTrackCode(fromName)).toEqual('0xaba10994')
        expect(extractTrackCode(fromOddHex)).toMatch(/^0x[0-9a-f]{8}$/)
        expect(extractTrackCode(fromOddHex)).not.toEqual('0x00000abc')
    })
})
