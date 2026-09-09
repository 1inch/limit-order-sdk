module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'tests',
    testRegex: '.*\\.(spec|test)\\.ts$',

    globalSetup: '<rootDir>/global-setup.ts',
    globalTeardown: '<rootDir>/global-tear-down.ts',
    transform: {
        '^.+\\.(t|j)s$': '@swc/jest'
    },
    collectCoverageFrom: [
        '**/*.(t|j)s',
        '!**/*.spec.ts',
        '!**/*.test.ts',
        '!**/index.ts'
    ],
    testTimeout: 20_000,
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '(.+)\\.js': '$1'
    }
}
