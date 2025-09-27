import {add0x, getBytesCount, isHexBytes, trim0x} from '@1inch/byte-utils'
import {AbiCoder, concat, keccak256} from 'ethers'
import assert from 'assert'
import {ProxyFactory} from './proxy-factory.js'
import {Address} from '../address.js'

export class ProxyFactoryZkSync extends ProxyFactory {
    private static create2Prefix =
        '0x2020dba91b30cc0006188af794c2fb30dd8520db7e2c088b7fc7c103c00ca494'

    /**
     * ZkSync proxy bytecode do not depends on implementation address
     *
     * @see proxy example - https://explorer.zksync.io/address/0xd5317Ded4FBb98526AdD35A15d63cFBFB929efc7
     */
    private static minimalProxyBytecodeHash =
        '0x01000035492ceb24a47d861a8fd7e65b117f2eb5bf6453e191ba770c70ca7f43'

    public override getProxyAddress(salt: string): Address {
        assert(isHexBytes(salt) && getBytesCount(salt) === 32n, 'invalid salt')

        const inputHash = keccak256(
            AbiCoder.defaultAbiCoder().encode(
                ['address'],
                [this.implementation.toString()]
            )
        )

        const concatenatedData = concat([
            ProxyFactoryZkSync.create2Prefix,
            add0x(trim0x(this.factory.toString()).padStart(64, '0')),
            salt,
            ProxyFactoryZkSync.minimalProxyBytecodeHash,
            inputHash
        ])

        return new Address(add0x(keccak256(concatenatedData).slice(-40)))
    }
}
