import {EIP712TypedData} from '../src'
import './global.d.ts'

export const now = (): bigint => BigInt(Math.floor(Date.now() / 1000))
export const patchVerifyingContract = (
    td: EIP712TypedData
): EIP712TypedData => {
    td.domain.verifyingContract =
        globalThis.limitOrderProtocolAddress.toLowerCase()

    return td
}
