import {FeeCalculator} from './fee-calculator'
import {IntegratorFee} from './integrator-fee'
import {WhitelistHalfAddress} from './whitelist-half-address'
import {Fees} from './fees'
import {Address} from '../../../address'
import {Bps} from '../../../bps'

describe('FeeCalculator', () => {
    it('should calculate protocol fee amount', () => {
        // https://etherscan.io/tx/0x8f95dc0e6e836ca0abdad88e20cf61b0caf7c5463d67b577740f3084d428e56e

        const calculator = new FeeCalculator(
            Fees.integratorFee(
                new IntegratorFee(
                    new Address('0x8e097e5e0493de033270a01b324caf31f464dc67'),
                    new Address('0x90cbe4bdd538d6e9b379bff5fe72c3d67a521de5'),
                    new Bps(10n),
                    new Bps(6000n)
                )
            ),
            WhitelistHalfAddress.new([Address.fromBigInt(1n)])
        )

        const protocolFee = calculator.getProtocolFee(
            Address.ZERO_ADDRESS,
            18442227n
        )

        expect(protocolFee).toBe(7377n)
    })
})
