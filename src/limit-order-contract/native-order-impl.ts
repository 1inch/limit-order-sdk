import {Interface} from 'ethers'
import {CallInfo} from './types.js'
import ABI from '../abi/NativeOrderImpl.abi.json' with {type: 'json'}
import {LimitOrderV4Struct} from '../limit-order/index.js'
import {Address} from '../address.js'

export class NativeOrdersImpl {
    private readonly iface = new Interface(ABI)

    constructor(public readonly address: Address) {}

    public cancel(maker: Address, order: LimitOrderV4Struct): CallInfo {
        return {
            to: this.address,
            value: 0n,
            data: this.iface.encodeFunctionData('cancelOrder', [
                {...order, maker: maker.toString()}
            ])
        }
    }

    public cancelExpiredOrderByResolver(
        maker: Address,
        order: LimitOrderV4Struct,
        rewardLimit: bigint
    ): CallInfo {
        return {
            to: this.address,
            value: 0n,
            data: this.iface.encodeFunctionData(
                'cancelExpiredOrderByResolver',
                [{...order, maker: maker.toString()}, rewardLimit]
            )
        }
    }
}
