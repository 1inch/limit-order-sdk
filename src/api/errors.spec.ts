import {AuthError} from './errors.js'

describe('AuthError', () => {
    it('should mention the developer portal', () => {
        const error = new AuthError()

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toMatch(/portal\.1inch\.dev/)
    })
})
