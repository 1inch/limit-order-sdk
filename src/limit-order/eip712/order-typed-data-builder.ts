import {ethers} from 'ethers'
import {
    EIP712Domain,
    LimitOrderV4TypeDataName,
    LimitOrderV4TypeDataVersion,
    Order
} from './domain.js'
import {EIP712DomainType, EIP712TypedData} from './eip712.types.js'
import {LimitOrderV4Struct} from '../types.js'
import {getLimitOrderContract} from '../../constants.js'

export function getOrderHash(data: EIP712TypedData): string {
    return ethers.TypedDataEncoder.hash(
        data.domain,
        {Order: data.types.Order},
        data.message
    )
}

export function buildOrderTypedData(
    chainId: number,
    verifyingContract: string,
    name: string,
    version: string,
    order: LimitOrderV4Struct
): EIP712TypedData {
    return {
        primaryType: 'Order',
        types: {EIP712Domain, Order},
        domain: {name, version, chainId, verifyingContract},
        message: order
    }
}

export function getDomainSeparator(
    name: string,
    version: string,
    chainId: number,
    verifyingContract: string
): string {
    return ethers.TypedDataEncoder.hashStruct(
        'EIP712Domain',
        {EIP712Domain: EIP712Domain},
        {name, version, chainId, verifyingContract}
    )
}

export function getLimitOrderV4Domain(chainId: number): EIP712DomainType {
    return {
        name: LimitOrderV4TypeDataName,
        version: LimitOrderV4TypeDataVersion,
        chainId,
        verifyingContract: getLimitOrderContract(chainId)
    }
}
