import {Extension} from './extension'
import {Address} from '../address'
import {Uint256} from '../uint256'

export type OrderInfoData = {
    makerAsset: Address
    takerAsset: Address
    makingAmount: bigint
    takingAmount: bigint
    maker: Address
    salt?: bigint
    receiver?: Address | Uint256 // Uint256 for cross chain with non evm chains
}

export type LimitOrderV4Struct = {
    salt: string
    maker: string
    receiver: string
    makerAsset: string
    takerAsset: string
    makingAmount: string
    takingAmount: string
    makerTraits: string
}

export interface IExtensionBuilder {
    build(): Extension
}
