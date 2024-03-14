import {Interface, Signature} from 'ethers'
import {LimitOrderV4Struct, TakerTraits} from '../limit-order'
import LOP_V4_ABI from '../abi/AggregationRouterV6.abi.json'

const lopContract = new Interface(LOP_V4_ABI)

export class LimitOrderContract {
    static getFillOrderArgsCalldata(
        order: LimitOrderV4Struct,
        signature: string,
        takerTraits: TakerTraits,
        amount: bigint
    ): string {
        const {r, yParityAndS: vs} = Signature.from(signature)
        const {args, trait} = takerTraits.encode()

        return lopContract.encodeFunctionData('fillOrderArgs', [
            order,
            r,
            vs,
            amount,
            trait,
            args
        ])
    }

    static getFillContractOrderArgsCalldata(
        order: LimitOrderV4Struct,
        signature: string,
        takerTraits: TakerTraits,
        amount: bigint
    ): string {
        const {args, trait} = takerTraits.encode()

        return lopContract.encodeFunctionData('fillContractOrderArgs', [
            order,
            signature,
            amount,
            trait,
            args
        ])
    }
}
