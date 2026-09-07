import {TakerTraits, AmountMode} from './taker-traits.js'
import {ExtensionBuilder} from './extensions/extension-builder.js'
import {Interaction} from './interaction.js'
import {Address} from '../address.js'
import {ZX} from '../constants.js'

describe('TakerTraits', () => {
    it('should default to taker amount mode with unwrap and permit2 off', () => {
        const traits = TakerTraits.default()

        expect(traits.getAmountMode()).toEqual(AmountMode.taker)
        expect(traits.isNativeUnwrapEnabled()).toEqual(false)
        expect(traits.isOrderPermitSkipped()).toEqual(false)
        expect(traits.isPermit2Enabled()).toEqual(false)
        expect(traits.getAmountThreshold()).toEqual(0n)
    })

    it('should toggle amount mode, unwrap, skip permit and permit2', () => {
        const traits = TakerTraits.default()
            .setAmountMode(AmountMode.maker)
            .enableNativeUnwrap()
            .skipOrderPermit()
            .enablePermit2()

        expect(traits.getAmountMode()).toEqual(AmountMode.maker)
        expect(traits.isNativeUnwrapEnabled()).toEqual(true)
        expect(traits.isOrderPermitSkipped()).toEqual(true)
        expect(traits.isPermit2Enabled()).toEqual(true)

        traits
            .setAmountMode(AmountMode.taker)
            .disableNativeUnwrap()
            .disablePermit2()

        expect(traits.getAmountMode()).toEqual(AmountMode.taker)
        expect(traits.isNativeUnwrapEnabled()).toEqual(false)
        expect(traits.isPermit2Enabled()).toEqual(false)
    })

    it('should set and remove amount threshold', () => {
        const traits = TakerTraits.default().setAmountThreshold(12345n)

        expect(traits.getAmountThreshold()).toEqual(12345n)

        traits.removeAmountThreshold()
        expect(traits.getAmountThreshold()).toEqual(0n)
    })

    it('should encode default traits with empty args', () => {
        const encoded = TakerTraits.default().encode()

        expect(encoded.args).toEqual(ZX)
        expect(encoded.trait).toEqual(0n)
    })

    it('should encode receiver, extension and interaction into args', () => {
        const receiver = Address.fromBigInt(7n)
        const extension = new ExtensionBuilder()
            .withCustomData('0xabcd')
            .build()
        const interaction = new Interaction(Address.fromBigInt(9n), '0xdead')

        const encoded = TakerTraits.default()
            .setReceiver(receiver)
            .setExtension(extension)
            .setInteraction(interaction)
            .encode()

        expect(encoded.args.startsWith(receiver.toString())).toEqual(true)
        expect(encoded.args.includes('abcd')).toEqual(true)
        expect(encoded.args.includes('dead')).toEqual(true)
        expect(encoded.trait).not.toEqual(0n)

        const cleared = TakerTraits.default()
            .setReceiver(receiver)
            .setExtension(extension)
            .setInteraction(interaction)
            .removeReceiver()
            .removeExtension()
            .removeInteraction()
            .encode()

        expect(cleared.args).toEqual(ZX)
    })
})
