import {UINT_40_MAX} from '@1inch/byte-utils'
import {FeeTakerExtension} from './fee-taker.extension'
import {LimitOrder} from '../../limit-order'
import {LimitOrderV4Struct, OrderInfoData} from '../../types'
import {MakerTraits} from '../../maker-traits'
import {Extension} from '../extension'
import {Address} from '../../../address'
import {calcTakingAmount} from '../../amounts'
import {randBigInt} from '../../../utils/rand-bigint'

export class LimitOrderWithFee extends LimitOrder {
    constructor(
        /**
         * Use `FeeTakerExtension.recipients.tokensRecipient` to set custom receiver
         */
        orderInfo: Omit<OrderInfoData, 'receiver'>,
        makerTraits = new MakerTraits(0n),
        public readonly feeExtension: FeeTakerExtension
    ) {
        makerTraits.enablePostInteraction() // to execute extension

        if (!makerTraits.nonceOrEpoch()) {
            makerTraits.withNonce(randBigInt(UINT_40_MAX))
        }

        super(
            {...orderInfo, receiver: feeExtension.address},
            makerTraits,
            feeExtension.build()
        )
    }

    static fromDataAndExtension(
        data: LimitOrderV4Struct,
        extension: Extension
    ): LimitOrderWithFee {
        const makerTraits = new MakerTraits(BigInt(data.makerTraits))
        const feeExt = FeeTakerExtension.fromExtension(extension)

        return new LimitOrderWithFee(
            {
                salt: BigInt(data.salt),
                maker: new Address(data.maker),
                makerAsset: new Address(data.makerAsset),
                takerAsset: new Address(data.takerAsset),
                makingAmount: BigInt(data.makingAmount),
                takingAmount: BigInt(data.takingAmount)
            },
            makerTraits,
            feeExt
        )
    }

    public getTakingAmount(
        taker: Address,
        makingAmount = this.makingAmount
    ): bigint {
        const takingAmount = calcTakingAmount(
            makingAmount,
            this.makingAmount,
            this.takingAmount
        )

        return this.feeExtension.getTakingAmount(taker, takingAmount)
    }

    /**
     * Fee in `takerAsset` which resolver pays to resolver fee receiver
     *
     * @param taker who will fill order
     * @param makingAmount amount wanted to fill
     */
    public getResolverFee(
        taker: Address,
        makingAmount = this.makingAmount
    ): bigint {
        const takingAmount = calcTakingAmount(
            makingAmount,
            this.makingAmount,
            this.takingAmount
        )

        return this.feeExtension.getResolverFee(taker, takingAmount)
    }

    /**
     * Fee in `takerAsset` which integrator gets to integrator wallet
     *
     * @param taker who will fill order
     * @param makingAmount amount wanted to fill
     */
    public getIntegratorFee(
        taker: Address,
        makingAmount = this.makingAmount
    ): bigint {
        const takingAmount = calcTakingAmount(
            makingAmount,
            this.makingAmount,
            this.takingAmount
        )

        return this.feeExtension.getIntegratorFee(taker, takingAmount)
    }

    /**
     * Fee in `takerAsset` which protocol gets
     * It equals to `share from integrator fee plus resolver fee`
     *
     * @param taker who will fill order
     * @param makingAmount amount wanted to fill
     */
    public getProtocolFee(
        taker: Address,
        makingAmount = this.makingAmount
    ): bigint {
        const takingAmount = calcTakingAmount(
            makingAmount,
            this.makingAmount,
            this.takingAmount
        )

        return this.feeExtension.getProtocolFee(taker, takingAmount)
    }
}
