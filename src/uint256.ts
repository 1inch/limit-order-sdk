import {UINT_256_MAX} from '@1inch/byte-utils'
import {Address} from './address'
import assert from 'assert'

export class Uint256 {
    constructor(public readonly inner: bigint) {
        assert(inner <= UINT_256_MAX, 'value to big for Uint256')
        assert(inner >= 0n, 'Uint256 value must be positive')
    }

    public toString(): string {
        return this.inner.toString()
    }

    public toBigint(): bigint {
        return this.inner
    }

    public equal(other: Uint256 | Address): boolean {
        return this.inner === other.toBigint()
    }
}
