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
})
