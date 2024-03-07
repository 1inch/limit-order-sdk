export function isValidAmount(value: string | bigint): boolean {
    try {
        const amount = BigInt(value)

        return amount >= 0n
    } catch (e) {
        return false
    }
}
