# @flung.dev/connect

`<flung-connect>`: a panel that lets the people using your app connect and disconnect their social accounts through Flung, on your own page. A web component, a React component, and the calls underneath for a page that draws its own. No runtime dependencies.

```bash
npm install @flung.dev/connect
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
import { Flung } from '@flung.dev/sdk'

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
  import '@flung.dev/connect/register'

  const panel = document.querySelector('flung-connect')
  // A function: the panel asks again when a token expires.
  panel.token = async () => (await (await fetch('/connect-token', { method: 'POST' })).json()).token
  panel.addEventListener('flung-connect', (event) => showConnected(event.detail.accounts))
</script>

<flung-connect platforms="x,linkedin,bluesky,mastodon"></flung-connect>
```

**React**:

```tsx
import { FlungConnect } from '@flung.dev/connect/react'

export function Accounts() {
  return <FlungConnect token={fetchConnectToken} platforms={['x', 'linkedin']} onConnect={({ accounts }) => showConnected(accounts)} />
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
| `layout` | | `list` (the default), `grid` or `compact`. See [Make it yours](#make-it-yours). |
| `variants` | | How LinkedIn offers company pages, when your Flung has them set up: `choose` (the default) asks after **Connect**; `tiles` shows **LinkedIn** and **LinkedIn Page** as two platforms. See [LinkedIn company pages](#linkedin-company-pages). |
| `unstyled` | | Drops Flung's stylesheet, so every part is yours to style. |
| `branding` | | `none` hides the small "Secured by Flung" line under the list. |
| | `labels` | Every word the panel shows, to put it in another language. See `DEFAULT_LABELS`. |
| | `state` | The panel's current state (`ConnectState`), read only. |
| | `controller` | The headless controller behind the panel (`ConnectController`), for rows a page draws itself. A new token makes a new one. |
| | `connect(platform, options)` | Starts a connect as the platform's button does; `{ variant: 'pages' }` connects LinkedIn company pages without asking, `{ variant: null }` the person's profile. Call it from a click. |
| | `refresh()` | Reads the accounts again. |

## Events

| Event | `detail` | When |
|---|---|---|
| `flung-load` | `{ accounts }` | The accounts were read: on first show and after each change. |
| `flung-connect` | `{ session, accounts }` | A connect or reconnect finished. Facebook stores one account per page. `session` is null after a redirect. |
| `flung-disconnect` | `{ account }` | An account was disconnected. Its past posts keep their results. |
| `flung-error` | `{ code, message }` | A call or a connect failed: `access_denied`, `wrong_account`, `forbidden`, `network_error` and so on. |
| `flung-change` | `{ state }` | Anything the panel shows changed. Does not bubble. |

The first four bubble and cross the shadow root.

## LinkedIn company pages

LinkedIn connects a person's own profile and the company pages they administer through two separate apps. When your Flung has the pages app set up, `GET /v1/platforms` lists `variants: ["pages"]` for LinkedIn and the panel offers both. A person does not need to connect their profile first.

| `variants` | What the person sees |
|---|---|
| `choose` (the default) | One LinkedIn row. **Connect** opens a small question under it: **Personal profile** (post as yourself) or **Company page** (post as a page you admin). Arrow keys move between the two, Escape or **Cancel** closes it, and focus goes back to **Connect**. |
| `tiles` | Two rows, **LinkedIn** and **LinkedIn Page**, each with its own Connect and its own accounts. |

A pages connect stores one account per page the person administers. Each shows under LinkedIn with the page's name and a small **Page** tag (`AccountItem.page` is true). Without the pages app, LinkedIn works as before; with only the pages app, the LinkedIn row connects pages straight away and is named **LinkedIn Page**.

```html
<flung-connect variants="tiles"></flung-connect>
<button id="pages">Connect your company page</button>
<script type="module">
  // From your own button: a click opens the sign-in window.
  document.getElementById('pages').onclick = () => document.querySelector('flung-connect').connect('linkedin', { variant: 'pages' })
