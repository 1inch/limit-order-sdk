import {add0x, BitMask, BN} from '@1inch/byte-utils'
import assert from 'assert'
import {Address} from '../address.js'

/**
 * The MakerTraits type is an uint256, and different parts of the number are used to encode different traits.
 * High bits are used for flags
 * 255 bit `NO_PARTIAL_FILLS_FLAG`          - if set, the order does not allow partial fills
 * 254 bit `ALLOW_MULTIPLE_FILLS_FLAG`      - if set, the order permits multiple fills
 * 253 bit                                  - unused
 * 252 bit `PRE_INTERACTION_CALL_FLAG`      - if set, the order requires pre-interaction call
 * 251 bit `POST_INTERACTION_CALL_FLAG`     - if set, the order requires post-interaction call
 * 250 bit `NEED_CHECK_EPOCH_MANAGER_FLAG`  - if set, the order requires to check the epoch manager
 * 249 bit `HAS_EXTENSION_FLAG`             - if set, the order has extension(s)
 * 248 bit `USE_PERMIT2_FLAG`               - if set, the order uses permit2
 * 247 bit `UNWRAP_WETH_FLAG`               - if set, the order requires to unwrap WETH
 *
 * Low 200 bits are used for allowed sender, expiration, nonceOrEpoch, and series
 * uint80 last 10 bytes of allowed sender address (0 if any)
 * uint40 expiration timestamp (0 if none)
 * uint40 nonce or epoch
 * uint40 series
 */
export class MakerTraits {
    // Low 200 bits are used for allowed sender, expiration, nonceOrEpoch, and series
    private static ALLOWED_SENDER_MASK = new BitMask(0n, 80n)

    private static EXPIRATION_MASK = new BitMask(80n, 120n)

    private static NONCE_OR_EPOCH_MASK = new BitMask(120n, 160n)

    private static SERIES_MASK = new BitMask(160n, 200n)

    private static NO_PARTIAL_FILLS_FLAG = 255n

    private static ALLOW_MULTIPLE_FILLS_FLAG = 254n

    private static PRE_INTERACTION_CALL_FLAG = 252n

    private static POST_INTERACTION_CALL_FLAG = 251n

    private static NEED_CHECK_EPOCH_MANAGER_FLAG = 250n

    private static HAS_EXTENSION_FLAG = 249n

    private static USE_PERMIT2_FLAG = 248n

    private static UNWRAP_WETH_FLAG = 247n

    private value: BN

    constructor(val: bigint) {
        this.value = new BN(val)
    }

    static default(): MakerTraits {
        return new MakerTraits(0n)
    }

    /**
     * Last 10bytes of address
     */
    public allowedSender(): string {
        return this.value
            .getMask(MakerTraits.ALLOWED_SENDER_MASK)
            .value.toString(16)
            .padStart(20, '0')
    }

    public isPrivate(): boolean {
        return this.value.getMask(MakerTraits.ALLOWED_SENDER_MASK).value !== 0n
    }

    public withAllowedSender(sender: Address): this {
        assert(!sender.isZero(), 'Use withAnySender() to remove sender check')

        const lastHalf = add0x(sender.toString().slice(-20))
        this.value = this.value.setMask(
            MakerTraits.ALLOWED_SENDER_MASK,
            BigInt(lastHalf)
        )

        return this
    }

    /**
     * Removes `sender` check on contract
     */
    public withAnySender(): this {
        this.value = this.value.setMask(
            MakerTraits.ALLOWED_SENDER_MASK,
            BigInt(0)
        )

        return this
    }

    /**
     * If null is return than order has no expiration
     */
    public expiration(): bigint | null {
        const timestampSec = this.value.getMask(MakerTraits.EXPIRATION_MASK)

        if (timestampSec.isZero()) {
            return null
        }

        return timestampSec.value
    }

    /**
     * Set order expiration time
     *
     * @param expiration expiration timestamp in sec
     */
    public withExpiration(expiration: bigint): this {
        const expirationSec = expiration === null ? 0n : expiration

        this.value = this.value.setMask(
            MakerTraits.EXPIRATION_MASK,
            expirationSec
        )

        return this
    }

