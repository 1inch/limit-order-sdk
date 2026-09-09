import {ExtensionBuilder} from './extension-builder.js'
import {Interaction} from '../interaction.js'
import {Address} from '../../address.js'

describe('ExtensionBuilder', () => {
    it('should assemble every extension field', () => {
        const target = Address.fromBigInt(11n)
        const interaction = new Interaction(target, '0xabcdef')
        const ext = new ExtensionBuilder()
            .withMakerAssetSuffix('0x01')
            .withTakerAssetSuffix('0x02')
            .withMakingAmountData(target, '0x03')
            .withTakingAmountData(target, '0x04')
            .withPredicate('0x05')
            .withMakerPermit(target, '0x06')
            .withPreInteraction(interaction)
            .withPostInteraction(interaction)
            .withCustomData('0x07')
            .build()

        expect(ext.makerAssetSuffix).toEqual('0x01')
        expect(ext.takerAssetSuffix).toEqual('0x02')
        expect(ext.makingAmountData).toEqual(target.toString() + '03')
        expect(ext.takingAmountData).toEqual(target.toString() + '04')
        expect(ext.predicate).toEqual('0x05')
        expect(ext.makerPermit).toEqual(target.toString() + '06')
        expect(ext.preInteraction).toEqual(interaction.encode())
        expect(ext.postInteraction).toEqual(interaction.encode())
        expect(ext.customData).toEqual('0x07')
        expect(ext.hasPredicate).toEqual(true)
        expect(ext.hasMakerPermit).toEqual(true)
        expect(ext.hasPreInteraction).toEqual(true)
    })

    it('should reject invalid hex inputs', () => {
        const builder = new ExtensionBuilder()
        const target = Address.fromBigInt(1n)

        expect(() => builder.withMakerAssetSuffix('zz')).toThrow(
            /MakerAssetSuffix/
        )
        expect(() => builder.withTakerAssetSuffix('zz')).toThrow(
            /TakerAssetSuffix/
        )
        expect(() => builder.withMakingAmountData(target, 'zz')).toThrow(
            /MakingAmountData/
        )
        expect(() => builder.withTakingAmountData(target, 'zz')).toThrow(
            /TakingAmountData/
        )
        expect(() => builder.withPredicate('zz')).toThrow(/Predicate/)
        expect(() => builder.withMakerPermit(target, 'zz')).toThrow(
            /Permit data/
        )
        expect(() => builder.withCustomData('zz')).toThrow(/Custom data/)
    })
})
