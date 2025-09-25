import {Address} from '../address.js'

export type CallInfo = {
    data: string
    to: Address
    value: bigint
}
