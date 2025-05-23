# 1inch Limit Order Protocol v4 SDK

## Installation

```shell
npm install '@1inch/limit-order-sdk'
```

## Docs
- [Limit Order](./src/limit-order/README.md)
- [Limit Order Contract](./src/limit-order-contract/README.md)

## Usage examples

### Order creation
```typescript
import {LimitOrder, MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector} from "@1inch/limit-order-sdk"
import {Wallet} from 'ethers'

// it is a well-known test private key, do not use it in production
const privKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const authKey = '...'
const maker = new Wallet(privKey)
const expiresIn = 120n // 2m
const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn

const UINT_40_MAX = (1n << 48n) - 1n

// see MakerTraits.ts
const makerTraits = MakerTraits.default()
  .withExpiration(expiration)
  .withNonce(randBigInt(UINT_40_MAX))

const sdk = new Sdk({ authKey, networkId: 1, httpConnector: new FetchProviderConnector() })

const order = await sdk.createOrder({
    makerAsset: new Address('0xdac17f958d2ee523a2206206994597c13d831ec7'),
    takerAsset: new Address('0x111111111117dc0aa78b770fa6a738034120c302'),
    makingAmount: 100_000000n, // 100 USDT
    takingAmount: 10_00000000000000000n, // 10 1INCH
    maker: new Address(maker.address),
    // salt? : bigint
    // receiver? : Address
}, makerTraits)

const typedData = order.getTypedData()
const signature = await maker.signTypedData(
    typedData.domain,
    {Order: typedData.types.Order},
    typedData.message
)

await sdk.submitOrder(order, signature)
```


### RFQ Order creation

`RfqOrder` is a light, gas efficient version of LimitOrder, but it does not support multiple fills and extension
Mainly used by market makers

```typescript
import {RfqOrder, Address, randBigInt} from "@1inch/limit-order-sdk"
import {UINT_40_MAX} from "@1inch/byte-utils"
import {Wallet} from 'ethers'

// it is a well-known test private key, do not use it in production
const privKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const maker = new Wallet(privKey)
const expiresIn = 120n // 2m
const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn

const order = new RfqOrder({
    makerAsset: new Address('0xdac17f958d2ee523a2206206994597c13d831ec7'),
    takerAsset: new Address('0x111111111117dc0aa78b770fa6a738034120c302'),
    makingAmount: 100_000000n, // 100 USDT
    takingAmount: 10_00000000000000000n, // 10 1INCH
    maker: new Address(maker.address)
}, {
    allowedSender: new Address('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
    expiration,
    nonce: randBigInt(UINT_40_MAX),
})

const typedData = order.getTypedData()
const signature = await maker.signTypedData(
    typedData.domain,
    {Order: typedData.types.Order},
    typedData.message
)
```


### API

```typescript
import {Api, FetchProviderConnector, LimitOrder, HttpProviderConnector} from '@1inch/limit-order-sdk'

const networkId = 1 // ethereum
const api = new Api({
    networkId,
    authKey: 'key', // get it at https://portal.1inch.dev/
    httpConnector: new FetchProviderConnector() // or use any connector which implements `HttpProviderConnector`
})

// submit order
const order = ... /// see `Order creation` section
const signature = '0x'
await api.submitOrder(order, signature)

// get order by hash
const orderHash = order.getOrderHash(networkId)
const orderInfo = await api.getOrderByHash(orderHash)

// get orders by maker
const orders = await api.getOrdersByMaker(order.maker)
```

#### With `axios` as http provider

`axios` package should be installed

```typescript
import {Api, LimitOrder} from "@1inch/limit-order-sdk"
import {AxiosProviderConnector} from '@1inch/limit-order-sdk/axios'

const api = new Api({
    networkId: 1, // ethereum
    authKey: 'key', // get it at https://portal.1inch.dev/
    httpConnector: new AxiosProviderConnector()
})
```

##  Testing

### Unit tests

Install dependencies
```shell
pnpm install
```

Run tests
```shell
pnpm test
```

### Integration tests
Integration tests are inside [tests](./tests) folder.
They use [foundry](https://book.getfoundry.sh/) fork node and execute transaction on it.

Install dependencies
```shell
pnpm install && forge install
```

Run tests
```shell
pnpm test:integration
```
