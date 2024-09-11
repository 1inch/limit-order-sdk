import {HttpProviderConnector} from './connector/index.js'
import {LimitOrderV4Struct} from '../limit-order/index.js'

export type ApiConfig = {
    authKey: string
    httpConnector: HttpProviderConnector
    baseUrl?: string
    networkId: number
}

export type LimitOrderApiItem = {
    signature: string
    orderHash: string
    createDateTime: string
    remainingMakerAmount: string
    makerBalance: string
    makerAllowance: string
    data: LimitOrderV4Struct & {extension: string}
    makerRate: string
    takerRate: string
    isMakerContract: boolean
    orderInvalidReason: null | string[]
}

/**
 * 1 - Valid orders,
 * 2 - Temporarily invalid orders,
 * 3 - Invalid orders.
 */
export type StatusKey = 1 | 2 | 3
export type SortKey =
    | 'createDateTime'
    | 'takerRate'
    | 'makerRate'
    | 'makerAmount'
    | 'takerAmount'
