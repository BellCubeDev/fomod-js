import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
        exclude:[
          ...configDefaults.exclude,
          'testUtils.ts'
        ],
        passWithNoTests: false,
    },
});
