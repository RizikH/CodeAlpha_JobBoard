module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    maxWorkers: 1,
    testTimeout: 15000,
    globalSetup: './tests/helpers/globalSetup.js',
    globalTeardown: './tests/helpers/globalTeardown.js',
    setupFiles: ['./tests/helpers/loadEnv.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middleware/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
};
