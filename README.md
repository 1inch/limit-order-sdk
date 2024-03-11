# 1inch Limit Order Protocol v4 SDK

## Installation

```shell
npm install '@1inch/limit-order-sdk'
```

## Docs
- [Limit Order](./src/limit-order/README.md)

## Usage examples

### Order creation

```typescript
import {LimitOrder, MakerTraits, Address} from "@1inch/limit-order-sdk"
import {Wallet} from 'ethers'

// it is a well-known test private key, do not use it in production
const privKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const maker = new Wallet(privKey)
const expiresIn = 120n // 2m
const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn

// see MakerTraits.ts
const makerTraits = MakerTraits.default().withExpiration(expiration)

const order = new LimitOrder({
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
```


### RFQ Order creation

`RfqOrder` is a light, gas efficient version of LimitOrder, but it does not support multiple fills and extension
Mainly used by market makers

```typescript
import {RfqOrder, Address, randBigInt} from "@1inch/limit-order-sdk"
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
    nonce: randBigInt(10000),
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
import {Api, HttpProviderConnector, LimitOrder} from "@1inch/limit-order-sdk"
import {AxiosProviderConnector} from "@1inch/limit-order-sdk/axios"

const api = new Api({
    networkId: 1, // ethereum
    authKey: 'key', // get it at https://portal.1inch.dev/
    httpConnector: new AxiosProviderConnector() // or use any connector which implements `HttpProviderConnector`
})

// submit order 
const order = new LimitOrder(...) /// see `Order creation` section
const signature = '0x'
await api.submitOrder(order, signature)

// get order by hash
const orderInfo = await api.getOrderByHash(order.getOrderHash())

// get orders by maker
const orders = await api.getOrdersByMaker(order.maker)
```
