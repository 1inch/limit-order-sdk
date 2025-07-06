import {Interface, Signature} from 'ethers'
import assert from 'assert'
import {LimitOrderV4Struct, TakerTraits} from '../limit-order/index.js'
import LOP_V4_ABI from '../abi/AggregationRouterV6.abi.json' with {type: 'json'}
import {ZX} from '../constants.js'

const lopContract = new Interface(LOP_V4_ABI)

/**
 * @see https://github.com/1inch/limit-order-protocol/blob/3169ea46932ef44114a215a60d1d91ef022b416d/contracts/OrderMixin.sol#L27
 */
export class LimitOrderContract {
    /**
     *  Fill order WITHOUT an extension and taker interaction
     *
     *  @see getFillOrderArgsCalldata
     *  @see getFillContractOrderCalldata
     */
    static getFillOrderCalldata(
        order: LimitOrderV4Struct,
        signature: string,
        takerTraits: TakerTraits,
        amount: bigint
    ): string {
        const {r, yParityAndS: vs} = Signature.from(signature)
        const {args, trait} = takerTraits.encode()

        assert(
            args === ZX,
            'takerTraits contains args data, use LimitOrderContract.getFillOrderArgsCalldata method'
        )

        return lopContract.encodeFunctionData('fillOrder', [
            order,
            r,
            vs,
            amount,
            trait
        ])
    }

    /**
     *  Fill contract order (order maker is smart-contract) WITHOUT an extension and taker interaction
     *
     *  @see getFillContractOrderArgsCalldata
     *  @see getFillOrderCalldata
     */
    static getFillContractOrderCalldata(
        order: LimitOrderV4Struct,
        signature: string,
        takerTraits: TakerTraits,
        amount: bigint
    ): string {
        const {args, trait} = takerTraits.encode()

        assert(
            args === ZX,
            'takerTraits contains args data, use LimitOrderContract.getFillContractOrderArgsCalldata method'
        )

        return lopContract.encodeFunctionData('fillContractOrder', [
            order,
            signature,
            amount,
            trait,
            args
        ])
    }

    /**
     *  Fill order WITH an extension or taker interaction
     *
     *  @see getFillOrderCalldata
     *  @see getFillContractOrderArgsCalldata
     */
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

    /**
     *  Fill contract order (order maker is smart-contract) WITH an extension or taker interaction
     *
     *  @see getFillOrderArgsCalldata
     *  @see getFillContractOrderCalldata
     */
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
