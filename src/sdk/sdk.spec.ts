import {Sdk} from './sdk.js'
import {Address} from '../address.js'
import {Bps} from '../bps.js'
import {FeeTakerExt, MakerTraits} from '../limit-order/index.js'
import {HttpProviderConnector} from '../api/connector/index.js'
import {FeeInfoDTO} from '../api/types.js'

describe('Sdk.createOrder', () => {
    let mockHttpConnector: jest.Mocked<HttpProviderConnector>
    let sdk: Sdk

    const maker = new Address('0x1234567890123456789012345678901234567890')
    const makerAsset = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const takerAsset = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    // /fee-info (USDC/WETH) with portal fee headers (integrator-normal-pair-fee 0.07, rev-share 15, provider my-dapp).
    const protocolFeeReceiver = '0x90cbe4bdd538d6e9b379bff5fe72c3d67a521de5'
    const integratorFeeReceiver = '0x2222222222222222222222222222222222222222'
    const extensionAddress = '0xc0dfdb9e7a392c3dbbe7c6fbe8fbc1789c9fe05e'
    const source = 'aba10994' // bare hex from API (provider track code)

    const orderInfo = {
        makerAsset,
        takerAsset,
        makingAmount: 1_000000n,
        takingAmount: 2_000000000000000000n,
        maker
    }

    const baseFeeInfo: FeeInfoDTO = {
        whitelist: {
            '0x7246999fd1bab15b4ac7d1a23c3abeed63c51b86':
                '0x9c4dffb4f7e8217a8ac0555d67e125f8769284ba'
        },
        feeBps: 30,
        whitelistDiscountPercent: 0,
        protocolFeeReceiver,
        extensionAddress
    }

    const feeInfoWithIntegrator: FeeInfoDTO = {
        ...baseFeeInfo,
        integratorFeeBps: 7,
        integratorFeeReceiver,
        integratorFeeSharePercent: 85,
        source
    }

    beforeEach(() => {
        mockHttpConnector = {
            get: jest.fn(),
            post: jest.fn()
        } as jest.Mocked<HttpProviderConnector>

        sdk = new Sdk({
            networkId: 1,
            authKey: 'test-auth-key',
            httpConnector: mockHttpConnector,
            baseUrl: 'https://api.test.com'
        })
    })

    it('embeds integrator fee from fee-info', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(feeInfoWithIntegrator)

        const order = await sdk.createOrder(orderInfo, MakerTraits.default())

        expect(order.feeExtension.fees.integrator.fee.value).toBe(7n)
        expect(order.feeExtension.fees.integrator.share.value).toBe(8500n)
        expect(order.feeExtension.fees.integrator.integrator.toString()).toBe(
            integratorFeeReceiver
        )
    })

    it('sets source track code from fee-info', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(feeInfoWithIntegrator)

        const order = await sdk.createOrder(orderInfo)

        // API returns bare hex; setSource keccak-hashes non-0x values
        expect(order.getTrackCode()).toBe('0xb5e948e6')
        expect(order.build().salt).toBe(order.salt.toString())

        order.setSource('0xdeadbeef')
        expect(order.getTrackCode()).toBe('0xdeadbeef')
    })

    it('does not overwrite track code when salt is provided', async () => {
        mockHttpConnector.get.mockResolvedValue(feeInfoWithIntegrator)

        const seeded = await sdk.createOrder(orderInfo)
        seeded.setSource('0xdeadbeef')

        const order = await sdk.createOrder({
            ...orderInfo,
            salt: seeded.salt
        })

        expect(order.getTrackCode()).toBe('0xdeadbeef')
    })

    it('uses ZERO integrator fee when fee-info has no integrator fields', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(baseFeeInfo)

        const order = await sdk.createOrder(orderInfo)

        expect(order.feeExtension.fees.integrator).toEqual(
            FeeTakerExt.IntegratorFee.ZERO
        )
    })

    it('prefers explicit integratorFee override', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(feeInfoWithIntegrator)

        const customIntegratorFee = new FeeTakerExt.IntegratorFee(
            new Address(integratorFeeReceiver),
            new Address(protocolFeeReceiver),
            new Bps(100n),
            new Bps(8000n)
        )

        const order = await sdk.createOrder(orderInfo, MakerTraits.default(), {
            integratorFee: customIntegratorFee
        })

        expect(order.feeExtension.fees.integrator.fee.value).toBe(100n)
        expect(order.feeExtension.fees.integrator.share.value).toBe(8000n)
    })
})
