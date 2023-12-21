import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    displayName: 'fomod',
    verbose: true,
    injectGlobals: true,
    setupFilesAfterEnv: ["jest-extended/all"]
};

export default config;
