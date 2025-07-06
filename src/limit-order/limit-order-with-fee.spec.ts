import {LimitOrderWithFee} from './limit-order-with-fee.js'
import {FeeTakerExtension} from './extensions/fee-taker/fee-taker.extension.js'
import {Fees} from './extensions/fee-taker/fees.js'
import {ResolverFee} from './extensions/fee-taker/resolver-fee.js'
import {IntegratorFee} from './extensions/fee-taker/integrator-fee.js'
import {Interaction} from './interaction.js'
import {MakerTraits} from './maker-traits.js'
import {Address} from '../address.js'
import {Bps} from '../bps.js'

describe('LimitOrderWithFee', () => {
    it('should create fromDataAndExtension', () => {
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
            [Address.fromBigInt(100n)],
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
        const order = new LimitOrderWithFee(
            {
                makerAsset: new Address(
                    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                ),
                takerAsset: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                makingAmount: 1000000000000000000n,
                takingAmount: 1420000000n,
                maker: new Address('0x00000000219ab540356cbb839cbe05303d7705fa')
            },
            MakerTraits.default(),
            extension
        )

        expect(
            LimitOrderWithFee.fromDataAndExtension(
                order.build(),
                order.extension
            )
        ).toEqual(order)
    })
})
