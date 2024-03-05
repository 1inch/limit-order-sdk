import assert from 'assert'
import {trim0x} from './zero-x-prefix'
import {isHexBytes} from '../../validations'

export function getBytesCount(hex: string): bigint {
    assert(isHexBytes(hex), 'invalid hex')

    return BigInt(trim0x(hex).length / 2)
}