</script>
```

In React, `<FlungConnect variants="tiles" />`; with the hook or the controller, `connect('linkedin', { variant: 'pages' })`. The chooser's words are labels like the rest: `chooseVariant`, `variantPersonal`, `variantPersonalDescription`, `variantPages`, `variantPagesDescription`, `pagesName` and `pageTag`.

## Make it yours

Six levels of control, from least to most. Each keeps the same behaviour: the popup and its blocked-window link, the Mastodon and Bluesky questions, the wait with Cancel, the confirm before a disconnect, redirects and errors.

### 1. Custom properties

Set any of these on the element. Each has a default for light and dark.

| Property | Default | What |
|---|---|---|
| `--flung-font` | `system-ui, ...` | The typeface. |
| `--flung-font-size` | `15px` | Body text; most other sizes are worked out from it. |
| `--flung-font-size-small` | `13px` | Counts, handles, labels and the footer. |
| `--flung-line-height` | `1.45` | Body line height. |
| `--flung-font-weight-medium` | `500` | Buttons and account names. |
| `--flung-font-weight-strong` | `600` | Platform names and initials. |
| `--flung-text` | `#18181b` | Text. |
| `--flung-muted` | `#71717a` | Secondary text. |
| `--flung-surface` | `#ffffff` | The panel's background. |
| `--flung-raised` | `#f4f4f5` | Questions, the message line, button hover. |
| `--flung-border` | `#e4e4e7` | Every border. |
| `--flung-accent` | `#18181b` | Primary buttons. |
| `--flung-accent-text` | `#ffffff` | Text on primary buttons. |
| `--flung-danger` | `#dc2626` | Errors, Disconnect on hover, the confirm button. |
| `--flung-warning` | `#b45309` | The reconnect status. |
| `--flung-success` | `#15803d` | The connected dot. |
| `--flung-radius` | `12px` | The panel's corners. |
| `--flung-radius-inner` | radius less 4px | Tiles, cards, questions and fields. |
| `--flung-button-radius` | `--flung-radius-inner` | Buttons. |
| `--flung-border-width` | `1px` | Every border. `0` for none. |
| `--flung-shadow` | `none` | The panel's shadow. |
| `--flung-card-shadow` | `none` | Each card in the `grid` layout. |
| `--flung-padding` | `16px` | Space at the panel's edges. |
| `--flung-gap` | `12px` | Space between pieces and rows. |
| `--flung-badge-size` | `40px` | The platform tile. |
| `--flung-mark-size` | `20px` | The platform mark inside it. |
| `--flung-mark-strength` | `100%` | How much of each platform's brand colour its mark keeps. |
| `--flung-tint-strength` | `8%` | How much of it the tile and the initial circle take. |
| `--flung-avatar-size` | `32px` | Account pictures. |
| `--flung-button-height` | `36px` | Every button and the handle field. |
| `--flung-button-padding` | `0 14px` | Inside buttons. |
| `--flung-focus-color` | `--flung-accent` | The focus ring. |
| `--flung-focus-width` | `2px` | Its width. |
| `--flung-focus-offset` | `2px` | Its gap from the control. |
| `--flung-grid-min` | `16rem` | The narrowest card in the `grid` layout. |

```css
flung-connect {
  --flung-font: "Inter", sans-serif;
  --flung-accent: #0f766e;
  --flung-radius: 6px;
  --flung-shadow: 0 1px 2px rgb(0 0 0 / .06);
}
```

### 2. Parts

Every piece the panel draws has a `part` name for `::part()`. Pieces with a kind carry a second name, so a page can style all of them or one kind.

| Part | What |
|---|---|
| `panel` | The whole panel. Has `data-layout`. |
| `list` | The list of platforms. |
| `platform`, `platform-<id>` | One platform, such as `platform-linkedin`. |
| `row` | Its tile, name and Connect button. |
| `badge`, `mark` | The tile and the mark inside it. |
| `title`, `name`, `count`, `count-connected` | The name and the line under it. |
| `accounts`, `account` | The platform's accounts, and one of them. |
| `avatar`, `avatar-image`, `avatar-initial` | The account's picture, or the circle with its initial when there is none or it does not load. |
| `account-details`, `account-names`, `account-name`, `account-username` | The display name and the `@handle` under it. |
| `status` | Needs reconnecting, or the date to reconnect by. |
| `actions` | The account's buttons. |
| `button` | Every button. Also `button-primary`, `button-secondary`, `button-quiet` or `button-danger`, and one of `button-connect`, `button-reconnect`, `button-disconnect`, `button-continue`, `button-cancel`, `button-confirm`, `button-keep`, `button-option`. |
| `platform-linkedin-pages` | With `variants="tiles"`, the LinkedIn Page row, besides `platform` and `platform-linkedin`. Its slot is `platform-linkedin-pages`. |
| `choose`, `choose-title`, `choose-options` | The question between a LinkedIn profile and a company page. |
| `button-option`, `button-option-personal`, `button-option-pages` | Its two choices. Each holds `option-icon` (with `option-mark`), `option-text`, `option-name` and `option-description`. |
| `tag`, `tag-page` | The **Page** tag beside a company page. |
| `form`, `label`, `input` | The Mastodon server or Bluesky handle question. |
| `note`, `spinner`, `note-text`, `link` | The wait, and the sign-in link when the browser blocked the window. |
| `confirm`, `confirm-text` | The question before a disconnect. |
| `message`, `message-error` | The status line under the list. It has `hidden` when empty. |
| `footer`, `footer-link`, `footer-mark` | "Secured by Flung". |

