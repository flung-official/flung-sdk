# @flung.official/connect

`<flung-connect>`: a panel that lets the people using your app connect and disconnect their social accounts through Flung, on your own page. A web component, a React component, and the calls underneath for a page that draws its own. No runtime dependencies.

```bash
npm install @flung.official/connect
```

## How it works

| Step | Where | What |
|---|---|---|
| 1 | Your server | Makes a connect token with your API key: `POST /v1/connect-tokens` with the page's origin. Keep the key there. |
| 2 | Your page | Hands the token to `<flung-connect>`. |
| 3 | The panel | Lists the platforms this Flung can connect and the accounts already connected. |
| 4 | The person | Presses **Connect**. The platform's consent page opens in a small window; when they approve, the window closes and the account appears. |

A connect token can only list, connect, reconnect and disconnect accounts, only from the origins it was made for, and stops working when it expires (one hour by default, at most one day). It cannot post, read the inbox or touch API keys.

## Quick start

**Your server** (any language; this is the SDK):

```ts
import { Flung } from '@flung.official/sdk'

const flung = new Flung({ apiKey: process.env.FLUNG_API_KEY! })

// Behind your own sign-in: only make tokens for people who may manage this workspace's accounts.
app.post('/connect-token', async (_request, response) => {
  const { token } = await flung.connectTokens.create({ origins: ['https://app.example.com'], expiresIn: 900 })
  response.json({ token })
})
```

**Any page**:

```html
<script type="module">
  import '@flung.official/connect/register'

  const panel = document.querySelector('flung-connect')
  // A function: the panel asks again when a token expires.
  panel.token = async () => (await (await fetch('/connect-token', { method: 'POST' })).json()).token
  panel.addEventListener('flung-connect', (event) => console.log('Connected', event.detail.accounts))
</script>

<flung-connect platforms="x,linkedin,bluesky,mastodon"></flung-connect>
```

**React**:

```tsx
import { FlungConnect } from '@flung.official/connect/react'

export function Accounts() {
  return <FlungConnect token={fetchConnectToken} platforms={['x', 'linkedin']} onConnect={({ accounts }) => console.log(accounts)} />
}
```

[`examples/vanilla`](../../examples/vanilla) runs the whole thing with a server of a few lines and nothing to install.

## Attributes and properties

| Attribute | Property | Meaning |
|---|---|---|
| `token` | `token` | A connect token. The property also takes a function that returns a fresh one, which the panel calls again when the API says the token has expired. |
| `base-url` | | The API. Production (`https://api.flung.dev`) when left out; `https://api-preview.flung.dev` for preview. |
| `platforms` | | Offer only these, comma-separated. A token made with `platforms` is narrowed to those as well. |
| `mode` | | `popup` (the default) opens a small window. `redirect` sends the whole page to the platform and back, for pages that cannot open windows; Flung returns to the same address, and the panel reports the result and tidies the address. |
| `theme` | | `light` or `dark`. Follows the page's scheme when left out. |
| | `labels` | Every word the panel shows, to put it in another language. See `DEFAULT_LABELS`. |
| | `refresh()` | Reads the accounts again. |

## Events

| Event | `detail` | When |
|---|---|---|
| `flung-load` | `{ accounts }` | The accounts were read: on first show and after each change. |
| `flung-connect` | `{ session, accounts }` | A connect or reconnect finished. Facebook stores one account per page. `session` is null after a redirect. |
| `flung-disconnect` | `{ account }` | An account was disconnected. Its past posts keep their results. |
| `flung-error` | `{ code, message }` | A call or a connect failed: `access_denied`, `wrong_account`, `forbidden`, `network_error` and so on. |

Events bubble and cross the shadow root.

## Looks

The panel draws in a shadow root. Set any of `--flung-font`, `--flung-text`, `--flung-muted`, `--flung-surface`, `--flung-raised`, `--flung-border`, `--flung-accent`, `--flung-accent-text`, `--flung-danger`, `--flung-warning` and `--flung-radius` on the element, or style its parts with `::part()`: `panel`, `list`, `platform`, `badge`, `name`, `account`, `status`, `form`, `note`, `confirm`, `message`.

```css
flung-connect { --flung-accent: #0f766e; --flung-radius: 12px; }
flung-connect::part(panel) { border: 0; }
```

## Behaviour worth knowing

- **Popups.** Browsers open a window only straight from a click, so the panel opens it first and fills it in once Flung answers. When a browser blocks it anyway, the panel shows a link to the consent page instead.
- **Waiting.** The panel waits on the connect session, not the window: some platforms' sign-in pages cut the link back to the page that opened them. Sessions last ten minutes. **Cancel** stops waiting.
- **Mastodon and Bluesky** ask first: the person's Mastodon server (required), or their Bluesky handle (optional; without it they sign in through bsky.social).
- **Reconnect** appears beside an account that needs it, or whose platform only lets Flung renew it for a limited time and that time ends within two weeks.
- **Disconnect** asks to confirm. The account then drops from the panel; it stays in the API as `disconnected`.
- **Safety.** Every name and message is set as text; nothing the API returns becomes markup. The panel sends the token to the API address only, and no cookie.

## Without the element

`@flung.official/connect/core` has the calls (`ConnectClient`) and the flows (`connectInPopup`, `readRedirectResult`) for a page that draws its own panel.

```ts
import { ConnectClient, connectInPopup } from '@flung.official/connect/core'

const client = new ConnectClient({ token })
button.onclick = async () => {
  const outcome = await connectInPopup(client, () => client.connect('linkedin'))
  if (outcome.kind === 'finished' && outcome.session.status === 'connected') render(await client.accounts())
}
```

## Contents

| Path | Purpose |
|---|---|
| `src/core/` | `ConnectClient`, the popup and redirect flows, platform names, and the API shapes it reads. No DOM needed except `window.open` in the popup flow. |
| `src/element/` | `<flung-connect>`: the element, its styles, words, events and node helpers. |
| `src/react/` | `<FlungConnect>`, the element for React. |
| `src/register.ts` | The side-effect entry that registers the element. |
| `src/__tests__/` | The client, flows, element and React component against a fake of the seven calls (`fake-api.ts`), in jsdom. |
