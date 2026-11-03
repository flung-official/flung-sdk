# @flung.dev/flungies

Avatars generated from a seed. Each Flungie is a plush speech bubble caught mid-throw, with two speed lines behind it, a face and sometimes an accessory. The same seed gives the same Flungie everywhere, forever.

- **The core** returns SVG strings. It runs in browsers, Node, Workers, Deno and Bun, and needs no DOM.
- **`/gl`** is an animated hero for large sizes. It shades a felt body in WebGL2, then breathes and blinks.
- **`/react`** is a `<Flungie>` component.
- **`/element`** is a `<flung-ie>` custom element.
- **`/marks`** draws workspace marks: squared tiles pressed with a seeded pattern, with the workspace's initials. `/react` and `/element` carry them too.

The package has no runtime dependencies. React is an optional peer.

```sh
npm install @flung.dev/flungies
```


## Expressions

A Flungie's face for the moment: what it is feeling while it works. An expression never changes who a Flungie is, so the same
seed can show every one, and `neutral` (the default) draws the seed's own face exactly as before.

| Expression | Face |
|---|---|
| `neutral` | The seed's own eyes, mouth and blush |
| `happy` | Closed happy eyes, a grin, warm cheeks |
| `cute` | Big shining eyes, a cat mouth, deep pink cheeks and two sparkles |
| `mad` | Angry brows, a frown, a red flush and marks of heat |
| `sad` | Worried brows, a frown, cool cheeks and a tear |
| `thinking` | Eyes glancing up, one brow raised, a flat mouth and a thought |
| `surprised` | Wide eyes, raised brows, an O mouth |
| `sleepy` | Half-closed eyes, a small mouth and a z |

```ts
render(traits('sacha@flung.dev'), { size: 128, expression: 'thinking' })
flungie('sacha@flung.dev', { expression: 'mad' })
const hero = mountFlungieGL(el, 'sacha@flung.dev', { expression: 'happy' })
hero.setExpression('surprised')
```

Under 32 px only the eyes and mouth change: no brows, cheeks or extras. `EXPRESSIONS` lists them and `EXPRESSION_SPECS` says how
each is drawn; a new expression is one entry there.

## Store

What a person can dress their Flungie in, and the rules for earning it. Plain data and pure functions: the service keeps the
wallets and its own overrides, and passes them in, so the server, a staff console and the app all read the same rules.

| Export | What it is |
|---|---|
| `DEFAULT_STORE` | Every accessory in each of its colours, and every eyes, mouth, tattoo, body colour, trail and shape, as `StoreItem`s with an id (`crown:gold`, `tattoo:heart`), a `kind`, a `category`, a rarity, a level and a price |
| `STORE_CATEGORIES` | The shelf's sections: `headwear`, `glasses`, `gear`, `eyes`, `mouths`, `tattoos`, `colours`, `trails`, `shapes` |
| `storeItems(overrides)` | The shelf with a service's changes (`level`, `price`, `rarity`, `enabled`) laid over the defaults |
| `pointsEarned(facts, rules)` | Points for published posts, levels above the first and achievements (`DEFAULT_EARN_RULES`: 5, 50, 25) |
| `balance(wallet)` | Earned plus staff's adjustment, less spent; never below 0 |
| `availability(item, wallet, level)` | `owned`, `available`, or what stands in the way: `level`, `points` or `off` |
| `dress(traits, items)` / `preview(traits, items)` | The traits, or an SVG, of a Flungie wearing one item or several (one of each kind); every other trait its own |

```ts
const shelf = storeItems({ 'crown:gold': { price: 1500 } })
const svg = preview(traits('usr_8f3k2'), shelf.find((item) => item.id === 'crown:gold') ?? null)
```

By default an item opens at level 1, 5, 10 or 20 and costs 100, 300, 750 or 2,000 points by its rarity. Each accessory's first
colour is its signature, one rarity higher. A new item is one entry in its trait table; a new kind is one entry in `KINDS` in
`src/store.ts`.

### Tattoos

`TATTOOS` (heart, star, lightning, flower, music note, flame, anchor) is a trait no seed picks: every Flungie has none until one
is put on, so tattoos change no one's drawing. A tattoo sits on the lower back of the body, in an ink that reads on its colour,
from 32 px: `traits(id, { tattoo: 'heart' })` or `dress(t, { kind: 'tattoo', value: 'heart', colour: null })`.

### Pants and auras

