module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.spec.ts'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
        '!src/infrastructure/docs/**',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
};
