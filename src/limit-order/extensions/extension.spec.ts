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
})
