import {Api} from './api.js'
import {HttpProviderConnector} from './connector/index.js'
import {CursorPager} from './pager.js'
import {CursorPaginatedResponse, LimitOrderApiItem} from './types.js'
import {Address} from '../address.js'

describe('Api', () => {
    let api: Api
    let mockHttpConnector: jest.Mocked<HttpProviderConnector>

    beforeEach(() => {
        mockHttpConnector = {
            get: jest.fn(),
            post: jest.fn()
        } as jest.Mocked<HttpProviderConnector>

        api = new Api({
            networkId: 1,
            authKey: 'test-auth-key',
            httpConnector: mockHttpConnector,
            baseUrl: 'https://api.test.com'
        })
    })

    describe('getOrdersByMaker', () => {
        const mockMakerAddress = new Address(
            '0x1234567890123456789012345678901234567890'
        )
        const mockResponse: CursorPaginatedResponse<LimitOrderApiItem> = {
            items: [
                {
                    signature: '0xsignature',
                    orderHash: '0xhash',
                    createDateTime: '2023-10-19T14:03:27.500Z',
                    remainingMakerAmount: '1000000',
                    makerBalance: '5000000',
                    makerAllowance: '10000000',
                    data: {
                        salt: '123',
                        maker: '0x1234567890123456789012345678901234567890',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                        takerAsset:
                            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        makingAmount: '1000000',
                        takingAmount: '2000000000000000',
                        makerTraits: '0',
                        extension: '0x'
                    },
                    makerRate: '2000',
                    takerRate: '0.0005',
                    isMakerContract: false,
                    orderInvalidReason: null
                }
            ],
            meta: {
                hasMore: true,
                nextCursor:
                    'eyJhY3Rpdml0eURhdGUiOiIyMDIzLTEwLTE5VDE0OjAzOjI3LjUwMFoiLCJvcmRlckhhc2giOiIweDBkOTIwNzllMzgyOGYxZGQ2ZTQ4MTI2OWUwZDkxMmU2MGQwNGE1OGEwM2EyYzFmMDUyOWVkMTIwY2U2YmEwYmMifQ==',
                count: 150
            }
        }

        it('should fetch orders with default parameters', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)

            const result = await api.getOrdersByMaker(mockMakerAddress)

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=100',
                {Authorization: 'Bearer test-auth-key'}
            )
            expect(result).toEqual(mockResponse)
        })

        it('should fetch orders with CursorPager', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)
            const pager = new CursorPager({limit: 20, cursor: 'test-cursor'})

            const result = await api.getOrdersByMaker(mockMakerAddress, {
                pager
            })

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=20&cursor=test-cursor',
                {Authorization: 'Bearer test-auth-key'}
            )
            expect(result).toEqual(mockResponse)
        })

        it('should fetch orders with filters', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)
            const pager = new CursorPager({limit: 50})
            const makerAsset = new Address(
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
            )
            const takerAsset = new Address(
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
            )

            const result = await api.getOrdersByMaker(mockMakerAddress, {
                pager,
                statuses: [1, 2],
                makerAsset,
                takerAsset
            })

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=50&statuses=1%2C2&makerAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&takerAsset=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                {Authorization: 'Bearer test-auth-key'}
            )
            expect(result).toEqual(mockResponse)
        })

        it('should fetch orders with sort parameter', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)
            const pager = new CursorPager({limit: 10})

            const result = await api.getOrdersByMaker(
                mockMakerAddress,
                {pager, statuses: [1]},
                'createDateTime'
            )

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=10&statuses=1&sortBy=createDateTime',
                {Authorization: 'Bearer test-auth-key'}
            )
            expect(result).toEqual(mockResponse)
        })

        it('should handle pagination flow', async () => {
            const firstPageResponse = {...mockResponse}
            const secondPageResponse: CursorPaginatedResponse<LimitOrderApiItem> =
                {
                    items: [{...mockResponse.items[0], orderHash: '0xhash2'}],
                    meta: {
                        hasMore: false,
                        nextCursor: undefined,
                        count: 150
                    }
                }

            mockHttpConnector.get
                .mockResolvedValueOnce(firstPageResponse)
                .mockResolvedValueOnce(secondPageResponse)

            const firstPage = await api.getOrdersByMaker(mockMakerAddress, {
                pager: new CursorPager({limit: 10})
            })

            expect(firstPage.meta.hasMore).toBe(true)
            expect(firstPage.meta.nextCursor).toBeDefined()

            const secondPage = await api.getOrdersByMaker(mockMakerAddress, {
                pager: new CursorPager({
                    limit: 10,
                    cursor: firstPage.meta.nextCursor
                })
            })

            expect(secondPage.meta.hasMore).toBe(false)
            expect(secondPage.meta.nextCursor).toBeUndefined()
            expect(mockHttpConnector.get).toHaveBeenCalledTimes(2)
        })

        it('should filter out undefined params from URL', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)

            await api.getOrdersByMaker(mockMakerAddress, {
                pager: new CursorPager({limit: 30}),
                statuses: undefined,
                makerAsset: undefined,
                takerAsset: undefined
            })

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=30',
                {Authorization: 'Bearer test-auth-key'}
            )
        })

        it('should use default limit when no pager provided', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)

            await api.getOrdersByMaker(mockMakerAddress, {
                statuses: [1]
            })

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=100&statuses=1',
                {Authorization: 'Bearer test-auth-key'}
            )
        })

        it('should correctly format multiple statuses', async () => {
            mockHttpConnector.get.mockResolvedValueOnce(mockResponse)

            await api.getOrdersByMaker(mockMakerAddress, {
                pager: new CursorPager({limit: 25}),
                statuses: [1, 2, 3]
            })

            expect(mockHttpConnector.get).toHaveBeenCalledWith(
                'https://api.test.com/1/address/0x1234567890123456789012345678901234567890?limit=25&statuses=1%2C2%2C3',
                {Authorization: 'Bearer test-auth-key'}
            )
        })
    })
})
