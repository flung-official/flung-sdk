import { defineConfig } from 'tsdown'

/** Bundles the SDK, generated client included, into one ESM file and one declaration file for npm. */
export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  clean: true,
})
