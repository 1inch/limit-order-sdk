#!/usr/bin/env node
/**
 * Staging E2E for the SDK fee integration (PT9-759).
 *
 * Exercises the real partner flow through the SDK, against a staging Dev Portal org:
 *
 *   Api.getFeeParams (/fee-info)  ->  Sdk.createOrder (fee extension + track code)
 *   ->  sign  ->  Sdk.submitOrder  ->  Api.getOrderByHash
 *
 * The org fee config (Business Portal, limitOrder swap type) drives all values —
 * update the org between runs to cover different scenarios. The script asserts
 * INTERNAL CONSISTENCY (order encodes exactly what /fee-info returned); pass
 * --expect-* args to additionally pin org-configured values.
 *
 * This is gateway-only by design: the SDK authenticates with the org key and the
 * gateway injects the fee headers. Direct header injection is covered by the API
 * repo scripts (limit-orders-api/scripts/tests/).
 *
 * Build the SDK first (script imports from dist):
 *   pnpm build
 *
 * Profiles:
 *   sdk-order    submit flow with whatever fees the org has (add --expect-* to pin)
 *   sdk-feeless  org with all fees zero — createOrder builds a plain order (no extension), submit accepted
 *   sdk-local    no network: Bps.fromSharePercent / track-code sanity
 *
 * Usage:
 *   AUTH_KEY=<org key> node scripts/tests/staging-fee-e2e.mjs --profile sdk-order \
 *     [--expect-resolver-bps 30] [--expect-integrator-bps 7] [--expect-share-percent 85]
 *   AUTH_KEY=<org key> node scripts/tests/staging-fee-e2e.mjs --profile sdk-feeless
 *   node scripts/tests/staging-fee-e2e.mjs --profile sdk-local
 *
 * Env:
 *   AUTH_KEY           dev portal org key (staging)
 *   BASE_URL           default https://proxy-app-staging.1inch.com/v2.0/orderbook/v4.1
 *   CHAIN_ID           default 1
 *   MAKER_PRIVATE_KEY  optional; fresh throwaway wallet when unset
 *
 * Exit code 0 = OK, non-zero = failed assertion / request error.
 */

import {Wallet, id} from 'ethers'
import {
    Address,
    Api,
    Bps,
    FetchProviderConnector,
    LimitOrderWithFee,
    MakerTraits,
    Sdk
} from '../../dist/esm/index.js'

const DEFAULT_BASE_URL = 'https://proxy-app-staging.1inch.com/v2.0/orderbook/v4.1'

/** WETH / USDC on Ethereum mainnet — non-stable pair */
const ORDER_INFO_INPUT = {
    makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    makingAmount: 1_000000000000000000n, // 1 WETH
    takingAmount: 4000_000000n // 4000 USDC
}

function parseArgs(argv) {
    const args = {}

    for (let i = 0; i < argv.length; i++) {
        const token = argv[i]
        if (!token.startsWith('--')) continue
        const key = token.slice(2)
        const next = argv[i + 1]

        if (next === undefined || next.startsWith('--')) {
            args[key] = true
        } else {
            args[key] = next
            i++
        }
    }

    return args
}

const args = parseArgs(process.argv.slice(2))
const profile = args.profile || process.env.PROFILE

if (!['sdk-order', 'sdk-feeless', 'sdk-local'].includes(profile)) {
    console.error(
        'Usage: node scripts/tests/staging-fee-e2e.mjs --profile sdk-order|sdk-feeless|sdk-local\n' +
            'See the header comment for env vars and --expect-* args.'
    )
    process.exit(1)
}

