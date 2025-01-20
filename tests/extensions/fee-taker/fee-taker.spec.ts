import {parseEther, parseUnits} from 'ethers'
import {
    Address,
    AmountMode,
    LimitOrderContract,
    MakerTraits,
    TakerTraits
} from '../../../src'
import '../../global.d.ts'
import {USDC, WETH} from '../../addresses'
import {patchVerifyingContract} from '../../utils'
import {TestWallet} from '../../test-wallet'
import {LimitOrderWithFee} from '../../../src/limit-order/extensions/fee-taker/limit-order-with-fee'
import {FeeTakerExtension} from '../../../src/limit-order/extensions/fee-taker/fee-taker.extension'
import {Fees} from '../../../src/limit-order/extensions/fee-taker/fees'
import {ResolverFee} from '../../../src/limit-order/extensions/fee-taker/resolver-fee'
import {Bps} from '../../../src/bps'

describe('FeeTaker', async () => {
    const maker = globalThis.maker
    const taker = globalThis.taker
    const LOP = globalThis.limitOrderProtocolAddress
    const FEE_TAKER_EXT = globalThis.feeTakerExtensionAddress

    let protocol: TestWallet
    beforeAll(async () => {
        protocol = await TestWallet.fromAddress(
            Address.fromBigInt(256n).toString(),
            globalThis.localNodeProvider
        )
    })

    it('should execute order with resolver fee', async () => {
        const initBalances = {
            usdc: {
                maker: await maker.tokenBalance(USDC),
                taker: await taker.tokenBalance(USDC),
                protocol: await protocol.tokenBalance(USDC)
            },
            weth: {
                maker: await maker.tokenBalance(WETH),
                taker: await taker.tokenBalance(WETH),
                protocol: await protocol.tokenBalance(WETH)
            }
        }

        const feeExtension = FeeTakerExtension.new(
            new Address(FEE_TAKER_EXT),
            Fees.resolverFee(
                new ResolverFee(
                    new Address(await protocol.getAddress()),
                    Bps.fromPercent(1)
                )
            )
        )

        const order = new LimitOrderWithFee(
            {
                maker: new Address(await maker.getAddress()),
                makerAsset: new Address(WETH),
                takerAsset: new Address(USDC),
                makingAmount: parseEther('0.1'),
                takingAmount: parseUnits('100', 6)
            },
            MakerTraits.default(),
            feeExtension
        )

        const signature = await maker.signTypedData(
            patchVerifyingContract(order.getTypedData(1))
        )

        const data = LimitOrderContract.getFillOrderCalldata(
            order.build(),
            signature,
            TakerTraits.default().setAmountMode(AmountMode.maker),
            order.makingAmount
        )

        await taker.send({
            data,
            to: LOP
        })

        const finalBalances = {
            usdc: {
                maker: await maker.tokenBalance(USDC),
                taker: await taker.tokenBalance(USDC)
            },
            weth: {
                maker: await maker.tokenBalance(WETH),
                taker: await taker.tokenBalance(WETH)
            }
        }

        expect(initBalances.weth.maker - order.makingAmount).toBe(
            finalBalances.weth.maker
        )
        expect(initBalances.usdc.maker + order.takingAmount).toBe(
            finalBalances.usdc.maker
        )

        expect(initBalances.weth.taker + order.makingAmount).toBe(
            finalBalances.weth.taker
        )
        expect(initBalances.usdc.taker - order.takingAmount).toBe(
            finalBalances.usdc.taker
        )
    })
})
