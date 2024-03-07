export const ZX = '0x'

const ONE_INCH_LIMIT_ORDER_V4 = '0x111111125421ca6dc452d289314280a0f8842a65'

export const getLimitOrderContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        throw new Error('Chain not supported yet')
    }

    return ONE_INCH_LIMIT_ORDER_V4
}
