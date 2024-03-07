import {isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'

export function getBytesCount(hex: string): bigint {
    assert(isHexBytes(hex), 'invalid hex')

    return BigInt(trim0x(hex).length / 2)
}
