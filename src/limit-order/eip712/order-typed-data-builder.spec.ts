import {
    buildOrderTypedData,
    getDomainSeparator,
    getLimitOrderV4Domain,
    getOrderHash
} from './order-typed-data-builder.js'
import {
    LimitOrderV4TypeDataName,
    LimitOrderV4TypeDataVersion
} from './domain.js'
import {getLimitOrderContract} from '../../constants.js'
import {LimitOrder} from '../limit-order.js'
import {Address} from '../../address.js'

describe('order typed data builder', () => {
    const order = new LimitOrder({
        makerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
        takerAsset: new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
        makingAmount: 1000000000000000000n,
        takingAmount: 1420000000n,
        maker: new Address('0x00000000219ab540356cbb839cbe05303d7705fa'),
        salt: 10n
    })

    it('should build domain for a chain', () => {
        const domain = getLimitOrderV4Domain(1)

        expect(domain.name).toEqual(LimitOrderV4TypeDataName)
        expect(domain.version).toEqual(LimitOrderV4TypeDataVersion)
        expect(domain.chainId).toEqual(1)
        expect(domain.verifyingContract).toEqual(getLimitOrderContract(1))
    })

    it('should hash typed data consistently with LimitOrder.getOrderHash', () => {
        const typed = order.getTypedData(1)
        const rebuilt = buildOrderTypedData(
            typed.domain.chainId as number,
            typed.domain.verifyingContract as string,
            typed.domain.name as string,
            typed.domain.version as string,
            order.build()
        )

        expect(getOrderHash(rebuilt)).toEqual(order.getOrderHash(1))
        expect(getOrderHash(typed)).toMatch(/^0x[0-9a-f]{64}$/)
    })

    it('should compute domain separator', () => {
        const domain = getLimitOrderV4Domain(1)
        const separator = getDomainSeparator(
            domain.name,
            domain.version,
            domain.chainId,
            domain.verifyingContract
        )

        expect(separator).toMatch(/^0x[0-9a-f]{64}$/)
    })
})
