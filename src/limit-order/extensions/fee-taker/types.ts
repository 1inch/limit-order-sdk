import {Bps} from '../../../bps'
import {Address} from '../../../address'

export type ResolverFee = {
    /**
     * Goes to `protocolFeeRecipient`
     */
    resolverFee: Bps
}

export type IntegratorFee = {
    integratorFee: {
        fee: Bps
        /**
         * Integrator gets `share` of `fee` to `integratorFeeRecipient` and the rest goes to `protocolFeeRecipient`
         */
        share: Bps
    }
}

export type Fee = ResolverFee | IntegratorFee | (IntegratorFee & ResolverFee)

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

export type Recipients = {
    protocolFeeRecipient: Address
    integratorFeeRecipient: Address

    /**
     * In case receiver of taker tokens is not maker
     */
    tokensRecipient?: Address
}
