import {FetchProviderConnector} from './fetch-provider.connector.js'
import {AuthError} from '../../errors.js'

describe('FetchProviderConnector', () => {
    const connector = new FetchProviderConnector()
    const originalFetch = globalThis.fetch

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should return json on successful get', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: jest.fn().mockResolvedValue({value: 1}),
            text: jest.fn()
        }) as typeof fetch

        const result = await connector.get<{value: number}>(
            'https://example.test',
            {
                Authorization: 'Bearer k'
            }
        )

        expect(result).toEqual({value: 1})
        expect(globalThis.fetch).toHaveBeenCalledWith('https://example.test', {
            headers: {Authorization: 'Bearer k'},
            method: 'GET'
        })
    })

    it('should throw AuthError on get 401', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 401,
            ok: false,
            json: jest.fn(),
            text: jest.fn()
        }) as typeof fetch

        await expect(
            connector.get('https://example.test', {})
        ).rejects.toBeInstanceOf(AuthError)
    })

    it('should throw on non-ok get', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 500,
            ok: false,
            json: jest.fn(),
            text: jest.fn().mockResolvedValue('boom')
        }) as typeof fetch

        await expect(connector.get('https://example.test', {})).rejects.toThrow(
            'Request failed with status 500: boom'
        )
    })

    it('should return json on successful post', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: jest.fn().mockResolvedValue({ok: true}),
            text: jest.fn()
        }) as typeof fetch

        const result = await connector.post<{ok: boolean}>(
            'https://example.test',
            {a: 1},
            {Authorization: 'Bearer k'}
        )

        expect(result).toEqual({ok: true})
        expect(globalThis.fetch).toHaveBeenCalledWith('https://example.test', {
            headers: {
                Authorization: 'Bearer k',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({a: 1})
        })
    })

    it('should throw AuthError on post 401', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 401,
            ok: false,
            json: jest.fn(),
            text: jest.fn()
        }) as typeof fetch

        await expect(
            connector.post('https://example.test', {}, {})
        ).rejects.toBeInstanceOf(AuthError)
    })

    it('should throw on non-ok post', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({
            status: 400,
            ok: false,
            json: jest.fn(),
            text: jest.fn().mockResolvedValue('bad')
        }) as typeof fetch

        await expect(
            connector.post('https://example.test', {}, {})
        ).rejects.toThrow('Request failed with status 400: bad')
    })
})
