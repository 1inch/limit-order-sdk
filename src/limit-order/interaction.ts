import {BytesIter, isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {Address} from '../address.js'

export class Interaction {
    constructor(
        public readonly target: Address,
        public readonly data: string
    ) {
        assert(isHexBytes(data), 'Interaction data must be valid hex bytes')
    }

    /**
     * Create `Interaction` from bytes
     *
     * @param bytes Hex string with 0x. First 20 bytes are target, then data
     */
    public static decode(bytes: string): Interaction {
        const iter = BytesIter.HexString(bytes)

        return new Interaction(new Address(iter.nextUint160()), iter.rest())
    }

    /**
     * Hex string with 0x. First 20 bytes are target, then data
     */
    public encode(): string {
        return this.target.toString() + trim0x(this.data)
    }
}
