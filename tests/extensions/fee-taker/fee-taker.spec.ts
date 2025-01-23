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
import {LimitOrderWithFee} from '../../../src/limit-order/limit-order-with-fee'
import {FeeTakerExtension} from '../../../src/limit-order/extensions/fee-taker/fee-taker.extension'
import {Fees} from '../../../src/limit-order/extensions/fee-taker/fees'
import {ResolverFee} from '../../../src/limit-order/extensions/fee-taker/resolver-fee'
import {Bps} from '../../../src/bps'
import {IntegratorFee} from '../../../src/limit-order/extensions/fee-taker'

describe('FeeTakerExtension', () => {
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

        const takerAddress = new Address(await taker.getAddress())

        const feeExtension = FeeTakerExtension.new(
            new Address(FEE_TAKER_EXT),
            Fees.resolverFee(
                new ResolverFee(
                    new Address(await protocol.getAddress()),
                    Bps.fromPercent(1)
                )
            ),
            [takerAddress] // mark taker as whitelisted resolver
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

        const data = LimitOrderContract.getFillOrderArgsCalldata(
            order.build(),
            signature,
            TakerTraits.default()
                .setExtension(order.extension)
                .setAmountMode(AmountMode.maker),
            order.makingAmount
        )

        await taker.send({
            data,
            to: LOP
        })

        const finalBalances = {
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

        expect(initBalances.weth.maker - finalBalances.weth.maker).toBe(
            order.makingAmount
        )
        expect(finalBalances.usdc.maker - initBalances.usdc.maker).toBe(
            order.takingAmount
        )

        expect(finalBalances.weth.taker - initBalances.weth.taker).toBe(
            order.makingAmount
        )
        expect(initBalances.usdc.taker - finalBalances.usdc.taker).toBe(
            order.getTakingAmount(takerAddress)
        )

        expect(finalBalances.usdc.protocol - initBalances.usdc.protocol).toBe(
            order.getProtocolFee(takerAddress)
        )
        expect(finalBalances.weth.protocol - initBalances.weth.protocol).toBe(
            0n
        )
    })

    it('should execute order with integrator fee', async () => {
        const integrator = await TestWallet.fromAddress(
            Address.fromBigInt(256n).toString(),
            globalThis.localNodeProvider
        )
        const initBalances = {
            usdc: {
                maker: await maker.tokenBalance(USDC),
                taker: await taker.tokenBalance(USDC),
                protocol: await protocol.tokenBalance(USDC),
                integrator: await integrator.tokenBalance(USDC)
            },
            weth: {
                maker: await maker.tokenBalance(WETH),
                taker: await taker.tokenBalance(WETH),
                protocol: await protocol.tokenBalance(WETH),
                integrator: await integrator.tokenBalance(WETH)
            }
        }

        const takerAddress = new Address(await taker.getAddress())
        const protocolAddress = new Address(await protocol.getAddress())

        const feeExtension = FeeTakerExtension.new(
            new Address(FEE_TAKER_EXT),
            Fees.integratorFee(
                new IntegratorFee(
                    Address.fromBigInt(2n),
                    protocolAddress,
                    Bps.fromPercent(5), // fee
                    Bps.fromPercent(50) // share
                )
            ),
            [takerAddress] // mark taker as whitelisted resolver
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

        const data = LimitOrderContract.getFillOrderArgsCalldata(
            order.build(),
            signature,
            TakerTraits.default()
                .setExtension(order.extension)
                .setAmountMode(AmountMode.maker),
            order.makingAmount
        )

        await taker.send({
            data,
            to: LOP
        })

        const finalBalances = {
            usdc: {
                maker: await maker.tokenBalance(USDC),
                taker: await taker.tokenBalance(USDC),
                protocol: await protocol.tokenBalance(USDC),
                integrator: await integrator.tokenBalance(USDC)
            },
            weth: {
                maker: await maker.tokenBalance(WETH),
                taker: await taker.tokenBalance(WETH),
                protocol: await protocol.tokenBalance(WETH),
                integrator: await integrator.tokenBalance(WETH)
            }
        }

        expect(initBalances.weth.maker - finalBalances.weth.maker).toBe(
            order.makingAmount
        )
        expect(finalBalances.usdc.maker - initBalances.usdc.maker).toBe(
            order.takingAmount
        )

        expect(finalBalances.weth.taker - initBalances.weth.taker).toBe(
            order.makingAmount
        )
        expect(initBalances.usdc.taker - finalBalances.usdc.taker).toBe(
            order.getTakingAmount(takerAddress)
        )

        expect(finalBalances.usdc.protocol - initBalances.usdc.protocol).toBe(
            order.getProtocolFee(takerAddress)
        )
        expect(finalBalances.weth.protocol - initBalances.weth.protocol).toBe(
            0n
        )

        expect(
            finalBalances.usdc.integrator - initBalances.usdc.integrator
        ).toBe(order.getIntegratorFee(takerAddress))
        expect(
            finalBalances.weth.integrator - initBalances.weth.integrator
        ).toBe(0n)
    })
})
