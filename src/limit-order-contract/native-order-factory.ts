import {Interface} from 'ethers'
import {CallInfo} from './types.js'
import ABI from '../abi/NativeOrderFactory.abi.json'
import {LimitOrderV4Struct} from '../limit-order/index.js'
import {Address} from '../address.js'

export class NativeOrdersFactory {
    private readonly iface = new Interface(ABI)

    constructor(public address: Address) {}

    public create(maker: Address, order: LimitOrderV4Struct): CallInfo {
        return {
            to: this.address,
            value: BigInt(order.makingAmount),
            data: this.iface.encodeFunctionData('create', [
                {...order, maker: maker.toString()}
            ])
        }
    }
}
