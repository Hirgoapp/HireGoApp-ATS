import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    roots: ['<rootDir>/src', '<rootDir>/test'],
    setupFilesAfterEnv: ['<rootDir>/test/setup/jest-setup.ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/modules/applications/**/*.ts',
        'src/modules/interviews/**/*.ts',
        '!src/**/*.module.ts',
        '!src/**/entities/*.ts',
        '!src/**/dto/*.ts',
    ],
    coverageDirectory: 'coverage',
};

export default config;
