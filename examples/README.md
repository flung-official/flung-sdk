# Examples

Pages that use the packages as a reader would.

| Path | What it shows |
|---|---|
| `vanilla/` | `<flung-connect>` in a plain page, with a Node server of a few lines that keeps the API key and makes connect tokens. No install: `pnpm build`, then `FLUNG_API_KEY=flung_sk_... node examples/vanilla/server.mjs` and open http://localhost:5173. Add `FLUNG_BASE_URL=https://api-preview.flung.dev` to use preview. |
