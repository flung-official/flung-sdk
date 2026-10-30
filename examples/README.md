# Examples

Pages that use the packages as a reader would.

| Path | What it shows |
|---|---|
| `vanilla/` | `<flung-connect>` in a plain page, with a Node server of a few lines that keeps the API key and makes connect tokens. No install: `pnpm build`, then `FLUNG_API_KEY=flung_sk_... node examples/vanilla/server.mjs` and open http://localhost:5173. Add `FLUNG_BASE_URL=https://api-preview.flung.dev` to use preview. |
| `flungies/` | Flungies in a plain page: SVG at every size, a crowd, `<flung-ie>`, and the WebGL hero. No install: `pnpm --filter @flung.dev/flungies build`, then `node examples/flungies/server.mjs` and open http://localhost:5175. |
| `nextjs/` | A Next.js app: a server route makes the token with `@flung.dev/sdk`, and a client component shows `<FlungConnect>`. Installed from npm with its own lockfile. |
| `react-vite/` | A React app on Vite: a dev-server plugin makes the token from `.env.local`, for trying the panel out. Installed from npm with its own lockfile. |

CI builds `nextjs` and `react-vite` against the packages from the change being tested, not the ones on npm.
