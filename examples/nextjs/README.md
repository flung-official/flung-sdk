# Next.js example

A Next.js app with the connect panel. The server route `app/api/connect-token/route.ts` keeps the API key and makes a connect token for the page; `app/accounts.tsx` shows `<FlungConnect>`, which asks that route for a token and again when one expires.

```bash
cp .env.example .env.local   # then set FLUNG_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Set `FLUNG_BASE_URL=https://api-preview.flung.dev` to use preview. Deployed elsewhere, set `APP_ORIGIN` to the address the app is served from, or the API refuses the panel's calls.

| Path | What it is |
|---|---|
| `app/api/connect-token/route.ts` | Makes the token with `@flung.dev/sdk`. Put your own sign-in check here. |
| `app/accounts.tsx` | The panel, a client component, with its events logged under it. |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | The page around it. |
