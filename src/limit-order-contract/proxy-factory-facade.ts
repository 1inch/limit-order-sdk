import {ProxyFactory} from './proxy-factory.js'
import {ProxyFactoryZkSync} from './proxy-factory-zk-sync.js'
import {Address} from '../address.js'
import {
    getNativeOrderFactoryContract,
    getNativeOrderImplContract
} from '../constants.js'

export class ProxyFactoryFacade implements ProxyFactory {
    private readonly proxy: ProxyFactory

    constructor(chainId: number, factory: Address, implementation: Address) {
        this.proxy = ProxyFactoryFacade.getFactory(
            chainId,
            factory,
            implementation
        )
    }

    get factory(): Address {
        return this.proxy.factory
    }

    get implementation(): Address {
        return this.proxy.implementation
    }

    public static default(chainId: number): ProxyFactory {
        return new ProxyFactoryFacade(
            chainId,
            new Address(getNativeOrderFactoryContract(chainId)),
            new Address(getNativeOrderImplContract(chainId))
        )
    }

    public static getFactory(
        chainId: number,
        factoryAddress: Address,
        implementationAddress: Address
    ): ProxyFactory {
        if (chainId === 324) {
            return new ProxyFactoryZkSync(factoryAddress, implementationAddress)
        }

        return new ProxyFactory(factoryAddress, implementationAddress)
    }

    public getProxyAddress(salt: string): Address {
        return this.proxy.getProxyAddress(salt)
    }
}