```css
flung-connect::part(panel) { border: 0; }
flung-connect::part(button-primary) { border-radius: 999px; }
flung-connect::part(platform-x) { background: #fafafa; }
```

### 3. Layouts

`layout="list"` (the default) puts platforms one under another, `grid` makes them cards side by side, and `compact` tightens every size for a sidebar.

```html
<flung-connect layout="grid" style="--flung-grid-min: 14rem"></flung-connect>
```

### 4. Unstyled

`unstyled` drops Flung's stylesheet. The element stays a block and keeps its `part` names, so the whole look is your CSS. Marks and avatars carry `width` and `height` attributes so they stay small until you size them.

```css
flung-connect::part(list) { display: flex; flex-direction: column; gap: 1rem; }
flung-connect::part(platform) { padding: 1rem; border: 1px solid var(--your-border); }
flung-connect::part(button) { font: inherit; }
```

### 5. Render props

`<FlungConnect>` takes `renderPlatform` and `renderAccount`, to draw a platform's row (mark, name and Connect) or an account's row with your own components. They render in your page's DOM, through the element's named slots (`platform-<id>`, `account-<id>`), so your own CSS reaches them; the panel keeps the questions, the wait, the confirm and the messages around them.

```tsx
<FlungConnect
  token={fetchConnectToken}
  renderAccount={({ account, actions, labels }) => (
    <UserChip name={account.displayName} picture={account.avatarUrl} handle={account.username}>
      <Button variant="ghost" onClick={() => actions.requestDisconnect(account.account.id)}>{labels.disconnect}</Button>
    </UserChip>
  )}
/>
```

Without React, put an element with `slot="account-<id>"` inside `<flung-connect>` and call `panel.controller` from it; `flung-change` says when to draw again.

### 6. Headless: `useFlungConnect` and `createConnectController`

`useFlungConnect` (from `@flung.dev/connect/react`) gives the state and the actions and draws nothing: every element and class is yours. Call `connect`, `submitHandle` and `reconnect` straight from a click or submit handler, since a browser opens a window only during one.

```tsx
import { useFlungConnect } from '@flung.dev/connect/react'

export function Accounts() {
  const panel = useFlungConnect({ token: fetchConnectToken, platforms: ['x', 'linkedin', 'mastodon'] })
  return (
    <ul className="accounts">
      {panel.platforms.map((item) => (
        <li key={item.platform}>
          <h3>{item.name}</h3>
          {item.accounts.map((account) => <p key={account.account.id}>{account.displayName}</p>)}
          {item.step.kind === 'handle' && (
            <form onSubmit={(event) => { event.preventDefault(); panel.submitHandle(item.platform, new FormData(event.currentTarget).get('handle') as string) }}>
              <input name="handle" required={item.step.required} />
            </form>
          )}
          {item.step.kind === 'waiting' && item.step.blockedUrl !== null && <a href={item.step.blockedUrl} target="_blank" rel="noopener">Open sign-in</a>}
          {item.step.kind === 'confirm' && <button onClick={() => panel.confirmDisconnect(item.platform)}>Yes, disconnect</button>}
          <button disabled={item.busy} onClick={() => panel.connect(item.platform)}>Connect</button>
        </li>
      ))}
      <p role="status">{panel.message.text}</p>
    </ul>
  )
}
```

`createConnectController` (from `@flung.dev/connect/core`) is the same with no framework: `getState()` and `subscribe()` fit `useSyncExternalStore`, Svelte stores, Vue's `shallowRef` and plain DOM alike. `<flung-connect>` and `useFlungConnect` are both drawn from it.

```ts
import { createConnectController } from '@flung.dev/connect/core'

const panel = createConnectController({ token: fetchConnectToken, onConnect: ({ accounts }) => showConnected(accounts) })
panel.subscribe(() => draw(panel.getState()))
// later: panel.destroy()
```