    /**
     * Returns epoch in case `isEpochManagerEnabled()` and nonce otherwise
     */
    public nonceOrEpoch(): bigint {
        return this.value.getMask(MakerTraits.NONCE_OR_EPOCH_MASK).value
    }

    /**
     * Set nonce
     * Note: nonce and epoch share the same field, so they cant be set together
     * @param nonce must be less or equal to `uint40::max`
     */
    public withNonce(nonce: bigint): this {
        this.value = this.value.setMask(MakerTraits.NONCE_OR_EPOCH_MASK, nonce)

        return this
    }

    /**
     * Enable epoch manager check
     *
     * If set, the contract will check that order epoch equals to epoch on `SeriesEpochManager` contract
     * Note: epoch manager can be used only when `partialFills` AND `multipleFills` allowed
     * Note: nonce and epoch share the same field, so they cant be set together
     *
     * @param series subgroup for epoch
     * @param epoch unique order id inside series
     * @see https://github.com/1inch/limit-order-protocol/blob/23d655844191dea7960a186652307604a1ed480a/contracts/helpers/SeriesEpochManager.sol#L6
     */
    public withEpoch(series: bigint, epoch: bigint): this {
        this.setSeries(series)
        this.enableEpochManagerCheck()

        return this.withNonce(epoch)
    }

    /**
     * Get current series
     */
    public series(): bigint {
        return this.value.getMask(MakerTraits.SERIES_MASK).value
    }

    /**
     * Returns true if order has an extension and false otherwise
     */
    public hasExtension(): boolean {
        return this.value.getBit(MakerTraits.HAS_EXTENSION_FLAG) === 1
    }

    /**
     * Mark that order has an extension
     */
    public withExtension(): this {
        this.value = this.value.setBit(MakerTraits.HAS_EXTENSION_FLAG, 1)

        return this
    }

    /**
     * Is partial fills allowed for order
     */
    public isPartialFillAllowed(): boolean {
        return this.value.getBit(MakerTraits.NO_PARTIAL_FILLS_FLAG) === 0
    }

    /**
     * Disable partial fills for order
     */
    public disablePartialFills(): this {
        this.value = this.value.setBit(MakerTraits.NO_PARTIAL_FILLS_FLAG, 1)

        return this
    }

    /**
     * Allow partial fills for order
     */
    public allowPartialFills(): this {
        this.value = this.value.setBit(MakerTraits.NO_PARTIAL_FILLS_FLAG, 0)

        return this
    }

    /**
     * Set partial fill flag to passed value
     */
    public setPartialFills(val: boolean): this {
        return val ? this.allowPartialFills() : this.disablePartialFills()
    }

    /**
     * Returns true if order allowing more than one fill and false otherwise
     */
    public isMultipleFillsAllowed(): boolean {
        return this.value.getBit(MakerTraits.ALLOW_MULTIPLE_FILLS_FLAG) === 1
    }

    /**
     * Allow many fills for order
     */
    public allowMultipleFills(): this {
        this.value = this.value.setBit(MakerTraits.ALLOW_MULTIPLE_FILLS_FLAG, 1)

        return this
    }

    /**
     * Allow at max 1 fill for order
     */
    public disableMultipleFills(): this {
        this.value = this.value.setBit(MakerTraits.ALLOW_MULTIPLE_FILLS_FLAG, 0)

        return this
    }

    /**
     * If `val` is true, then multiple fills allowed, otherwise disallowed
     */
    public setMultipleFills(val: boolean): this {
        return val ? this.allowMultipleFills() : this.disableMultipleFills()
    }

    /**
     * Returns true if maker has pre-interaction and false otherwise
     */
    public hasPreInteraction(): boolean {
        return this.value.getBit(MakerTraits.PRE_INTERACTION_CALL_FLAG) === 1
    }

    /**
     * Enable maker pre-interaction
     */
    public enablePreInteraction(): this {
        this.value = this.value.setBit(MakerTraits.PRE_INTERACTION_CALL_FLAG, 1)

        return this
    }

