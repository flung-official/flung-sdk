---
name: flungies
description: Use @flung.dev/flungies (seeded avatars, plush speech bubbles) in a project, as SVG, React, <flung-ie> or the animated WebGL hero; or add or change a Flungie trait (accessory, colour, body shape) in packages/flungies without changing any existing seed's avatar. Use when asked to add Flungie avatars somewhere, to add an accessory, colour or shape, or when a Flungie golden test fails.
---

# Flungies

Read `packages/flungies/BUILDING.md` first. It covers the seeding streams, the trait tables, the colour rules, the size tiers, the WebGL hero and the golden-test policy.

## Use it in a project

1. **Install** `@flung.dev/flungies`. It has no runtime dependencies, and React is an optional peer. Before it is on npm, vendor the built ESM, as flung-app does with `scripts/sync-flungies.mjs`.
2. **Seed with a stable ID**, the user's ID rather than their email or name, so the avatar survives a change of email. Keep people and workspaces distinct: Flungies for people, and something else (initials, a tile) for organisations.
3. **Pick the entry:**
   - SVG anywhere: `flungie(id, { size, theme })`. This works on a server, in a Worker or in Node.
   - React: `<Flungie seed={id} size={32} />`.
   - No framework: `defineFlungie()`, then `<flung-ie seed=... size=...>`.
4. **Animate sparingly.** Use `animated` (React), the `animated` attribute, or `mountFlungieGL` only for one or two heroes per app, at 160 px or more, such as a profile header. It lazy-loads, runs only while visible, and draws a still frame under reduced motion. Call `dispose()` when it unmounts.
5. **For another product**, pass `salt: '<product>'` so the same user IDs give different Flungies from Flung's. `palette` and `accessories: { include, exclude }` fit it to the product's brand.
6. **Theme.** Pass `theme: 'dark'` on dark surfaces; the disc changes and the character does not. Use `variant: 'bare'` with `ground` when it sits on a coloured surface with no disc.

## Add or change a trait safely

1. **Never change a seed's output.** Reordering, reweighting, removing, or appending to `COLOURS`, `SHAPES`, `ACCESSORIES`, `EYES`, `MOUTHS`, `LINE_PAIRS` or `SIDES` changes what existing seeds pick. So does a geometry constant, an extra draw inserted into the `geometry` stream, or a change to `hash` or `normalise`.
2. **Draw it** in `src/accessories.ts` (`ACC_DRAW`), or add the colour or shape record, following "Adding an accessory, a colour or a body" in BUILDING.md.
3. **Make it reachable without moving anyone.** Expose it through `overrides` only, or behind a new `version` option that picks from the longer list while version 1 stays frozen.
4. **Check it:** run `pnpm --filter @flung.dev/flungies test`. `golden.test.ts` must pass unchanged, and never edit a golden value. Add golden rows that wear the new trait.
5. **Look at it:** `pnpm --filter @flung.dev/flungies build && node examples/flungies/server.mjs`. Check it at 16 to 240 px, in light and dark.
6. **Commit** as `feat(flungies): ...`, a Conventional Commit, with no AI attribution lines. Never push: pushing `main` releases to npm.
