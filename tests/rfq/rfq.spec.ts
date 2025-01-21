import {parseEther, parseUnits} from 'ethers'
import {
    Address,
    AmountMode,
    LimitOrderContract,
    randBigInt,
    RfqOrder,
    TakerTraits
} from '../../src'
import '../global.d.ts'
import {USDC, WETH} from '../addresses'
import {now, patchVerifyingContract} from '../utils'

describe('RFQ', () => {
    const maker = globalThis.maker
    const taker = globalThis.taker
    const LOP = globalThis.limitOrderProtocolAddress

    it('should execute RFQ order', async () => {
        const initBalances = {
            usdc: {
                maker: await maker.tokenBalance(USDC),
                taker: await taker.tokenBalance(USDC)
            },
            weth: {
                maker: await maker.tokenBalance(WETH),
                taker: await taker.tokenBalance(WETH)
            }
        }

        const order = new RfqOrder(
            {
                maker: new Address(await maker.getAddress()),
                makerAsset: new Address(WETH),
                takerAsset: new Address(USDC),
                makingAmount: parseEther('0.1'),
                takingAmount: parseUnits('100', 6)
            },
            {
                nonce: randBigInt(10000),
                expiration: now() + 120n
            }
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
