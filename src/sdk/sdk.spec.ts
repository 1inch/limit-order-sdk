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
    const protocolFeeReceiver = '0x1111111111111111111111111111111111111111'
    const integratorFeeReceiver = '0x2222222222222222222222222222222222222222'
    const extensionAddress = '0x3333333333333333333333333333333333333333'

    const orderInfo = {
        makerAsset,
        takerAsset,
        makingAmount: 1_000000n,
        takingAmount: 2_000000000000000000n,
        maker
    }

    const baseFeeInfo: FeeInfoDTO = {
        whitelist: {
            '0x4444444444444444444444444444444444444444':
                '0x5555555555555555555555555555555555555555'
        },
        feeBps: 30,
        whitelistDiscountPercent: 0,
        protocolFeeReceiver,
        extensionAddress
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

    it('passes makerAddress to fee-info', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(baseFeeInfo)

        await sdk.createOrder(orderInfo)

        expect(mockHttpConnector.get).toHaveBeenCalledWith(
            expect.stringContaining(
                'makerAddress=0x1234567890123456789012345678901234567890'
            ),
            expect.any(Object)
        )
    })

    it('embeds integrator fee from fee-info', async () => {
        mockHttpConnector.get.mockResolvedValueOnce({
            ...baseFeeInfo,
            integratorFeeBps: 50,
            integratorFeeReceiver,
            integratorFeeSharePercent: 85
        })

        const order = await sdk.createOrder(orderInfo, MakerTraits.default())

        expect(order.feeExtension.fees.integrator.fee.value).toBe(50n)
        expect(order.feeExtension.fees.integrator.share.value).toBe(8500n)
        expect(order.feeExtension.fees.integrator.integrator.toString()).toBe(
            integratorFeeReceiver
        )
    })

    it('sets source track code from fee-info', async () => {
        const source = '0xabcd1234'
        mockHttpConnector.get.mockResolvedValueOnce({
            ...baseFeeInfo,
            source
        })

        const order = await sdk.createOrder(orderInfo)
        const extensionBits = order.salt & ((1n << 160n) - 1n)

        expect(order.getTrackCode()).toBe('0xabcd1234')
        expect(order.build().salt).toBe(order.salt.toString())
        expect(extensionBits).not.toBe(0n)

        order.setSource('0xdeadbeef')
        expect(order.getTrackCode()).toBe('0xdeadbeef')
        expect(order.salt & ((1n << 160n) - 1n)).toBe(extensionBits)
    })

    it('uses ZERO integrator fee when fee-info has no integrator fields', async () => {
        mockHttpConnector.get.mockResolvedValueOnce(baseFeeInfo)

        const order = await sdk.createOrder(orderInfo)

        expect(order.feeExtension.fees.integrator).toEqual(
            FeeTakerExt.IntegratorFee.ZERO
        )
    })

    it('prefers explicit integratorFee override', async () => {
        mockHttpConnector.get.mockResolvedValueOnce({
            ...baseFeeInfo,
            integratorFeeBps: 50,
            integratorFeeReceiver,
            integratorFeeSharePercent: 90
        })

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
