import axios, {AxiosError} from 'axios'
import {AxiosProviderConnector} from './axios-provider.connector.js'
import {AuthError} from '../../errors.js'

describe('Axios Http provider connector', () => {
    let httpConnector: AxiosProviderConnector

    beforeEach(() => {
        httpConnector = new AxiosProviderConnector()
    })

    it('should make get() request', async () => {
        const url = 'https://123.com/test/?val=1'
        const returnedValue = {
            data: {a: 1}
        }
        jest.spyOn(axios, 'get').mockImplementationOnce(() =>
            Promise.resolve(returnedValue)
        )
        const res = await httpConnector.get(url, {
            Authorization: 'Bearer test-key'
        })
        expect(res).toStrictEqual(returnedValue.data)
        expect(axios.get).toHaveBeenCalledWith(url, {
            headers: {Authorization: 'Bearer test-key'}
        })
    })

    it('should make post() request', async () => {
        const url = 'https://123.com/test/?val=1'
        const body = {info: 123}
        const returnedValue = {
            data: {a: 1}
        }
        jest.spyOn(axios, 'post').mockImplementationOnce(() =>
            Promise.resolve(returnedValue)
        )
        const res = await httpConnector.post(url, body, {
            Authorization: 'Bearer test-key'
        })
        expect(res).toStrictEqual(returnedValue.data)
        expect(axios.post).toHaveBeenCalledWith(url, body, {
            headers: {Authorization: 'Bearer test-key'}
        })
    })

    it('should map get 401 to AuthError', async () => {
        const error = new AxiosError('unauth')
        error.response = {status: 401} as AxiosError['response']
        jest.spyOn(axios, 'get').mockRejectedValueOnce(error)

        await expect(
            httpConnector.get('https://123.com', {})
        ).rejects.toBeInstanceOf(AuthError)
    })

    it('should rethrow non-401 get errors', async () => {
        const error = new Error('network')
        jest.spyOn(axios, 'get').mockRejectedValueOnce(error)

        await expect(httpConnector.get('https://123.com', {})).rejects.toThrow(
            'network'
        )
    })

    it('should map post 401 to AuthError', async () => {
        const error = new AxiosError('unauth')
        error.response = {status: 401} as AxiosError['response']
        jest.spyOn(axios, 'post').mockRejectedValueOnce(error)

        await expect(
            httpConnector.post('https://123.com', {}, {})
        ).rejects.toBeInstanceOf(AuthError)
    })

    it('should rethrow non-401 post errors', async () => {
        const error = new AxiosError('server')
        error.response = {status: 500} as AxiosError['response']
        jest.spyOn(axios, 'post').mockRejectedValueOnce(error)

        await expect(
            httpConnector.post('https://123.com', {}, {})
        ).rejects.toBe(error)
    })
})
