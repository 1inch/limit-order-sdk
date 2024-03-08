export function randBigInt(max: number): bigint {
    return BigInt(Math.floor(Math.random() * max))
}
