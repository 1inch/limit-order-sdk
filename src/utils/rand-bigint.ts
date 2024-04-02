import {randomBytes} from 'ethers'

export function randBigInt(max: number | bigint): bigint {
    let bytesCount = 0
    max = BigInt(max) + 1n
    let rest = max
    while (rest) {
        rest = rest >> 8n
        bytesCount += 1
    }

    const bytes = randomBytes(bytesCount)

    const val = bytes.reduce(
        (acc, val, i) => acc + (BigInt(val) << BigInt(i * 8)),
        0n
    )

    return val % max
}
