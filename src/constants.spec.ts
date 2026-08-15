import {
    getLimitOrderContract,
    getNativeOrderFactoryContract,
    getNativeOrderImplContract
} from './constants.js'
import {LimitOrder} from './limit-order/limit-order.js'
import {Address} from './address.js'

describe('constants', () => {
    describe('getLimitOrderContract', () => {
        it('should return canonical LOP v4 for Ethereum', () => {
            expect(getLimitOrderContract(1)).toEqual(
                '0x111111125421ca6dc452d289314280a0f8842a65'
            )
        })

        it('should return canonical LOP v4 for Monad', () => {
            expect(getLimitOrderContract(143)).toEqual(
                '0x111111125421ca6dc452d289314280a0f8842a65'
            )
        })

        it('should return canonical LOP v4 for Cronos', () => {
            expect(getLimitOrderContract(25)).toEqual(
                '0x111111125421ca6dc452d289314280a0f8842a65'
            )
        })

        it('should return non-default LOP v4 for HyperEVM', () => {
            expect(getLimitOrderContract(999)).toEqual(
                '0x5281602adc446a94eb48d055f514a6d8d5bee176'
            )
        })
    })

    describe('getNativeOrderFactoryContract', () => {
        it.each([143, 25, 999])(
            'should return shared factory deployment for chain %d',
            (chainId) => {
                expect(getNativeOrderFactoryContract(chainId)).toEqual(
                    '0x14b19fccaf92862eddb2cf361718d300f171ab03'
                )
            }
        )

        it('should return default factory for Ethereum', () => {
            expect(getNativeOrderFactoryContract(1)).toEqual(
                '0xe12e0f117d23a5ccc57f8935cd8c4e80cd91ff01'
            )
        })
    })

    describe('getNativeOrderImplContract', () => {
        it.each([143, 25, 999])(
            'should return shared impl deployment for chain %d',
            (chainId) => {
                expect(getNativeOrderImplContract(chainId)).toEqual(
                    '0xeeb2a74c34ef852534ebe4fe9a63aacc69e2f9a1'
                )
            }
        )

        it('should return default impl for Ethereum', () => {
            expect(getNativeOrderImplContract(1)).toEqual(
                '0xf3eaf3c54f1ef887914b9c19e1ab9d3e581557eb'
            )
        })
    })

    describe('CHAIN_TO_WRAPPER', () => {
        it('should have WMON for Monad', () => {
            expect(LimitOrder.CHAIN_TO_WRAPPER[143]).toEqual(
                new Address('0x3bd359c1119da7da1d913d1c4d2b7c461115433a')
            )
        })

        it('should have WCRO for Cronos', () => {
            expect(LimitOrder.CHAIN_TO_WRAPPER[25]).toEqual(
                new Address('0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23')
            )
        })

        it('should have WHYPE for HyperEVM', () => {
            expect(LimitOrder.CHAIN_TO_WRAPPER[999]).toEqual(
                new Address('0x5555555555555555555555555555555555555555')
            )
        })
    })
})
