import {Address} from '../../../address.js'

export type Whitelist = {
    isWhitelisted(taker: Address): boolean
}
