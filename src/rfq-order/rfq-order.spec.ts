import {RfqOrder} from './rfq-order.js'
import {Address} from '../address.js'

describe('RfqOrder', () => {
    it('Should validate max nonce', () => {
        expect(
            () =>
                new RfqOrder(
                    {
                        makerAsset: new Address(
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                        ),
                        takerAsset: new Address(
                            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                        ),
                        makingAmount: 1000000000000000000n,
                        takingAmount: 1420000000n,
                        maker: new Address(
                            '0x00000000219ab540356cbb839cbe05303d7705fa'
                        )
                    },
                    {nonce: 1n << 41n, expiration: 1000n}
                )
        ).toThrow()
    })
})

it('should create RfqOrder with permit2', () => {
    const order = new RfqOrder(
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
        {
            nonce: 1n,
            expiration: 1000n,
            usePermit2: true
        }
    )

    expect(order.makerTraits.isPermit2()).toEqual(true)
})
