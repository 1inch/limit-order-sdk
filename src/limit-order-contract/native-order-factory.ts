import {Interface} from 'ethers'
import {CallInfo} from './types.js'
import ABI from '../abi/NativeOrderFactory.abi.json' with {type: 'json'}
import {LimitOrderV4Struct} from '../limit-order/index.js'
import {Address} from '../address.js'
import {getNativeOrderFactoryContract} from '../constants.js'

export class NativeOrdersFactory {
    private readonly iface = new Interface(ABI)

    constructor(public readonly address: Address) {}

    static default(chainId: number): NativeOrdersFactory {
        return new NativeOrdersFactory(
            new Address(getNativeOrderFactoryContract(chainId))
        )
    }

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