`PANTS` (shorts, sailor stripes, polka dots, jeans, plaid, a tutu and gold lamé) dress the bottom of the body and the tail, the
spike of the speech bubble, each in its own colours. `AURAS` (a soft glow, bubbles, hearts, sparkles, an orbit, a rainbow halo
and a prism ring) sit behind the Flungie. Neither is picked by a seed. An aura is a still frame unless the render passes
`animate: true`, which plays it with SMIL and needs no stylesheet; leave it off where the reader asked for reduced motion.

```ts
render(dress(traits(id), [{ kind: 'pants', value: 'tutu', colour: null }, { kind: 'aura', value: 'halo', colour: null }]), { size: 160, animate: true })
```

## Use

```ts
import { flungie, toDataUri, traits, render } from '@flung.dev/flungies'

el.innerHTML = flungie(user.id, { size: 32, theme: 'dark' })    // an SVG string
img.src = toDataUri(flungie(user.id, { size: 64 }))               // or a data: URI
render(traits(user.id, { accessory: 'crown' }), { size: 128 })    // overrides win over the seed
```

Seed with a stable ID, such as a user ID, rather than an email or a name that may change.

### On a server

The core needs no DOM, so a Worker can serve Flungies as images. A seed always gives the same drawing, so the response can be cached forever.

```ts
import { flungie } from '@flung.dev/flungies'

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url)
    const id = url.searchParams.get('id') ?? ''
    const size = Math.min(512, Math.max(16, Number(url.searchParams.get('size')) || 64))
    return new Response(flungie(id, { size }), {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=31536000, immutable' },
    })
  },
}
```

Each SVG's internal ids come from a counter by default. When a server renders a Flungie into HTML that a browser then hydrates, pass the `id` option (`flungie(id, { size, id: 'avatar-1' })`) so both sides write the same markup. The React component does this for you with `useId`.

### React

```tsx
import { Flungie } from '@flung.dev/flungies/react'

<Flungie seed={user.id} size={32} />
<Flungie seed={user.id} size={240} theme="dark" animated />
```

With `animated` and a size of 160 or more, the component shows the SVG first, then loads `@flung.dev/flungies/gl` and swaps in the WebGL hero. Below 160 px, it is always the SVG. The component renders on a server and hydrates without a mismatch.

### WebGL hero

```ts
import { mountFlungieGL } from '@flung.dev/flungies/gl'

const hero = mountFlungieGL(el, user.id, { size: 320, theme: 'light' })
hero.setTheme('dark')
hero.setSize(240)
hero.dispose()   // stops the loop, releases the GL context and empties el
```

The hero animates only while it is on screen and the page is visible. Under `prefers-reduced-motion` it draws one still frame. Without WebGL2, or if the context is lost, it shows the SVG Flungie, and `hero.webgl` is `false`.

### Custom element

```ts
import { defineFlungie } from '@flung.dev/flungies/element'
defineFlungie()   // registers <flung-ie>; defineFlungie('my-avatar') uses another name
```

```html
<flung-ie seed="usr_8f3k2" size="40" theme="dark"></flung-ie>
<flung-ie seed="usr_8f3k2" size="240" animated></flung-ie>
```

The element takes the attributes `seed`, `size`, `theme`, `variant`, `salt` and `animated`.

## Workspace marks

Flungies are for people. For workspaces, teams and organisations, `@flung.dev/flungies/marks` draws a workspace mark: a squircle pressed with one of three patterns (tiles, lines or ripples), in a two-tone colour pair, with the workspace's initials on top. A person is round and a workspace is square, so the two never read as one another.

```ts
import { workspaceMark, markTraits, renderMark, markInitials, plainMark } from '@flung.dev/flungies/marks'

workspaceMark(workspace.id, { size: 32, theme: 'dark', name: workspace.name })    // an SVG string
renderMark(markTraits(workspace.id, { pattern: 'ripples' }), { size: 256, animate: true })
markInitials("maya@northwind.studio's workspace")                                   // 'M'
markInitials('Northwind Studio')                                                    // 'NS'
plainMark(workspace.id, { size: 24, name: workspace.name })                         // initials on a tint, no pattern
```

Seed with the workspace's ID and pass its name for the initials, so a rename changes the letters but not the mark. Under 24 px a mark shows one letter.

