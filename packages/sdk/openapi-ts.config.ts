import { defineConfig } from '@hey-api/openapi-ts'

/**
 * Generates `src/generated` from `openapi.json`, which `pnpm sync:openapi` copies from the API.
 * Operation ids like `posts.create` nest into `flung.posts.create()` on one `FlungApi` class.
 */
export default defineConfig({
  input: '../../spec/openapi.json',
  output: { path: './src/generated', clean: true },
  plugins: [
    { name: '@hey-api/client-fetch', throwOnError: true },
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'single', containerName: 'FlungApi', nesting: 'operationId' },
      responseStyle: 'data',
      paramsStructure: 'flat',
    },
  ],
})
