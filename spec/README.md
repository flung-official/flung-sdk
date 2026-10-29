# Spec

The contract the packages are built against.

| Path | What it is |
|---|---|
| `openapi.json` | The Flung API's OpenAPI 3.1 document, as flung-app writes it from its routes (`packages/sdk/openapi.json` there). `@flung.dev/sdk` is generated from it. Refresh it with `pnpm sync:openapi <path>`, or with no path to read `https://api.flung.dev/openapi.json`. Never edit it by hand. |

`@flung.dev/connect` reads only `PlatformInfo`, `Account` and `ConnectSession` from it, written out in `packages/connect/src/core/types.ts`. Change both when those change.