| Option | For | Default |
|---|---|---|
| `size` | Pixels. The pattern is bolder under 32 px, and the signature lines and grain appear from 64 px. | `64` |
| `theme` | `'light'` or `'dark'`. The mark keeps its colours, and gains a rim only where it would melt into the page. | `'light'` |
| `name` | The workspace's display name, for the initials. Without it, the initials come from the seed. | none |
| `initials` | `'auto'`, letters of your own, or `false` for none. | `'auto'` |
| `grain` | `false` turns the grain off. | `true` |
| `animate` | A slow light sweep across the relief, from 64 px. Hidden under `prefers-reduced-motion`. | `false` |
| `id` | The prefix for the SVG's internal ids, for a server render that a browser hydrates. | a counter |
| `overrides` | Traits to set instead of the seed's (`{ pattern: 'lines', pair: 'ocean' }`). | none |
| `salt`, `palette`, `patterns` | For other products: a salt, your own colour pairs (`{ id, label, ground, tone }`), and `{ include }` or `{ exclude }` for the patterns. | none |

### Marks on a server

```ts
import { workspaceMark } from '@flung.dev/flungies/marks'

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url)
    const id = url.searchParams.get('id') ?? ''
    const name = url.searchParams.get('name') ?? undefined
    const size = Math.min(512, Math.max(16, Number(url.searchParams.get('size')) || 64))
    const theme = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light'
    return new Response(workspaceMark(id, { size, name, theme }), {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
    })
  },
}
```

The initials follow the name, which can change, so cache a mark for a day rather than forever, or put the name in the URL as above.

### Marks in React and as an element

```tsx
import { WorkspaceMark } from '@flung.dev/flungies/react'

<WorkspaceMark seed={workspace.id} name={workspace.name} size={32} />
<WorkspaceMark seed={workspace.id} name={workspace.name} size={96} theme="dark" animated />
```

```ts
import { defineWorkspaceMark } from '@flung.dev/flungies/element'
defineWorkspaceMark()   // registers <flung-mark>
```

```html
<flung-mark seed="ws_8f3k2" name="Northwind Studio" size="32" theme="dark"></flung-mark>
```

The element takes the attributes `seed`, `name`, `size`, `theme`, `initials` (letters, or `none`), `salt` and `animated`. On a page that may not assign `innerHTML`, append `toSvgElement(workspaceMark(...))`, which `/marks` exports too.

Also exported from `/marks`: `MARK_TRAITS` and the tables (`MARK_PAIRS`, `MARK_PATTERNS` and the rest), `markCombinations()` (25,200 discrete trait sets), `markPalette()`, `markGeometry()` and `describeMark()`, the accessible name each SVG carries.

## Options

| Option | For | Default |
|---|---|---|
| `size` | Pixels. The drawing simplifies under 32 px and gets its felt texture from 80 px. | `64` |
| `theme` | `'light'` or `'dark'`. Picks the disc and checks the contrast with the ground. | `'light'` |
| `variant` | `'disc'`, `'square'` (a rounded tile) or `'bare'` (no ground). | `'disc'` |
| `texture` | `false` turns the felt filter off. | `true` |
| `ground` | With `'bare'`, the colour the Flungie sits on, used for the rim check. | the theme's page colour |
| `id` | The prefix for the SVG's internal ids, so a server and a browser render the same markup. | a counter |
| `overrides` | Traits to set instead of the seed's (`{ accessory: 'none' }`). | none |

For other products, these options change which Flungie a seed gives. With all of them unset, a seed gives exactly the Flungie it gives on Flung.

| Option | For |
|---|---|
| `salt` | Mixed into the seed, so the same user ID gives a different Flungie in your product. |
| `palette` | Body colours to pick from, instead of `COLOURS`: `{ id, label, hex, light: [...discs], dark: [...discs] }`, with discs as `DISCS` keys or `#RRGGBB`. |
| `accessories` | `{ include: ['none', 'headphones'] }` or `{ exclude: ['crown'] }`. |

```ts
flungie(user.id, { salt: 'acme', accessories: { exclude: ['crown', 'halo'] } })
traits(user.id, {}, { salt: 'acme' })   // traits(seed, overrides, config)
```

## Also exported

- `TRAITS`, every trait with its options, for pickers.
- `combinations()`, which returns 907,200 discrete trait sets.
- The tables `COLOURS`, `DISCS`, `SHAPES`, `EYES`, `MOUTHS`, `ACCESSORIES`, `ACC_COLOURS`, `LINE_PAIRS` and `SIDES`.
- `colours()` and `geometry()`, for renderers of your own.
- `toSvgElement(svg)`, which parses an SVG string into an element to append, for pages that may not assign `innerHTML`.
- `describe()`, the accessible name, which every SVG also carries as its `aria-label`.
- The colour helpers `contrast`, `distance`, `luminance` and `mix`.

[BUILDING.md](./BUILDING.md) explains how a Flungie and a workspace mark are made, and how to add a trait without changing anyone's avatar.

## Licence

MIT