const cfg = {
    baseUrl: (args['base-url'] || process.env.BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
    chainId: Number(args['chain-id'] || process.env.CHAIN_ID || 1),
    authKey: args['auth-key'] || process.env.AUTH_KEY || '',
    makerKey: process.env.MAKER_PRIVATE_KEY || Wallet.createRandom().privateKey
}

const fails = []

function check(condition, message) {
    if (!condition) fails.push(message)
}

function finish() {
    console.log('--- Result ---')
    console.log(`  verdict: ${fails.length === 0 ? 'OK' : 'FAIL'}`)
    fails.forEach((f) => console.log(`    - ${f}`))
    process.exit(fails.length === 0 ? 0 : 1)
}

/** Same derivation the SDK uses for non-hex sources: keccak256(source)[0:4] as the 32-bit track code. */
function expectedTrackCode(source) {
    return BigInt(id(source).slice(0, 10))
}

function runLocalChecks() {
    check(Bps.fromSharePercent(85).value === 8500n, 'fromSharePercent(85) must be 8500 bps')
    check(Bps.fromSharePercent('85.5').value === 8550n, "fromSharePercent('85.5') must be 8550 bps")
    check(Bps.fromSharePercent(0).value === 0n, 'fromSharePercent(0) must be 0 bps')
    check(Bps.fromPercent(15).value === 1500n, 'fromPercent(15) must be 1500 bps')

    let threw = false

    try {
        Bps.fromSharePercent('-1')
    } catch {
        threw = true
    }

    check(threw, 'fromSharePercent(-1) must throw')
    console.log('sdk-local: Bps math checks done')
}

async function main() {
    console.log('SDK staging fee E2E (PT9-759)')
    console.log(`  profile: ${profile}`)

    if (profile === 'sdk-local') {
        runLocalChecks()

        return finish()
    }

    if (!cfg.authKey) {
        console.error('AUTH_KEY (dev portal org key) is required for network profiles.')
        process.exit(1)
    }

    const maker = new Wallet(cfg.makerKey)
    console.log(`  baseUrl: ${cfg.baseUrl}`)
    console.log(`  maker  : ${maker.address} ${process.env.MAKER_PRIVATE_KEY ? '(from env)' : '(throwaway)'}`)
    console.log('')

    const apiConfig = {
        networkId: cfg.chainId,
        authKey: cfg.authKey,
        baseUrl: cfg.baseUrl,
        httpConnector: new FetchProviderConnector()
    }
    const api = new Api(apiConfig)
    const sdk = new Sdk(apiConfig)

    const orderInfo = {
        maker: new Address(maker.address),
        makerAsset: new Address(ORDER_INFO_INPUT.makerAsset),
        takerAsset: new Address(ORDER_INFO_INPUT.takerAsset),
        makingAmount: ORDER_INFO_INPUT.makingAmount,
        takingAmount: ORDER_INFO_INPUT.takingAmount
    }
    const makerTraits = MakerTraits.default()
        .withExpiration(BigInt(Math.floor(Date.now() / 1000) + 3600))
        .allowPartialFills()
        .allowMultipleFills()

    const feeInfo = await api.getFeeParams({
        makerAsset: orderInfo.makerAsset,
        takerAsset: orderInfo.takerAsset,
        makerAmount: orderInfo.makingAmount,
        takerAmount: orderInfo.takingAmount
    })
    console.log('fee-info:', JSON.stringify(feeInfo, null, 2))

    if (profile === 'sdk-feeless') {
        check(Number(feeInfo.feeBps) === 0, `org must be feeless for this profile, got feeBps=${feeInfo.feeBps}`)
        check(!feeInfo.integratorFeeBps, `org must be feeless, got integratorFeeBps=${feeInfo.integratorFeeBps}`)

        // fixed behavior (fix/PT9-759-zero-fee-orders): plain order without the fee extension
        const order = await sdk.createOrder(orderInfo, makerTraits)

        check(!(order instanceof LimitOrderWithFee), 'feeless pair must produce a plain order, got LimitOrderWithFee')
        check(order.extension.isEmpty(), 'feeless order must have an empty extension')

        const struct = order.build()
        const saltTrack = BigInt(struct.salt) >> 224n
        check(
            saltTrack === expectedTrackCode(feeInfo.source),
            `salt track code ${saltTrack} != keccak("${feeInfo.source}")[0:4] ${expectedTrackCode(feeInfo.source)}`
        )

        const typedData = order.getTypedData(cfg.chainId)
        const signature = await maker.signTypedData(typedData.domain, {Order: typedData.types.Order}, typedData.message)
        const orderHash = order.getOrderHash(cfg.chainId)

        await sdk.submitOrder(order, signature)
        console.log(`feeless plain order submitted: ${orderHash}`)

        const stored = await api.getOrderByHash(orderHash)
        check(String(stored?.data?.extension ?? '') === '0x', 'stored feeless order must have extension 0x')

        return finish()
    }

    // ---- sdk-order ----------------------------------------------------------
    if (args['expect-resolver-bps'] !== undefined) {
        check(
            Number(feeInfo.feeBps) === Number(args['expect-resolver-bps']),
            `feeBps expected ${args['expect-resolver-bps']}, got ${feeInfo.feeBps}`
        )
    }

    if (args['expect-integrator-bps'] !== undefined) {
        check(
            Number(feeInfo.integratorFeeBps ?? 0) === Number(args['expect-integrator-bps']),
            `integratorFeeBps expected ${args['expect-integrator-bps']}, got ${feeInfo.integratorFeeBps}`
        )
    }

    if (args['expect-share-percent'] !== undefined) {
        check(
            Number(feeInfo.integratorFeeSharePercent ?? 0) === Number(args['expect-share-percent']),
            `integratorFeeSharePercent expected ${args['expect-share-percent']}, got ${feeInfo.integratorFeeSharePercent}`
        )
    }

    const order = await sdk.createOrder(orderInfo, makerTraits)
    const fees = order.feeExtension.fees

    check(
        fees.resolver.fee.value === BigInt(feeInfo.feeBps),
        `extension resolver fee ${fees.resolver.fee.value} != fee-info feeBps ${feeInfo.feeBps}`
    )
    check(
        fees.resolver.whitelistDiscount.equal(Bps.fromPercent(Number(feeInfo.whitelistDiscountPercent ?? 0))),
        `extension whitelist discount ${fees.resolver.whitelistDiscount} != fee-info ${feeInfo.whitelistDiscountPercent}%`
    )

    const expectedIntegratorBps = BigInt(feeInfo.integratorFeeBps ?? 0)
    check(
        fees.integrator.fee.value === expectedIntegratorBps,
        `extension integrator fee ${fees.integrator.fee.value} != fee-info ${expectedIntegratorBps}`
    )

    if (expectedIntegratorBps > 0n) {
        check(
            fees.integrator.integrator.toString().toLowerCase() === String(feeInfo.integratorFeeReceiver).toLowerCase(),
            'extension integrator receiver != fee-info integratorFeeReceiver'
        )
        check(
            fees.integrator.protocol.toString().toLowerCase() === String(feeInfo.protocolFeeReceiver).toLowerCase(),
            'extension integrator protocol != fee-info protocolFeeReceiver'
        )
        check(
            fees.integrator.share.equal(Bps.fromSharePercent(feeInfo.integratorFeeSharePercent)),
            `extension integrator share ${fees.integrator.share} != fee-info ${feeInfo.integratorFeeSharePercent}%`
        )
    }

    check(
        order.feeExtension.address.toString().toLowerCase() === String(feeInfo.extensionAddress).toLowerCase(),
        'extension address != fee-info extensionAddress'
    )

    const struct = order.build()
    const saltTrack = BigInt(struct.salt) >> 224n
    check(
        saltTrack === expectedTrackCode(feeInfo.source),
        `salt track code ${saltTrack} != keccak("${feeInfo.source}")[0:4] ${expectedTrackCode(feeInfo.source)}`
    )

    const typedData = order.getTypedData(cfg.chainId)
    const signature = await maker.signTypedData(typedData.domain, {Order: typedData.types.Order}, typedData.message)
    const orderHash = order.getOrderHash(cfg.chainId)

    await sdk.submitOrder(order, signature)
    console.log(`submitted: ${orderHash}`)

    const stored = await api.getOrderByHash(orderHash)
    check(
        String(stored?.data?.extension ?? '') === order.extension.encode(),
        'stored extension differs from the submitted one'
    )
    console.log('order retrieved back from the book')

    return finish()
}

main().catch((err) => {
    console.error('Unexpected error:', err?.response?.data ?? err)
    fails.push(String(err?.message || err))
    finish()
})
