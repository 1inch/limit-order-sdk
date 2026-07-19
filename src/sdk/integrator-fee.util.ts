import {Address} from '../address.js'
import {Bps} from '../bps.js'
import {FeeInfoDTO} from '../api/types.js'
import {FeeTakerExt} from '../limit-order/index.js'

export function buildIntegratorFeeFromFeeInfo(
    feeParams: Pick<
        FeeInfoDTO,
        | 'integratorFeeBps'
        | 'integratorFeeReceiver'
        | 'integratorFeeSharePercent'
        | 'protocolFeeReceiver'
    >
): FeeTakerExt.IntegratorFee {
    const {integratorFeeBps, integratorFeeReceiver, integratorFeeSharePercent} =
        feeParams

    if (
        integratorFeeBps === undefined ||
        integratorFeeBps <= 0 ||
        !integratorFeeReceiver ||
        integratorFeeSharePercent === undefined
    ) {
        return FeeTakerExt.IntegratorFee.ZERO
    }

    return new FeeTakerExt.IntegratorFee(
        new Address(integratorFeeReceiver),
        new Address(feeParams.protocolFeeReceiver),
        new Bps(BigInt(integratorFeeBps)),
        Bps.fromSharePercent(integratorFeeSharePercent)
    )
}
