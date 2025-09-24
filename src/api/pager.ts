import assert from 'assert'
import {isInt} from '../validations.js'

/**
 * Cursor-based pagination helper for API requests
 */
export class CursorPager {
    public readonly limit: number

    public readonly cursor?: string

    constructor({limit = 100, cursor}: {limit?: number; cursor?: string} = {}) {
        assert(isInt(limit) && limit > 0, 'Invalid limit')
        assert(
            cursor === undefined || typeof cursor === 'string',
            'Invalid cursor'
        )

        this.limit = limit
        this.cursor = cursor
    }
}