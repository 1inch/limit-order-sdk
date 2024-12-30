import {LimitOrderWithFee} from './limit-order-with-fee'
import {FeeTakerExtension} from './fee-taker.extension'
import {Address} from '../../../address'
import {Bps} from '../../../bps'
import {Interaction} from '../../interaction'
import {MakerTraits} from '../../maker-traits'

describe('LimitOrderWithFee', () => {
    it('should create fromDataAndExtension', () => {
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
