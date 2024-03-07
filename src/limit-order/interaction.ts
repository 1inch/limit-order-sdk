import {isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {Address} from '../address'

export class Interaction {
    constructor(public readonly target: Address, public readonly data: string) {
        assert(isHexBytes(data), 'Interaction data must be valid hex bytes')
    }

    /**
     * Hex string with 0x. First 20 bytes are target, then data
     */
    public encode(): string {
        return this.target.toString() + trim0x(this.data)
    }
}
