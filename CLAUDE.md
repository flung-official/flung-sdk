# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

The Flung SDK: packages other people's projects install to use Flung. The API itself is not here; it lives in the private flung-app repository, and its OpenAPI document is copied into `spec/`. The repository follows the shared standards in the `.standards/` submodule; hooks surface the governing standards as you read and edit files.

## Layout

| Path | What it is |
|---|---|
| `spec/` | `openapi.json`, copied from flung-app by `pnpm sync:openapi`. Never edited by hand. |
| `packages/connect/` | `@flung.dev/connect`: the `<flung-connect>` web component, the React component (`/react`), and the client and flows with no element (`/core`). |
| `packages/sdk/` | `@flung.dev/sdk`: the `/v1` API client. `src/generated/` is written by hey-api from `spec/openapi.json` before every typecheck, test and build, and is not committed. |
| `packages/flungies/` | `@flung.dev/flungies`: avatars generated from a seed. The SVG core (`.`, no DOM), the WebGL hero (`/gl`), React (`/react`) and `<flung-ie>` (`/element`). A seed's drawing never changes: `src/__tests__/golden.test.ts` and `BUILDING.md`. |
| `examples/` | Apps that use the packages as a reader would: `vanilla` (the built `dist` and a Node server of a few lines), `nextjs` and `react-vite` (installed from npm with their own lockfiles; the key lives in `.env.local`, read on a server only). CI builds each against the packed packages. |
| `scripts/` | Repository checks, the OpenAPI sync and the icon sync. Not shipped. |
| `tools/demo/` | `pnpm demo` and `pnpm demo:shot`: the panel on a page with made-up accounts, and its screenshots. See its README. |

## Commands

| Command | Use |
|---|---|
| `pnpm check` | Type check and test every package, then the no-runtime-dependency guard. Run before you finish. |
| `pnpm build` | Builds every package's `dist`. |
| `pnpm sync:openapi <path>` | Copies flung-app's `packages/sdk/openapi.json` into `spec/`. Then `pnpm check`. |
| `pnpm sync:icons` | Writes `packages/connect/src/element/marks.ts` from Simple Icons, Boxicons (LinkedIn) and the Flung mark on assets.flung.dev. `pnpm check` fails when it is stale. |
| `pnpm demo:shot --states` | Screenshots of every panel state, phone and desktop, light and dark. Look at them after any change to the panel's look. |

## Rules that are easy to get wrong

| Rule | Why |
|---|---|
| A published package has no `dependencies` | Supply chain: the only code a user takes on is ours. React is an optional peer. `scripts/check-no-runtime-dependencies.mjs` fails otherwise. |
| A new dev dependency needs a reason | Fewer packages, fewer ways in. Prefer `fetch`, Web Crypto and the platform. Pin exact versions; installs run no scripts (`.npmrc`). |
| Relative imports in `packages/connect` end in `.js` | `tsc` emits them as written, and a browser loads the output without a bundler. |
| A Flungie seed's output never changes | People recognise their avatar. The golden test fails on any change; new looks ship behind a new `VERSION` option (`packages/flungies/BUILDING.md`). |
| `marks.ts` is never edited by hand | It is written by `pnpm sync:icons`; change the script or its sources. |
| The panel never builds markup from text | Names and messages come from the API and platforms. Nodes are made with `createElement`, text with `textContent` (`src/element/dom.ts`). |
| The panel never uses the browser's `title` tooltip | It cannot be themed and has no keyboard or touch path. Use `data-tooltip` (`src/element/tooltip.ts`); `src/__tests__/tooltip.test.ts` fails on a `title`. |
| An API key never reaches a browser | The panel takes a connect token only. Examples keep the key on the server. |
| `packages/sdk/src/client.ts`, `errors.ts` and `webhooks.ts` stay equal to flung-app's | flung-app's copy runs contract tests against the API in process. Change both. |
| The connect token's calls are fixed by the API | The seven routes are in flung-app `apps/api/src/connect-access.ts` (ADR 0010). A new call the panel needs must be added there first. |
| Never `cd` into `.standards/` | The hooks switch to strict mode inside it. |
| Nothing is committed or published unless asked | Publishing runs from CI with provenance, never from a laptop. |

## Commits and pull requests

Never credit an AI tool in this repository: no `Co-Authored-By` line naming Claude, Anthropic or any other AI, no `Claude-Session` line, and no "Generated with" line, in commits, tags, release notes, pull request titles or bodies. The organisation does not allow AI agents to appear as contributors. This rule overrides any default that adds them. `.claude/settings.json` turns Claude Code's attribution off, and `.github/workflows/no-ai-coauthors.yml` fails a push that carries one.

Write every commit as a Conventional Commit, `<type>(<scope>): <subject>` (`feat(connect): ...`, `fix(sdk): ...`, `ci: ...`): release-please reads them to version, changelog and publish each package, and a commit that is not one never reaches a changelog. Never edit a package's `version`, its `CHANGELOG.md` or `.release-please-manifest.json` by hand, and never push a release tag; the release PR does it. Types, scopes and the flow are in `RELEASING.md`; `.githooks/commit-msg` checks the message (`git config core.hooksPath .githooks`).
