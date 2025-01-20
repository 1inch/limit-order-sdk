import {FeeTakerExtension} from './fee-taker.extension'
import {Fees} from './fees'
import {ResolverFee} from './resolver-fee'
import {IntegratorFee} from './integrator-fee'
import {Address} from '../../../address'
import {Bps} from '../../../bps'
import {Interaction} from '../../interaction'

describe('FeeTakerExtension', () => {
    describe('serialize/deserialize', () => {
        it('all data', () => {
            const recipients = {
                integratorFeeRecipient: Address.fromBigInt(2n),
                protocolFeeRecipient: Address.fromBigInt(3n),
                tokensRecipient: Address.fromBigInt(4n)
            }
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                new Fees(
                    new ResolverFee(
                        recipients.protocolFeeRecipient,
                        Bps.fromPercent(2)
                    ),
                    new IntegratorFee(
                        recipients.integratorFeeRecipient,
                        recipients.protocolFeeRecipient,
                        Bps.fromFraction(0.0001),
                        Bps.fromPercent(5)
                    )
                ),
                {
                    discount: Bps.fromPercent(1),
                    addresses: [Address.fromBigInt(100n)]
                },
                {
                    makerPermit: new Interaction(
                        Address.fromBigInt(1n),
                        '0xdeadbeef'
                    ),
                    extraInteraction: new Interaction(
                        Address.fromBigInt(99n),
                        '0xdeadbeefdeadbeef'
                    ),
                    customReceiver: recipients.tokensRecipient
                }
            )

            expect(FeeTakerExtension.fromExtension(extension.build())).toEqual(
                extension
            )
        })

        it('only resolver data', () => {
            const recipients = {
                protocolFeeRecipient: Address.fromBigInt(3n)
            }
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                Fees.resolverFee(
                    new ResolverFee(
                        recipients.protocolFeeRecipient,
                        Bps.fromPercent(2)
                    )
                ),
                {
                    discount: Bps.fromPercent(0),
                    addresses: [Address.fromBigInt(100n)]
                }
            )

            expect(FeeTakerExtension.fromExtension(extension.build())).toEqual(
                extension
            )
        })

        it('only integrator data', () => {
            const recipients = {
                integratorFeeRecipient: Address.fromBigInt(2n),
                protocolFeeRecipient: Address.fromBigInt(3n)
            }
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                Fees.integratorFee(
                    new IntegratorFee(
                        recipients.integratorFeeRecipient,
                        recipients.protocolFeeRecipient,
                        Bps.fromFraction(0.0001),
                        Bps.fromPercent(5)
                    )
                ),
                {
                    discount: Bps.fromPercent(0),
                    addresses: [Address.fromBigInt(100n)]
                }
            )

            expect(FeeTakerExtension.fromExtension(extension.build())).toEqual(
                extension
            )
        })
    })

    it('should calculate taking amount', () => {
        const takerAddress = Address.fromBigInt(100n)
        const ext = FeeTakerExtension.new(
            Address.fromBigInt(1n),
            Fees.resolverFee(
                new ResolverFee(Address.fromBigInt(2n), Bps.fromPercent(1))
            ),
            {
                addresses: [takerAddress], // mark taker as whitelisted resolver
                discount: Bps.ZERO
            }
        )

        const takingAmount = ext.getTakingAmount(takerAddress, 100_000_000n)
        expect(takingAmount).toEqual(101_000_000n)
    })

    it('should calculate resolver fee', () => {
        const takerAddress = Address.fromBigInt(100n)
        const ext = FeeTakerExtension.new(
            Address.fromBigInt(1n),
            Fees.resolverFee(
                new ResolverFee(Address.fromBigInt(2n), Bps.fromPercent(1))
            ),
            {
                addresses: [takerAddress], // mark taker as whitelisted resolver
                discount: Bps.ZERO
            }
        )

        const resolverFee = ext.getResolverFee(takerAddress, 100_000_000n)
        expect(resolverFee).toEqual(1_000_000n)
    })

    it('should calculate integrator fee', () => {
        const takerAddress = Address.fromBigInt(100n)
        const ext = FeeTakerExtension.new(
            Address.fromBigInt(1n),
            Fees.integratorFee(
                new IntegratorFee(
                    Address.fromBigInt(2n),
                    Address.fromBigInt(3n),
                    Bps.fromPercent(5), // fee
                    Bps.fromPercent(10) // share
                )
            ),
            {
                addresses: [takerAddress], // mark taker as whitelisted resolver
                discount: Bps.ZERO
            }
        )

        const integratorFee = ext.getIntegratorFee(takerAddress, 100_000_000n)
        expect(integratorFee).toEqual(500_000n) // 10% from 5% = 0.5%
    })

    it('should calculate protocol fee', () => {
        const protocolAddress = Address.fromBigInt(111n)
        const takerAddress = Address.fromBigInt(100n)
        const ext = FeeTakerExtension.new(
            Address.fromBigInt(1n),
            new Fees(
                new ResolverFee(protocolAddress, Bps.fromPercent(1)),
                new IntegratorFee(
                    Address.fromBigInt(2n),
                    protocolAddress,
                    Bps.fromPercent(5), // fee
                    Bps.fromPercent(10) // share
                )
            ),
            {
                addresses: [takerAddress], // mark taker as whitelisted resolver
                discount: Bps.ZERO
            }
        )

        const protocolFee = ext.getProtocolFee(takerAddress, 100_000_000n)
        expect(protocolFee).toEqual(1_000_000n + 4_500_000n) // 90% from 5% (integrator fee share)+ 1% (resolver fee) = 5.5%
    })
})
