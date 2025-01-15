import {Bps} from '../../../bps'

export type WhitelistInfo = {
    /**
     * Last 10 bytes of addresses
     */
    addresses: string[]
    /**
     * Whitelist resolvers fee discount
     */
    discount: Bps
}
