import assert from 'assert'
import {Address} from '../../../address.js'
import {Bps} from '../../../bps.js'

/**
 * Fee paid by resolver to `receiver`
 */
export class ResolverFee {
    public static ZERO = new ResolverFee(Address.ZERO_ADDRESS, Bps.ZERO)

    constructor(
        public readonly receiver: Address,
        public readonly fee: Bps,
        /**
         * whitelisted resolvers have discount on fee
         */
        public readonly whitelistDiscount = Bps.ZERO
    ) {
        if (receiver.isZero() && !fee.isZero()) {
            throw new Error('fee must be zero if receiver is zero address')
        }

        if (!receiver.isZero() && fee.isZero()) {
            throw new Error('receiver must be zero address if fee is zero')
        }

        if (fee.isZero() && !whitelistDiscount.isZero()) {
            throw new Error('whitelist discount must be zero if fee is zero')
        }

        assert(
            this.whitelistDiscount.value % 100n === 0n,
            `whitelist discount must have percent precision: 1%, 2% and so on`
        )
    }
}
