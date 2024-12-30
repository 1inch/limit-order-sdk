import {FeeTakerExtension} from './fee-taker.extension'
import {LimitOrder} from '../../limit-order'
import {LimitOrderV4Struct, OrderInfoData} from '../../types'
import {MakerTraits} from '../../maker-traits'
import {Extension} from '../extension'
import {Address} from '../../../address'

export class LimitOrderWithFee extends LimitOrder {
    constructor(
        /**
         * Use `FeeTakerExtension.recipients.tokensRecipient` to set custom receiver
         */
        orderInfo: Omit<OrderInfoData, 'receiver'>,
        makerTraits = new MakerTraits(0n),
        public readonly feeExtension: FeeTakerExtension
    ) {
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

    public getTakingAmount(taker: Address): bigint {
        return this.feeExtension.getTakingAmount(taker, this.takingAmount)
    }
}
