# Demo

The connect panel, built from `packages/connect`, on a page with made-up accounts, for looking at it, taking screenshots and checking a change to its look. No request leaves the machine: the API is a stand-in that answers the seven connect-token calls from a fixture set.

| Command | What it does |
|---|---|
| `pnpm demo [--set <name>] [--port <n>]` | Builds the panel and serves the page at http://localhost:3190 (default set `demo`). Ctrl-C stops it; it prints its PID. |
| `pnpm demo:shot [flags]` | Screenshots in headless Chromium, every request answered through Playwright, so it takes no port. Written to `tools/demo/artifacts/shots/` (ignored) as `<name>.<viewport>.<theme>.png`. |

`demo:shot` flags:

| Flag | Default | Meaning |
|---|---|---|
| `--states` | off | Every state worth looking at, each of the whole page: the list, the Mastodon handle form, a disconnect being confirmed, a connect waiting on its window, nothing connected, three platforms, a refused token, LinkedIn with company pages: the list, the profile-or-page chooser open, and `variants="tiles"`, and Farcaster waiting on its approval in Warpcast. |
| `--set <name>` | `demo` | The fixture set, without `--states`. |
| `--themes light,dark` | both | The page's colour scheme, which the panel follows. |
| `--viewports desktop,phone` | both | Desktop is 1280 by 860 at 1x; phone 390 by 844 at 2x. |
| `--click <selector>` | none | Clicked in order once the page has settled; a Playwright selector reaches into the panel's shadow root, such as `[data-key="connect-x"]`. |
| `--name <word>` | the set | The file's name. |
| `--query <search>` | none | Added to the page's address. The page sets `variants`, `layout` and `theme` from it, such as `?variants=tiles`. |
| `--full` | off | The whole page, not only the window. |
| `--element` | off | The panel alone on a clear background, as the docs show it. |
| `--probe` | off | Reports what runs past the right edge and text wider than its box (`probe.ts`, from Plotwork's demo tool). |
| `--out <dir>` | `tools/demo/artifacts/shots` | Where the PNGs go. |

## Sets

| Set | What it holds |
|---|---|
| `demo` | Every platform but Farcaster connectable; two X accounts, LinkedIn due for a reconnect in ten days, Instagram needing one, Bluesky and Mastodon. |
| `empty` | Nothing connected. |
| `few` | X, LinkedIn and Bluesky only; X connected, LinkedIn due for a reconnect. |
| `connects` | X, LinkedIn, Bluesky and Mastodon; X and LinkedIn connected. A connect finishes on the second read of its session, about two seconds after its window opens, and the account is added (Mastodon as `@acme@<server>`). |
| `pages` | X, LinkedIn and Bluesky, with LinkedIn company pages set up (`variants: ['pages']`); a LinkedIn profile and a page connected. A pages connect finishes after two reads and adds two pages. |
| `farcaster` | X, LinkedIn and Farcaster, Farcaster approved in Warpcast (`connectFlow: 'approval'`): a connect shows Open Warpcast and the QR code of a made-up link, and stays waiting. |
| `refused` | Every call refused with `forbidden`. |

The sets are in `fixtures.ts`, typed with the panel's own `Account`, so a set cannot drift from what the panel reads. The clock is fixed at 29 October 2026 so dates read the same in every shot.

A connect stays pending unless the set has `finishConnect: { afterPolls, usernames, pages }`: the session then turns `connected` on its `afterPolls`th read of `GET /v1/connect-sessions/:id`, and the account is added, named from `usernames` with `{handle}` filled from what the person typed, or, for a LinkedIn connect with `variant: 'pages'`, one page account for each name in `pages`. The window the panel opens is left blank (`about:blank`); `demo:shot` closes it, and so do the docs' guide films, which use this handler with their own sets (flung-docs `tools/guide-film/`).

| File | Purpose |
|---|---|
| `fixtures.ts` | The sets and the fixed moment. |
| `handler.ts` | Answers a request: the page, the built panel, the API from a set. |
| `page.html` | The page the panel sits on. |
| `main.ts` | `pnpm demo`. |
| `shot.ts`, `probe.ts` | `pnpm demo:shot`. |
