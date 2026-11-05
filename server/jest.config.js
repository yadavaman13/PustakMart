// jest.config.js
export default {
    testEnvironment: 'node',
    transform: {},
    testSequencer: '<rootDir>/src/tests/testSequencer.js',
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
    testTimeout: 60000,
    testMatch: ['<rootDir>/src/tests/modules/**/*.test.js'],
    verbose: true,
    forceExit: true,
};

