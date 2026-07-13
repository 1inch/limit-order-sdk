import {buildIntegratorFeeFromFeeInfo} from './integrator-fee.util.js'
import {FeeTakerExt} from '../limit-order/index.js'

describe('buildIntegratorFeeFromFeeInfo', () => {
    const protocolFeeReceiver = '0x1111111111111111111111111111111111111111'
    const integratorFeeReceiver = '0x2222222222222222222222222222222222222222'

    it('returns ZERO when integrator fee fields are absent', () => {
        const fee = buildIntegratorFeeFromFeeInfo({
            protocolFeeReceiver,
            integratorFeeBps: undefined,
            integratorFeeReceiver: undefined
        })

        expect(fee).toEqual(FeeTakerExt.IntegratorFee.ZERO)
    })

    it('returns ZERO when integrator fee bps is zero', () => {
        const fee = buildIntegratorFeeFromFeeInfo({
            protocolFeeReceiver,
            integratorFeeBps: 0,
            integratorFeeReceiver
        })

        expect(fee).toEqual(FeeTakerExt.IntegratorFee.ZERO)
    })

    it('builds integrator fee from fee-info fields', () => {
        const fee = buildIntegratorFeeFromFeeInfo({
            protocolFeeReceiver,
            integratorFeeBps: 50,
            integratorFeeReceiver,
            integratorFeeSharePercent: 90
        })

        expect(fee.fee.value).toBe(50n)
        expect(fee.share.value).toBe(9000n)
        expect(fee.integrator.toString()).toBe(integratorFeeReceiver)
        expect(fee.protocol.toString()).toBe(protocolFeeReceiver)
    })

    it('uses decimal-safe share percent conversion rounded to whole percent', () => {
        const fee = buildIntegratorFeeFromFeeInfo({
            protocolFeeReceiver,
            integratorFeeBps: 7,
            integratorFeeReceiver,
            integratorFeeSharePercent: 84.45
        })

        expect(fee.share.value).toBe(8400n)
    })
})