    /**
     * Disable maker pre-interaction
     */
    public disablePreInteraction(): this {
        this.value = this.value.setBit(MakerTraits.PRE_INTERACTION_CALL_FLAG, 0)

        return this
    }

    /**
     * Returns true if maker has post-interaction and false otherwise
     */
    public hasPostInteraction(): boolean {
        return this.value.getBit(MakerTraits.POST_INTERACTION_CALL_FLAG) === 1
    }

    /**
     * Enable maker post-interaction
     */
    public enablePostInteraction(): this {
        this.value = this.value.setBit(
            MakerTraits.POST_INTERACTION_CALL_FLAG,
            1
        )

        return this
    }

    /**
     * Disable maker post-interaction
     */
    public disablePostInteraction(): this {
        this.value = this.value.setBit(
            MakerTraits.POST_INTERACTION_CALL_FLAG,
            0
        )

        return this
    }

    /**
     * Returns true if epoch manager enabled
     *
     * @see MakerTraits.enableEpochManagerCheck
     */
    public isEpochManagerEnabled(): boolean {
        return (
            this.value.getBit(MakerTraits.NEED_CHECK_EPOCH_MANAGER_FLAG) === 1
        )
    }

    /**
     * Returns true if `permit2` enabled for maker funds transfer
     *
     * @see https://github.com/Uniswap/permit2
     */
    public isPermit2(): boolean {
        return this.value.getBit(MakerTraits.USE_PERMIT2_FLAG) === 1
    }

    /**
     * Use `permit2` to transfer maker funds to contract
     *
     * @see https://github.com/Uniswap/permit2
     */
    public enablePermit2(): this {
        this.value = this.value.setBit(MakerTraits.USE_PERMIT2_FLAG, 1)

        return this
    }

    /**
     * Do not use `permit2` to transfer maker funds to contract
     *
     * @see https://github.com/Uniswap/permit2
     */
    public disablePermit2(): this {
        this.value = this.value.setBit(MakerTraits.USE_PERMIT2_FLAG, 0)

        return this
    }

    /**
     * Is WRAPPED token will be unwrapped to NATIVE before sending to maker
     */
    public isNativeUnwrapEnabled(): boolean {
        return this.value.getBit(MakerTraits.UNWRAP_WETH_FLAG) === 1
    }

    /**
     * Unwrap WRAPPED token to NATIVE before sending it to maker
     */
    public enableNativeUnwrap(): this {
        this.value = this.value.setBit(MakerTraits.UNWRAP_WETH_FLAG, 1)

        return this
    }

    /**
     * Do not unwrap WRAPPED token to NATIVE before sending it to maker
     */
    public disableNativeUnwrap(): this {
        this.value = this.value.setBit(MakerTraits.UNWRAP_WETH_FLAG, 0)

        return this
    }

    public asBigInt(): bigint {
        return this.value.value
    }

    /**
     * Returns true if bit invalidator mode is used to invalidate order (cancel/mark as filled)
     *
     * Bit invalidator is cheaper in terms of gas, but can be used only when partial fills OR multiple fills are disabled
     *
     * @see https://github.com/1inch/limit-order-protocol/blob/3c9b8ab8bbc4c10ff8d615fc3d33f501993c292d/contracts/libraries/MakerTraitsLib.sol#L142
     */
    public isBitInvalidatorMode(): boolean {
        return !this.isPartialFillAllowed() || !this.isMultipleFillsAllowed()
    }

    private enableEpochManagerCheck(): void {
        assert(
            !this.isBitInvalidatorMode(),
            'Epoch manager allowed only when partialFills and multipleFills enabled'
        )

        this.value = this.value.setBit(
            MakerTraits.NEED_CHECK_EPOCH_MANAGER_FLAG,
            1
        )
    }

    /**
     * Set series. Only when epoch manager enabled
     * Series is a subgroup for epoch's, it can be useful when you want to cancel a group of orders at once
     *
     * @see MakerTraits.enableEpochManagerCheck
     */
    private setSeries(series: bigint): void {
        this.value = this.value.setMask(MakerTraits.SERIES_MASK, series)
    }
}
