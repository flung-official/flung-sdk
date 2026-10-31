# @flung.dev/sdk

The typed TypeScript client for the Flung API: schedule and publish social media posts, connect accounts, manage webhook endpoints and API keys, and verify the webhooks Flung sends. It runs anywhere with `fetch` and WebCrypto: Node 20+, Cloudflare Workers, Deno, Bun.

```ts
import { Flung } from '@flung.dev/sdk'

const flung = new Flung({ apiKey: process.env.FLUNG_API_KEY! })

const { data: accounts } = await flung.accounts.list()
const post = await flung.posts.create({
  content: 'Launching today.',
  accountIds: accounts.map((account) => account.id),
  publishAt: '2026-11-01T09:00:00.000Z',
})
```

Keep the key on a server. The SDK talks to `https://api.flung.dev`; pass `baseUrl: 'https://api-preview.flung.dev'` to test against preview.

## Behaviour

- **Errors.** A failed call throws `FlungError` with `status`, a stable `code` (`unknown_accounts`, `account_needs_reconnect`, `network_error`, ...) and `details`. Branch on `code`; messages may change.
- **Retries.** Network failures, timeouts, 408, 409, 429 and 5xx are retried twice by default with jittered backoff, honouring `Retry-After`. Set `maxRetries` and `timeoutMs` on the constructor.
- **Idempotency.** Every POST carries an `Idempotency-Key`, generated unless you pass `'idempotency-key'`, so a retry never schedules a post twice. Pass your own key, such as an order id, to make your own retries safe too.
- **Pagination.** `for await (const post of flung.paginate((page) => flung.posts.list(page), { limit: 100 }))` walks every page.

## Time zones

Flung stores every time in UTC. Give `publishAt` either as an instant with `Z` or an offset, or as the local time a person said, without an offset, and Flung converts it on the server:

```ts
// 9am in Athens on 3 November, whatever zone this code runs in.
const post = await flung.posts.create({
  content: 'Kalimera.',
  accountIds,
  publishAt: '2026-11-03T09:00',
  timeZone: 'Europe/Athens',
})
post.publishAt // '2026-11-03T07:00:00.000Z', in UTC
post.publishAtLocal // '2026-11-03T09:00:00+02:00'
post.timeZone // 'Europe/Athens'
```

Without `timeZone`, a local time is read in the zone of the person behind an OAuth token, else the workspace's default zone (as for an API key), else UTC. `flung.me.get()` says which: `timeZone`, `timeZoneSource` (`user`, `workspace` or `default`) and the time there now as `nowLocal`. A local time the clocks skip in spring moves forward by the gap, and one they pass twice in autumn takes the earlier instant; either adds an entry to `post.warnings` (`local_time_skipped`, `local_time_ambiguous`). A zone that is not an IANA name is refused with the code `invalid_time_zone`. Times with `Z` or an offset work exactly as before.

## Images and video

```ts
const photo = await flung.uploadMedia(await readFile('launch.png'), { contentType: 'image/png' })
await flung.posts.create({ content: 'Launching today.', accountIds, mediaIds: [photo.id] })
// Or let Flung fetch a file that is already online:
const clip = await flung.media.import({ url: 'https://example.com/launch.mp4' })
```

JPEG, PNG and WebP up to 20 MB, GIF 15 MB, MP4 and QuickTime 1 GB; `uploadMedia` sends anything over 100 MB in parts by itself. Flung checks the real type from the file.

| Platform | Takes |
|---|---|
| Instagram | 10 images, or a Reel up to 300 MB |
| Threads | 20 images, or a video |
| Facebook | 10 photos, or a video |
| X | 4 images up to 5 MB, or a GIF or a video up to 512 MB |
| LinkedIn | 9 images, or a video up to 200 MB |
| Mastodon | 4 images, or a video up to 40 MB |
| Discord | 10 files up to 10 MB |
| Bluesky | 4 images up to 1 MB, or a video up to 100 MB |
| Pinterest | 5 images, or a video up to 1 GB, pinned to the post's board or the account's default |
| Farcaster | 2 images, or a video up to 100 MB, embedded by a permanent link |
| YouTube, TikTok | One video |

A post a platform cannot carry is refused when it is created, not when it fails to publish.

## Connecting accounts without a UI

```ts
// A new account, or flung.accounts.reconnect({ id }) for one that needs it.
const session = await flung.accounts.connect({ platform: 'linkedin' })
console.warn(`Open ${session.authorizationUrl}`)
const done = await flung.waitForConnection(session.id)
if (done.status === 'connected') console.warn('Connected', done.accountIds)
```

Without a `redirectUrl` the person ends on Flung's own "you can close this tab" page. Pass one to bring them back into your app instead.