| Member | What |
|---|---|
| `getState()` | The current `ConnectState`, frozen; the same object until something changes. |
| `subscribe(listener)` | Calls `listener` after every change; returns the function that stops it. |
| `connect(platform, { variant })` | Starts a connect, or sets the step to `handle` for Mastodon and Bluesky, or to `choose` when LinkedIn offers pages and `variant` is left out. `variant: 'pages'` or `null` (the profile) connects without asking. |
| `submitHandle(platform, handle)` | Answers the `handle` step and starts the connect. |
| `reconnect(accountId)` | Reconnects an account. |
| `requestDisconnect(accountId)` | Sets the step to `confirm`. Nothing is sent. |
| `confirmDisconnect(platform)` | Disconnects the account the `confirm` step asks about. |
| `cancel(platform)` | Stops waiting, or closes the question. |
| `dismissNotice()` | Clears the last notice. |
| `refresh()` | Reads everything again. |
| `configure({ platforms, mode, labels })` | Changes those options while shown. |
| `destroy()` | Stops every wait and listener. |

`ConnectState` has `hasToken`, `loading`, `loaded`, `platforms` (each with `name`, `accounts`, `step`, `busy`, `handlePrompt`, `connectable` and `variants`), `accounts`, `notice` (the last thing that happened, as data), `message` (that notice, or the loading, empty or no-token line, in the labels' words) and `labels`. Each account item has `displayName`, `username` (the handle when it differs), `avatarUrl` (only ever `https`), `initial`, `page` (a LinkedIn company page) and `reconnect`. A step is `idle`, `handle` (with `required`), `choose` (with `variants`), `waiting` (with `blockedUrl` and `variant`) or `confirm` (with `account`).

## Behaviour worth knowing

- **Popups.** Browsers open a window only straight from a click, so the panel opens it first and fills it in once Flung answers. When a browser blocks it anyway, the panel shows a link to the consent page instead.
- **Waiting.** The panel waits on the connect session, not the window: some platforms' sign-in pages cut the link back to the page that opened them. Sessions last ten minutes. **Cancel** stops waiting.
- **Mastodon and Bluesky** ask first: the person's Mastodon server (required), or their Bluesky handle (optional; without it they sign in through bsky.social).
- **LinkedIn** asks whether to connect a personal profile or a company page when your Flung offers pages. A reconnect of a page goes through the pages app by itself.
- **Reconnect** appears beside an account that needs it, or whose platform only lets Flung renew it for a limited time and that time ends within two weeks.
- **Disconnect** asks to confirm. The account then drops from the panel; it stays in the API as `disconnected`.
- **Accounts** show their picture, display name and `@handle`. A picture is loaded only from an `https` address, sends no referrer, and falls back to the account's initial when it is missing or does not load.
- **Safety.** Every name and message is set as text; nothing the API returns becomes markup. A sign-in link is only ever an `http` or `https` address. The panel sends the token to the API address only, and no cookie. The headless controller and hook keep the same rules; what your own markup does with the state is yours.

## Without the element

`@flung.dev/connect/core` has the headless controller (above), and underneath it the calls (`ConnectClient`) and the flows (`connectInPopup`, `readRedirectResult`).

```ts
import { ConnectClient, connectInPopup } from '@flung.dev/connect/core'

const client = new ConnectClient({ token })
button.onclick = async () => {
  const outcome = await connectInPopup(client, () => client.connect('linkedin'))
  if (outcome.kind === 'finished' && outcome.session.status === 'connected') render(await client.accounts())
}
```

## Contents

| Path | Purpose |
|---|---|
| `src/core/` | `createConnectController` (the panel's behaviour with no markup), `ConnectClient`, the popup and redirect flows, the panel's words, platform names, and the API shapes it reads. No DOM needed except `window.open` in the popup flow. |
| `src/element/` | `<flung-connect>`: the element drawn from the controller, its styles, events and node helpers. `marks.ts` is the platforms' marks (Simple Icons; Boxicons for LinkedIn), the profile-or-page choice's icons (Boxicons) and Flung's, written by `pnpm sync:icons`. |
| `src/react/` | `<FlungConnect>`, the element for React, and `useFlungConnect`, the headless hook. |
| `src/register.ts` | The side-effect entry that registers the element. |
| `src/__tests__/` | The client, flows, controller, element and React component and hook against a fake of the seven calls (`fake-api.ts`), in jsdom. |
