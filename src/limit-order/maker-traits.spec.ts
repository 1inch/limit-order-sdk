import {UINT_160_MAX, UINT_40_MAX} from '@1inch/byte-utils'
import {MakerTraits} from './maker-traits.js'
import {Address} from '../address.js'

describe('MakerTraits', () => {
    test('allowed sender', () => {
        const traits = MakerTraits.default()

        const sender = Address.fromBigInt(1337n)

        const senderHalf = traits.withAllowedSender(sender).allowedSender()

        expect(senderHalf).toEqual(sender.toString().slice(-20))
    })

    test('nonce', () => {
        const traits = MakerTraits.default()

        const nonce = 1n << 10n

        traits.withNonce(nonce)
        expect(traits.nonceOrEpoch()).toEqual(nonce)

        const big_nonce = 1n << 50n
        expect(() => traits.withNonce(big_nonce)).toThrow('to big for mask')
    })

    test('expiration', () => {
        const traits = MakerTraits.default()
        const expiration = 1000000n

        traits.withExpiration(expiration)
        expect(traits.expiration()).toEqual(expiration)
    })

    test('epoch', () => {
        const traits = MakerTraits.default()
        const series = 100n
        const epoch = 1n
        traits.allowPartialFills().allowMultipleFills().withEpoch(series, epoch)
        expect(traits.series()).toEqual(series)
        expect(traits.nonceOrEpoch()).toEqual(epoch)
        expect(traits.isEpochManagerEnabled()).toEqual(true)
    })

    test('extension', () => {
        const traits = MakerTraits.default()
        expect(traits.hasExtension()).toEqual(false)

        traits.withExtension()
        expect(traits.hasExtension()).toEqual(true)
    })

    test('partial fills', () => {
        const traits = MakerTraits.default()
        expect(traits.isPartialFillAllowed()).toEqual(true)

        traits.disablePartialFills()
        expect(traits.isPartialFillAllowed()).toEqual(false)

        traits.allowPartialFills()
        expect(traits.isPartialFillAllowed()).toEqual(true)
    })

    test('multiple fills', () => {
        const traits = MakerTraits.default()
        expect(traits.isMultipleFillsAllowed()).toEqual(false)

        traits.allowMultipleFills()
        expect(traits.isMultipleFillsAllowed()).toEqual(true)

        traits.disableMultipleFills()
        expect(traits.isMultipleFillsAllowed()).toEqual(false)
    })

    test('pre interaction', () => {
        const traits = MakerTraits.default()
        expect(traits.hasPreInteraction()).toEqual(false)

        traits.enablePreInteraction()
        expect(traits.hasPreInteraction()).toEqual(true)

        traits.disablePreInteraction()
        expect(traits.hasPreInteraction()).toEqual(false)
    })

    test('post interaction', () => {
        const traits = MakerTraits.default()
        expect(traits.hasPostInteraction()).toEqual(false)

        traits.enablePostInteraction()
        expect(traits.hasPostInteraction()).toEqual(true)

        traits.disablePostInteraction()
        expect(traits.hasPostInteraction()).toEqual(false)
    })

    test('permit2', () => {
        const traits = MakerTraits.default()
        expect(traits.isPermit2()).toEqual(false)

        traits.enablePermit2()
        expect(traits.isPermit2()).toEqual(true)

        traits.disablePermit2()
        expect(traits.isPermit2()).toEqual(false)
    })

    test('native unwrap', () => {
        const traits = MakerTraits.default()
        expect(traits.isNativeUnwrapEnabled()).toEqual(false)

        traits.enableNativeUnwrap()
        expect(traits.isNativeUnwrapEnabled()).toEqual(true)

        traits.disableNativeUnwrap()
        expect(traits.isNativeUnwrapEnabled()).toEqual(false)
    })

    test('all', () => {
        const traits = MakerTraits.default()
            .withAllowedSender(Address.fromBigInt(UINT_160_MAX))
            .allowPartialFills()
            .allowMultipleFills()
            .withEpoch(UINT_40_MAX, UINT_40_MAX)
            .withExpiration(UINT_40_MAX)
            .withExtension()
            .enablePermit2()
            .enableNativeUnwrap()
            .enablePreInteraction()
            .enablePostInteraction()

        expect(traits.asBigInt().toString(16)).toEqual(
            '5f800000000000ffffffffffffffffffffffffffffffffffffffffffffffffff'
        )
    })
})
