import {Address} from '../../../address'

export type Whitelist = {
    isWhitelisted(taker: Address): boolean
}
