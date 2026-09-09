export const ZX = '0x'

const ONE_INCH_LIMIT_ORDER_V4 = '0x111111125421ca6dc452d289314280a0f8842a65'
const ONE_INCH_LIMIT_ORDER_V4_ZK_SYNC =
    '0x6fd4383cb451173d5f9304f041c7bcbf27d561ff'
const ONE_INCH_LIMIT_ORDER_V4_ROBINHOOD =
    '0x5a705de8982235a7fa45bb83dcacf03a211389c7'
const ONE_INCH_LIMIT_ORDER_V4_HYPEREVM =
    '0x5281602adc446a94eb48d055f514a6d8d5bee176'
const ONE_INCH_LIMIT_ORDER_V4_ARC = '0xe08cab0828a67291ec4af1fb3e7f867e206a6bda'

const NATIVE_ORDER_FACTORY = '0xe12e0f117d23a5ccc57f8935cd8c4e80cd91ff01'
const NATIVE_ORDER_FACTORY_ZK_SYNC =
    '0xfd1d18173d2f179a45bf21f755a261aae7c2d769'
const NATIVE_ORDER_FACTORY_ROBINHOOD =
    '0xc4d4d760b101eb6b2ae92fcf7bf3ff8bf0a9f75b'
// Shared deployment on Monad (143), Cronos (25), HyperEVM (999) and Arc (5042)
const NATIVE_ORDER_FACTORY_MONAD_CRONOS_HYPEREVM_ARC =
    '0x14b19fccaf92862eddb2cf361718d300f171ab03'

const NATIVE_ORDER_IMPL = '0xf3eaf3c54f1ef887914b9c19e1ab9d3e581557eb'
const NATIVE_ORDER_IMPL_ZK_SYNC = '0xf850a926554fc7898d1bda051bc206942909b8f2'
const NATIVE_ORDER_IMPL_ROBINHOOD = '0xfe1513c7dae39a75228af5427af69d52ee1b5bd3'
// Shared deployment on Monad (143), Cronos (25), HyperEVM (999) and Arc (5042)
const NATIVE_ORDER_IMPL_MONAD_CRONOS_HYPEREVM_ARC =
    '0xeeb2a74c34ef852534ebe4fe9a63aacc69e2f9a1'

export const getLimitOrderContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return ONE_INCH_LIMIT_ORDER_V4_ZK_SYNC
    }

    if (chainId === 4663 /*Robinhood*/) {
        return ONE_INCH_LIMIT_ORDER_V4_ROBINHOOD
    }

    if (chainId === 999 /*HyperEVM*/) {
        return ONE_INCH_LIMIT_ORDER_V4_HYPEREVM
    }

    if (chainId === 5042 /*Arc*/) {
        return ONE_INCH_LIMIT_ORDER_V4_ARC
    }

    return ONE_INCH_LIMIT_ORDER_V4
}

export const getNativeOrderFactoryContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return NATIVE_ORDER_FACTORY_ZK_SYNC
    }

    if (chainId === 4663 /*Robinhood*/) {
        return NATIVE_ORDER_FACTORY_ROBINHOOD
    }

    if (
        chainId === 143 /*Monad*/ ||
        chainId === 25 /*Cronos*/ ||
        chainId === 999 /*HyperEVM*/ ||
        chainId === 5042 /*Arc*/
    ) {
        return NATIVE_ORDER_FACTORY_MONAD_CRONOS_HYPEREVM_ARC
    }

    return NATIVE_ORDER_FACTORY
}

export const getNativeOrderImplContract = (chainId: number): string => {
    if (chainId === 324 /*ZkSync*/) {
        return NATIVE_ORDER_IMPL_ZK_SYNC
    }

    if (chainId === 4663 /*Robinhood*/) {
        return NATIVE_ORDER_IMPL_ROBINHOOD
    }

    if (
        chainId === 143 /*Monad*/ ||
        chainId === 25 /*Cronos*/ ||
        chainId === 999 /*HyperEVM*/ ||
        chainId === 5042 /*Arc*/
    ) {
        return NATIVE_ORDER_IMPL_MONAD_CRONOS_HYPEREVM_ARC
    }

    return NATIVE_ORDER_IMPL
}
