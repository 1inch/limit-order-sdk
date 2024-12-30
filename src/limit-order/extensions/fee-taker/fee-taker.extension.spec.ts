import {FeeTakerExtension} from './fee-taker.extension'
import {Address} from '../../../address'
import {Bps} from '../../../bps'
import {Interaction} from '../../interaction'

describe('FeeTakerExtension', () => {
    describe('serialize/deserialize', () => {
        it('all data', () => {
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                {
                    integratorFeeRecipient: Address.fromBigInt(2n),
                    protocolFeeRecipient: Address.fromBigInt(3n),
                    tokensRecipient: Address.fromBigInt(4n)
                },
                {
                    resolverFee: Bps.fromPercent(2),
                    integratorFee: {
                        fee: Bps.fromPercent(5),
                        share: Bps.fromPercent(50)
                    }
                },
                {
                    discount: Bps.fromPercent(1),
                    addresses: [Address.fromBigInt(100n)]
                },
                new Interaction(Address.fromBigInt(1n), '0xdeadbeef'), // permit
                new Interaction(Address.fromBigInt(99n), '0xdeadbeefdeadbeef') // extra interaction
            )

            expect(FeeTakerExtension.fromExtension(extension.build())).toEqual(
                extension
            )
        })

        it('only resolver data', () => {
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                {
                    integratorFeeRecipient: Address.fromBigInt(2n),
                    protocolFeeRecipient: Address.fromBigInt(3n)
                },
                {
                    resolverFee: Bps.fromPercent(2)
                },
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
            const extension = FeeTakerExtension.new(
                Address.fromBigInt(1n),
                {
                    integratorFeeRecipient: Address.fromBigInt(2n),
                    protocolFeeRecipient: Address.fromBigInt(3n)
                },
                {
                    integratorFee: {
                        fee: Bps.fromPercent(5),
                        share: Bps.fromPercent(50)
                    }
                },
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
