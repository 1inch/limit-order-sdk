export enum Rounding {
    Ceil,
    Floor
}

// todo: move to more appropriate place
export function mulDiv(
    a: bigint,
    b: bigint,
    x: bigint,
    rounding: Rounding = Rounding.Floor
): bigint {
    const res = (a * b) / x

    if (rounding === Rounding.Ceil && (a * b) % x > 0) {
        return res + 1n
    }

    return res
}
