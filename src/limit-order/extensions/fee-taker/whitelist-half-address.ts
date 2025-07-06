import {BytesBuilder} from '@1inch/byte-utils'
import {Address} from 'address'
import {Whitelist} from './types.js'

export class WhitelistHalfAddress implements Whitelist {
    constructor(
        /**
         * Last 10 bytes of addresses
         */
        private readonly addresses: string[]
    ) {}

    public get length(): number {
        return this.addresses.length
    }

    static new(addresses: Address[]): WhitelistHalfAddress {
        return new WhitelistHalfAddress(
            addresses?.map((w) => w.lastHalf()) || []
        )
    }

    public isWhitelisted(address: Address): boolean {
        const half = address.lastHalf()

        return this.addresses.some((w) => w === half)
    }

    public encodeTo(builder: BytesBuilder): BytesBuilder {
        builder.addUint8(BigInt(this.addresses.length))

        for (const halfAddress of this.addresses) {
            builder.addBytes(halfAddress)
        }

        return builder
    }
}
