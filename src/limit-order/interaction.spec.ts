import {Interaction} from './interaction.js'
import {Address} from '../address.js'

describe('Interaction', () => {
    it('should encode/decode', () => {
        const interaction = new Interaction(
            Address.fromBigInt(1337n),
            '0xdeadbeef'
        )

        expect(Interaction.decode(interaction.encode())).toStrictEqual(
            interaction
        )
    })
})
