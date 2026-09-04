import {Fees} from './fees.js'
import {IntegratorFee} from './integrator-fee.js'
import {ResolverFee} from './resolver-fee.js'
import {WhitelistHalfAddress} from './whitelist-half-address.js'
import {FeeTakerExtensionError} from './errors.js'
import {FeeTakerExtension} from './fee-taker.extension.js'
import {Address} from '../../../address.js'
import {Bps} from '../../../bps.js'

describe('fee taker validation', () => {
    const protocol = Address.fromBigInt(3n)
    const integrator = Address.fromBigInt(2n)

    it('should reject integrator fee inconsistencies', () => {
        expect(
            () =>
                new IntegratorFee(
                    integrator,
                    protocol,
                    Bps.ZERO,
                    Bps.fromPercent(1)
                )
        ).toThrow(/integrator share must be zero/)

        expect(
            () =>
                new IntegratorFee(
                    integrator,
                    Address.ZERO_ADDRESS,
                    Bps.ZERO,
                    Bps.ZERO
                )
        ).toThrow(/integrator address must be zero/)

        expect(
            () =>
                new IntegratorFee(
                    Address.ZERO_ADDRESS,
                    protocol,
                    Bps.ZERO,
                    Bps.ZERO
                )
        ).toThrow(/protocol address must be zero/)

        expect(
            () =>
                new IntegratorFee(
                    Address.ZERO_ADDRESS,
                    protocol,
                    Bps.fromPercent(1),
                    Bps.fromPercent(10)
                )
        ).toThrow(/fee must be zero if integrator or protocol is zero/)
    })

    it('should reject resolver fee inconsistencies', () => {
        expect(
            () => new ResolverFee(Address.ZERO_ADDRESS, Bps.fromPercent(1))
        ).toThrow(/fee must be zero if receiver is zero/)

        expect(() => new ResolverFee(protocol, Bps.ZERO)).toThrow(
            /receiver must be zero address if fee is zero/
        )

        expect(
            () =>
                new ResolverFee(
                    Address.ZERO_ADDRESS,
                    Bps.ZERO,
                    Bps.fromPercent(1)
                )
        ).toThrow(/whitelist discount must be zero/)

        expect(
            () => new ResolverFee(protocol, Bps.fromPercent(1), new Bps(150n))
        ).toThrow(/percent precision/)
    })

    it('should expose whitelist length and decode a built extension', () => {
        const whitelist = WhitelistHalfAddress.new([Address.fromBigInt(100n)])
        expect(whitelist.length).toEqual(1)
        expect(whitelist.isWhitelisted(Address.fromBigInt(100n))).toEqual(true)
        expect(whitelist.isWhitelisted(Address.fromBigInt(101n))).toEqual(false)

        const empty = WhitelistHalfAddress.new(
            undefined as unknown as Address[]
        )
        expect(empty.length).toEqual(0)

        const extension = FeeTakerExtension.new(
            Address.fromBigInt(1n),
            Fees.resolverFee(new ResolverFee(protocol, Bps.fromPercent(2))),
            [Address.fromBigInt(100n)]
        )
        expect(FeeTakerExtension.decode(extension.build().encode())).toEqual(
            extension
        )
        expect(
            extension.getMakingAmount(Address.fromBigInt(100n), 100n)
        ).toEqual(
            extension
                .getFeeCalculator()
                .getMakingAmount(Address.fromBigInt(100n), 100n)
        )
        expect(
            extension.getProtocolShareOfIntegratorFee(
                Address.fromBigInt(100n),
                100n
            )
        ).toEqual(0n)
        expect(new FeeTakerExtensionError('x')).toBeInstanceOf(Error)
    })
})
