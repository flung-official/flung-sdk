# React and Vite example

A React app with `<FlungConnect>`. A small plugin in `vite.config.ts` answers `POST /connect-token` on the dev and preview servers with a connect token made from the key in `.env.local`, so the key never reaches the browser.

```bash
cp .env.example .env.local   # then set FLUNG_API_KEY
npm install
npm run dev                  # http://localhost:5173
```

Set `FLUNG_BASE_URL=https://api-preview.flung.dev` to use preview. The plugin is for trying the panel out: a deployed app makes tokens on its own server, behind its own sign-in, as the [Next.js example](../nextjs) does.

| Path | What it is |
|---|---|
| `vite.config.ts` | The token plugin, using `@flung.dev/sdk`. |
| `src/App.tsx` | The panel, with its events logged under it. |
| `src/main.tsx`, `src/styles.css`, `index.html` | The page around it. |
