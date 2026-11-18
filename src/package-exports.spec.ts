import {readFileSync, existsSync} from 'fs'
import {join} from 'path'
import * as FeeTakerSubpath from './fee-taker-ext.js'
import {FeeTakerExt} from './index.js'

type ConditionalExports = Record<string, string>

const root = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    exports: Record<string, ConditionalExports>
}

// Maps a build target from package.json `exports` back to the source file it is built from:
// dist/esm/x.js and dist/cjs/x.js come from src/x.ts, dist/types/src/x.d.ts is emitted for it.
function sourceOf(target: string): string {
    const relative = target
        .replace(/^\.\/dist\/(esm|cjs)\//, 'src/')
        .replace(/^\.\/dist\/types\//, '')
        .replace(/\.d\.ts$|\.js$/, '.ts')

    return join(root, relative)
}

describe('package.json exports', () => {
    const targets = Object.entries(pkg.exports).flatMap(
        ([subpath, conditions]) =>
            Object.entries(conditions).map(
                ([condition, target]) => [subpath, condition, target] as const
            )
    )

    it.each(targets)(
        '%s (%s) points at a file built from the sources: %s',
        (_subpath, _condition, target) => {
            expect(existsSync(sourceOf(target))).toBe(true)
        }
    )

    it('exposes the fee taker extension under ./extensions/fee-taker', () => {
        expect(FeeTakerSubpath.FeeTakerExtension).toBe(
            FeeTakerExt.FeeTakerExtension
        )
    })
})
