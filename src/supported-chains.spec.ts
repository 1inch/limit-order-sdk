import {
    getLimitOrderContract,
    getNativeOrderFactoryContract,
    getNativeOrderImplContract
} from './constants.js'
import {LimitOrder} from './limit-order/limit-order.js'
import {getLimitOrderV4Domain} from './limit-order/eip712/order-typed-data-builder.js'
import {MakerTraits} from './limit-order/maker-traits.js'
import {Extension} from './limit-order/extensions/index.js'
import {ProxyFactory} from './limit-order-contract/index.js'
import {Address} from './address.js'

const ADDRESS_RE = /^0x[0-9a-f]{40}$/

// Every chain with a registered wrapped-native token supports native limit
// orders — the full per-chain wiring (LOP contract, native-order factory/impl,
// EIP-712 domain, LimitOrder.fromNative) must be consistent for each of them.
const SUPPORTED_CHAIN_IDS = Object.keys(LimitOrder.CHAIN_TO_WRAPPER).map(Number)

describe('supported chains integration', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1)
    jest.spyOn(Date, 'now').mockReturnValue(1673549418040)

    it('has at least the documented chains registered', () => {
        // Monad (143), Cronos (25) and HyperEVM (999) added in v5.4.2
        // Arc (5042) added in v5.4.3
        expect(SUPPORTED_CHAIN_IDS).toEqual(
            expect.arrayContaining([1, 4663, 143, 25, 999, 5042])
        )
    })

    describe.each(SUPPORTED_CHAIN_IDS)('chain %d', (chainId) => {
        it('registers a valid non-zero wrapped-native address', () => {
            const wrapper = LimitOrder.CHAIN_TO_WRAPPER[chainId]

            expect(wrapper).toBeInstanceOf(Address)
            expect(wrapper.toString()).toMatch(ADDRESS_RE)
            expect(wrapper.isZero()).toBe(false)
        })

        it('resolves valid LOP v4 and native-order contracts', () => {
            expect(getLimitOrderContract(chainId)).toMatch(ADDRESS_RE)
            expect(getNativeOrderFactoryContract(chainId)).toMatch(ADDRESS_RE)
            expect(getNativeOrderImplContract(chainId)).toMatch(ADDRESS_RE)
        })

        it('builds an EIP-712 domain bound to the per-chain LOP contract', () => {
            const domain = getLimitOrderV4Domain(chainId)

            expect(domain.chainId).toEqual(chainId)
            expect(domain.verifyingContract).toEqual(
                getLimitOrderContract(chainId)
            )
        })

        it('creates a native order via fromNative with the chain wrapper as makerAsset', () => {
            const maker = new Address(
                '0x00000000219ab540356cbb839cbe05303d7705fa'
            )

            const order = LimitOrder.fromNative(
                chainId,
                ProxyFactory.default(chainId),
                {
                    takerAsset: new Address(
                        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                    ),
                    makingAmount: 1000000000000000000n,
                    takingAmount: 1420000000n,
                    maker,
                    salt: 10n
                },
                MakerTraits.default().withExtension(),
                Extension.default()
            )

            expect(order.makerAsset).toEqual(
                LimitOrder.CHAIN_TO_WRAPPER[chainId]
            )
            expect(order.getOrderHash(chainId)).toMatch(/^0x[0-9a-f]{64}$/)
        })
    })
})
