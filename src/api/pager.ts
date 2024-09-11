import assert from 'assert'
import {isInt} from '../validations.js'

export class Pager {
    public readonly limit: number

    public readonly page: number

    constructor({limit, page} = {page: 1, limit: 100}) {
        assert(isInt(limit) && limit > 0, 'Invalid limit')
        assert(isInt(page) && page > 0, 'Invalid page')

        this.limit = limit
        this.page = page
    }
}
