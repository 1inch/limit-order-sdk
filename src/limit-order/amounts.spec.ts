import {calcMakingAmount, calcTakingAmount} from './amounts.js'

describe('amounts', () => {
    it('should calculate taking amount with ceiling', () => {
        expect(calcTakingAmount(50n, 100n, 200n)).toEqual(100n)
        expect(calcTakingAmount(1n, 3n, 2n)).toEqual(1n)
        expect(calcTakingAmount(100n, 100n, 142n)).toEqual(142n)
    })

    it('should calculate making amount with floor', () => {
        expect(calcMakingAmount(200n, 100n, 200n)).toEqual(100n)
        expect(calcMakingAmount(1n, 3n, 2n)).toEqual(1n)
        expect(calcMakingAmount(142n, 100n, 142n)).toEqual(100n)
    })
})
