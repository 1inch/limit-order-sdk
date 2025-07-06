import {
    ApiConfig,
    FeeInfoDTO,
    LimitOrderApiItem,
    SortKey,
    StatusKey
} from './types.js'
import {DEV_PORTAL_LIMIT_ORDER_BASE_URL} from './constants.js'
import {Headers, HttpProviderConnector} from './connector/index.js'
import {Pager} from './pager.js'
import {LimitOrder} from '../limit-order/index.js'
import {Address} from '../address.js'

export class Api {
    private readonly baseUrl: string

    private readonly networkId: number

    private readonly httpClient: HttpProviderConnector

    private readonly authHeader: string

    constructor(config: ApiConfig) {
        this.baseUrl = config.baseUrl || DEV_PORTAL_LIMIT_ORDER_BASE_URL
        this.networkId = config.networkId
        this.httpClient = config.httpConnector
        this.authHeader = `Bearer ${config.authKey}`
    }

    /**
     * Submit order to orderbook
     * @param order
     * @param signature
     */
    public async submitOrder(
        order: LimitOrder,
        signature: string
    ): Promise<void> {
        await this.httpClient.post(
            this.url('/'),
            {
                orderHash: order.getOrderHash(this.networkId),
                signature,
                data: {
                    ...order.build(),
                    extension: order.extension.encode()
                }
            },
            this.headers()
        )
    }

    /**
     * Fetch orders created by `maker`
     */
    public async getOrdersByMaker(
        maker: Address,
        filters?: {
            pager?: Pager
            /**
             * 1 - Valid orders,
             * 2 - Temporarily invalid orders,
             * 3 - Invalid orders.
             */
            statuses?: StatusKey[]
            takerAsset?: Address
            makerAsset?: Address
        },
        sort?: SortKey
    ): Promise<LimitOrderApiItem[]> {
        const params = {
            limit: filters?.pager?.limit.toString(),
            page: filters?.pager?.page.toString(),
            statuses: filters?.statuses?.join(','),
            makerAsset: filters?.makerAsset?.toString(),
            takerAsset: filters?.takerAsset?.toString(),
            sortBy: sort
        } as Record<string, string>

        return this.httpClient.get(
            this.url(`/address/${maker}`, params),
            this.headers()
        )
    }

    /**
     * Get limit order by hash
     *
     * Error will be thrown if order is not found
     */
    public async getOrderByHash(hash: string): Promise<LimitOrderApiItem> {
        return this.httpClient.get(this.url(`/order/${hash}`), this.headers())
    }

    /**
     * Fetch current fee params, only orders with matched params can be submitted to 1inch relayer
     */
    public async getFeeParams(params: {
        makerAsset: Address
        takerAsset: Address
        makerAmount: bigint
        takerAmount: bigint
    }): Promise<FeeInfoDTO> {
        return this.httpClient.get(
            this.url(`/fee-info`, {
                makerAsset: params.makerAsset.toString(),
                takerAsset: params.takerAsset.toString(),
                makerAmount: params.makerAmount.toString(),
                takerAmount: params.takerAmount.toString()
            }),
            this.headers()
        )
    }

    private url(path: string, params?: Record<string, string>): string {
        const query = params
            ? `?${new URLSearchParams(
                  Object.entries(params).filter(([_, val]) => val !== undefined)
              )}`
            : ''

        return `${this.baseUrl}/${this.networkId}${path}${query}`
    }

    private headers(additional?: Headers): Headers {
        return {Authorization: this.authHeader, ...additional}
    }
}
