module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'tests',
    testRegex: '.*\\.(spec|test)\\.ts$',

    globalSetup: '<rootDir>/global-setup.ts',
    globalTeardown: '<rootDir>/global-tear-down.ts',
    transform: {
        '^.+\\.(t|j)s$': '@swc/jest'
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node'
}
