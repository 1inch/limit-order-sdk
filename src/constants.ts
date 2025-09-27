export const ZX = '0x'

const ONE_INCH_LIMIT_ORDER_V4 = '0x111111125421ca6dc452d289314280a0f8842a65'
const ONE_INCH_LIMIT_ORDER_V4_ZK_SYNC =
    '0x6fd4383cb451173d5f9304f041c7bcbf27d561ff'

const NATIVE_ORDER_FACTORY = '0xe12e0f117d23a5ccc57f8935cd8c4e80cd91ff01'
const NATIVE_ORDER_FACTORY_ZK_SYNC = '' // todo: update

const NATIVE_ORDER_IMPL = '0xf3eaf3c54f1ef887914b9c19e1ab9d3e581557eb'
const NATIVE_ORDER_IMPL_ZK_SYNC = '' // todo: update

export const getLimitOrderContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return ONE_INCH_LIMIT_ORDER_V4_ZK_SYNC
    }

    return ONE_INCH_LIMIT_ORDER_V4
}

export const getNativeOrderFactoryContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return NATIVE_ORDER_FACTORY_ZK_SYNC
    }

    return NATIVE_ORDER_FACTORY
}

export const getNativeOrderImplContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return NATIVE_ORDER_IMPL_ZK_SYNC
    }

    return NATIVE_ORDER_IMPL
}
