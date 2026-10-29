<h3 align="center">Flung SDK</h3>

<p align="center">
  Let the people using your app connect their social accounts from your own page,<br>
  then schedule and publish to X, LinkedIn, Instagram, Bluesky and eight more from TypeScript.
</p>

<p align="center">
  <a href="https://flung.dev">Website</a> &nbsp;·&nbsp;
  <a href="https://api.flung.dev/docs">API reference</a> &nbsp;·&nbsp;
  <a href="./packages/connect/README.md">Connect panel</a> &nbsp;·&nbsp;
  <a href="./packages/sdk/README.md">API client</a> &nbsp;·&nbsp;
  <a href="./examples/README.md">Examples</a>
</p>

## TL;DR

| Question | Answer |
|---|---|
| What is it? | `<flung-connect>` (and `<FlungConnect>` for React): a panel where people connect, reconnect and disconnect their accounts. And `Flung`, the typed API client for your server. |
| Is my API key safe? | It never leaves your server. Your server makes a short-lived connect token for the page, which can only manage accounts, only from your origins. |
| What does it install? | Nothing else. No runtime dependencies; React is an optional peer. Releases are published from CI with a signed provenance statement. |
| Which platforms? | X, Instagram, Facebook, Threads, LinkedIn, TikTok, YouTube, Pinterest, Bluesky, Mastodon, Discord and Farcaster. The panel shows the ones your Flung can connect. |

## Packages

| Package | What it is |
|---|---|
| [`@flung.dev/connect`](./packages/connect/README.md) | The `<flung-connect>` web component, the React component (`/react`), and the calls and flows with no element (`/core`). |
| [`@flung.dev/sdk`](./packages/sdk/README.md) | The `/v1` API client: posts, accounts, media, webhooks, connect tokens, and `verifyWebhook`. Runs on Node 20+, Workers, Deno and Bun. |

## Quick start

```ts
// On your server
import { Flung } from '@flung.dev/sdk'

const flung = new Flung({ apiKey: process.env.FLUNG_API_KEY! })
const { token } = await flung.connectTokens.create({ origins: ['https://app.example.com'] })
```

```html
<!-- On your page -->
<script type="module">import '@flung.dev/connect/register'</script>
<flung-connect token="flung_ct_..."></flung-connect>
```

Then post to what they connected:

```ts
const { data: accounts } = await flung.accounts.list({ status: 'active' })
await flung.posts.create({ content: 'Launching today.', accountIds: accounts.map((account) => account.id) })
```

## Supply chain

Published packages have no `dependencies` (`scripts/check-no-runtime-dependencies.mjs` fails otherwise). Dev dependencies are pinned, must be a week old before they install, and run no install scripts. Packages are published only by `.github/workflows/publish.yml` with npm trusted publishing and provenance.

## Contents

| Path | Purpose |
|---|---|
| `packages/connect/` | `@flung.dev/connect`. |
| `packages/sdk/` | `@flung.dev/sdk`, generated from `spec/openapi.json`. |
| `spec/` | The API's OpenAPI document the SDK is generated from. |
| `examples/` | Pages that use the packages as a reader would. |
| `scripts/` | Repository checks and the OpenAPI sync. Not shipped. |
| `.github/workflows/` | CI and publishing. |

## Licence

MIT.
