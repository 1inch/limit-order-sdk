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
import {parseUnits, Wallet} from 'ethers'

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
    makingAmount: parseUnits('100'),
    takingAmount: parseUnits('10'),
    maker: new Address(maker.address)
    // salt? : bigint
    // receiver? : Address
})

const typedData = order.getTypedData()
const signature = await maker.signTypedData(
    typedData.domain,
    {Order: typedData.types.Order},
    typedData.message
)
```


### RFQ Order creation

`RfqOrder` is a light, gas efficient version of LimitOrder, but it does not support multiple/partial fills and extensions
Mainly used by market makers

```typescript
import {RfqOrder, Address, randBigInt} from "@1inch/limit-order-sdk"
import {parseUnits, Wallet} from 'ethers'

// it is a well-known test private key, do not use it in production
const privKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const maker = new Wallet(privKey)
const expiresIn = 120n // 2m
const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn

const order = new RfqOrder({
    makerAsset: new Address('0xdac17f958d2ee523a2206206994597c13d831ec7'),
    takerAsset: new Address('0x111111111117dc0aa78b770fa6a738034120c302'),
    makingAmount: parseUnits('100'),
    takingAmount: parseUnits('10'),
    maker: new Address(maker.address)
    // salt? : bigint
    // receiver? : Address
}, {
    allowedSender: new Address('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
    expiration,
    nonce: randBigInt(10000),
    unwrapToNative: false,
    usePermit2: false

})

const typedData = order.getTypedData()
const signature = await maker.signTypedData(
    typedData.domain,
    {Order: typedData.types.Order},
    typedData.message
)
```
