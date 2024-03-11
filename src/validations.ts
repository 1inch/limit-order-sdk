export function isValidAmount(value: string | bigint): boolean {
    try {
        const amount = BigInt(value)

        return amount >= 0n
    } catch (e) {
        return false
    }
}

export function isInt(val: number): boolean {
    return Math.floor(val) === val
}