LinkedIn company pages connect through their own app: `flung.accounts.connect({ platform: 'linkedin', variant: 'pages' })` connects every page the person administers, one account per page. `flung.platforms.list()` gives each platform's `variants`, `['pages']` for LinkedIn once the pages app is set up.

Each account says how it stays connected: `renewal` is `automatic` (Flung refreshes it), `manual` (only a reconnect renews it) or `not_needed`, with `tokenExpiresAt` and `reconnectBy`. `flung.accounts.list({ reconnectBefore })` finds the ones a person must reconnect soon, `account.reconnect_required_soon` arrives a week ahead, and `flung.accounts.refresh({ id })` renews a token now.

## Letting people connect from your page

Your server makes a connect token, and `<flung-connect>` from [`@flung.dev/connect`](../connect/README.md) uses it in the browser. The token can only list, connect, reconnect and disconnect accounts, from the origins you name, until it expires.

```ts
const { token } = await flung.connectTokens.create({ origins: ['https://app.example.com'], expiresIn: 900 })
```

## One profile per customer

When your product's users each connect their own accounts, give each a profile, with your own user id as `externalId`. A connect token made with its `profileId` connects into it and sees only its accounts.

```ts
const profile = await flung.profiles.create({ name: 'Acme Studio', externalId: 'user_8412' })
const { token } = await flung.connectTokens.create({ origins: ['https://app.example.com'], profileId: profile.id })
const { data: accounts } = await flung.accounts.list({ profileId: profile.id })
await flung.posts.create({ content: 'Hello', accountIds: accounts.map((account) => account.id), profileId: profile.id })
```

`flung.profiles.list({ externalId })` finds a profile again. `flung.profiles.delete({ id })` disconnects its accounts and cancels its scheduled posts.

A profile (a brand, in the Flung portal) holds at most one account on each platform; a LinkedIn page counts apart from a personal profile. `flung.billing.get()` gives the limit as `limits.accountsPerPlatformPerProfile`, and how many profiles the plan allows. Connecting a second account of a platform into the same profile throws `FlungError` with the code `platform_limit_reached`, whose `details` name the platform, the profile and `upgradeUrl`. Reconnecting an account it already holds is never refused.

## Plotwork diagrams

When a workspace has connected Plotwork, its diagrams can go straight into a post: `importDiagram` has Plotwork paint the diagram as a PNG and keeps it as a media file with alt text.

```ts
const { data: diagrams } = await flung.plotwork.listDiagrams({ q: 'architecture' })
const media = await flung.plotwork.importDiagram({ id: diagrams[0].id, width: 1600, scheme: 'light' })
await flung.posts.create({ content: 'How it fits together', accountIds, mediaIds: [media.id] })
```

`flung.plotwork.get()` says whether Plotwork is connected and by whom.

## Webhooks

```ts
import { verifyWebhook } from '@flung.dev/sdk'

const event = await verifyWebhook({ body: rawBody, headers: request.headers, secret: process.env.FLUNG_WEBHOOK_SECRET! })
if (event.type === 'post.published') console.warn(event.data.post.id)
```

Pass the raw body, not a re-serialised one. During a secret rotation Flung signs with the old and the new secret for 24 hours, and `secret` also takes both while you switch. Events follow the Standard Webhooks spec, so any Standard Webhooks library verifies them too.

## Standards

Code here follows:
- [API clients](../../.standards/docs/standards/core/api-clients.md) - one client, timeouts, retrying only idempotent calls
- [Outbound webhooks](../../.standards/docs/standards/packs/node-api/webhooks-outbound.md) - the receiving side of the signing scheme
- [Error handling](../../.standards/docs/standards/core/error-handling.md) - one typed error with stable codes
- [Vitest testing](../../.standards/docs/standards/packs/vitest/testing.md) - test layout

## Contents

| Path | Purpose |
|---|---|
| `openapi-ts.config.ts` | hey-api settings: one `FlungApi` class nested by operation id, flat parameters, throw on error. Reads `../../spec/openapi.json`. |
| `src/generated/` | The generated client. Not committed; `generate` rebuilds it before every typecheck, test and build. |
| `src/client.ts` | `Flung`: the configured client, retries, idempotency keys, `paginate`, `uploadMedia`, `waitForConnection`. Kept equal to flung-app's `packages/sdk/src/client.ts`, whose contract tests run it against the API itself. |
| `src/errors.ts` | `FlungError`. |
| `src/webhooks.ts` | `verifyWebhook` and the typed `FlungWebhookEvent`. |
| `src/__tests__/` | The client against scripted answers, and webhooks signed as the jobs Worker signs them. |
| `tsdown.config.ts` | Bundles `dist/index.js` and `dist/index.d.ts` for npm. Built with TypeScript 6: hey-api needs the compiler API TypeScript 7 no longer ships. |
