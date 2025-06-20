import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  format: ['esm'],
  dts: {
    resolve: true,
  },
})
