import {Extension} from './extension.js'

describe('Extension', () => {
    it('should encode/decode', () => {
        const ext = new Extension({
            makerAssetSuffix: '0x01',
            takerAssetSuffix: '0x02',
            makerPermit: '0x03',
            predicate: '0x04',
            makingAmountData: '0x05',
            takingAmountData: '0x06',
            preInteraction: '0x07',
            postInteraction: '0x08',
            customData: '0xff'
        })

        expect(Extension.decode(ext.encode())).toStrictEqual(ext)
    })

    it('should decode empty bytes as default and report empty', () => {
        const empty = Extension.decode('0x')

        expect(empty).toEqual(Extension.default())
        expect(empty.isEmpty()).toEqual(true)
        expect(empty.hasPredicate).toEqual(false)
        expect(empty.hasMakerPermit).toEqual(false)
        expect(empty.hasPreInteraction).toEqual(false)
    })

    it('should reject non-hex field values', () => {
        expect(
            () =>
                new Extension({
                    ...Extension.EMPTY,
                    predicate: 'not-hex'
                })
        ).toThrow(/predicate must be valid hex string/)
    })
})
