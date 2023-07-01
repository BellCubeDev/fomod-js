import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    displayName: 'fomod',
    verbose: true,
    injectGlobals: true,
};

export default config;