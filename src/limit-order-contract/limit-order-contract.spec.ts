import {Interface, Wallet} from 'ethers'
import {LimitOrderContract} from './limit-order-contract.js'
import {LimitOrder} from '../limit-order/limit-order.js'
import {TakerTraits} from '../limit-order/taker-traits.js'
import {ExtensionBuilder} from '../limit-order/extensions/extension-builder.js'
import {Address} from '../address.js'
import LOP_V4_ABI from '../abi/AggregationRouterV6.abi.json' with {type: 'json'}

const lop = new Interface(LOP_V4_ABI)

describe('LimitOrderContract', () => {
    const wallet = new Wallet(
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    )
    const order = new LimitOrder({
        makerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
        takerAsset: new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
        makingAmount: 1000000000000000000n,
        takingAmount: 1420000000n,
        maker: new Address(wallet.address),
        salt: 10n
    })

    async function sign(): Promise<string> {
        const typed = order.getTypedData(1)

        return wallet.signTypedData(
            typed.domain,
            {Order: typed.types.Order},
            typed.message
        )
    }

    it('should encode fillOrder when taker traits have no args', async () => {
        const signature = await sign()
        const calldata = LimitOrderContract.getFillOrderCalldata(
            order.build(),
            signature,
            TakerTraits.default(),
            1n
        )
        const parsed = lop.parseTransaction({data: calldata})

        expect(parsed?.name).toEqual('fillOrder')
        expect(parsed?.args.amount).toEqual(1n)
    })

    it('should reject fillContractOrder when ABI arity does not match args', async () => {
        const signature = await sign()

        expect(() =>
            LimitOrderContract.getFillContractOrderCalldata(
                order.build(),
                signature,
                TakerTraits.default(),
                2n
            )
        ).toThrow(/too many arguments/)
    })

    it('should reject fillOrder when taker traits encode args', async () => {
        const signature = await sign()
        const traits = TakerTraits.default().setReceiver(Address.fromBigInt(1n))

        expect(() =>
            LimitOrderContract.getFillOrderCalldata(
                order.build(),
                signature,
                traits,
                1n
            )
        ).toThrow(/getFillOrderArgsCalldata/)

        expect(() =>
            LimitOrderContract.getFillContractOrderCalldata(
                order.build(),
                signature,
                traits,
                1n
            )
        ).toThrow(/getFillContractOrderArgsCalldata/)
    })

    it('should encode fillOrderArgs and fillContractOrderArgs', async () => {
        const signature = await sign()
        const traits = TakerTraits.default().setExtension(
            new ExtensionBuilder().withCustomData('0xabcd').build()
        )

        const orderArgs = LimitOrderContract.getFillOrderArgsCalldata(
            order.build(),
            signature,
            traits,
            3n
        )
        const contractArgs =
            LimitOrderContract.getFillContractOrderArgsCalldata(
                order.build(),
                signature,
                traits,
                4n
            )

        expect(lop.parseTransaction({data: orderArgs})?.name).toEqual(
            'fillOrderArgs'
        )
        expect(lop.parseTransaction({data: contractArgs})?.name).toEqual(
            'fillContractOrderArgs'
        )
    })
})
