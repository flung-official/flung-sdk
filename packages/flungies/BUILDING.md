# How Flungies are built

This is the design and the engineering behind `@flung.dev/flungies`: what a Flungie is, how a seed becomes one, and how to change the set without changing anyone's avatar.

## The concept

Flung's mark (G9) is a speech bubble thrown across the frame. A Flungie is that bubble as a character: a plush, felted body with a tail, caught mid-throw, leaning into the throw.

- **The body** is the bubble: a soft superellipse with a wedge-shaped tail at its lower back.
- **Two speed lines** trail behind it, in two of the brand's colours (peach over sky is the brand pair).
- **A face** sits toward the front of the body, the way it is travelling.
- **An accessory** is chosen from a creator-themed set: headphones, caps, a beanie, glasses, a party hat, an antenna, a bow, a ring light, a crown, a megaphone, a pencil and a paper plane.
- **A disc** behind it is a soft tint on light pages and a deep tone on dark ones. A square tile (`variant: 'square'`) and no ground at all (`'bare'`) are the other variants.

By default the Flungie flies right, with its tail on the left, as the mark does. About a third of Flungies are mirrored. A mirrored Flungie is the same drawing, flipped.

## From a seed to a Flungie

```
seed ──normalise──▶ key ──hash──▶ h ──┬─ h ^ hash('shape')     ─▶ mulberry32 ─▶ shape
                                      ├─ h ^ hash('colour')    ─▶ mulberry32 ─▶ colour
                                      ├─ ...one stream per trait
                                      └─ h ^ hash('geometry')  ─▶ mulberry32 ─▶ jitter (21 draws, in order)
```

1. **Normalise.** `String(seed).trim().toLowerCase()`, so `Sacha@Flung.dev` and ` sacha@flung.dev ` are the same Flungie. With a `salt`, the key is `salt + "\0" + seed`.
2. **Hash.** FNV-1a over UTF-16 code units, then murmur3's 32 bit finaliser, so seeds one character apart land far apart (`src/random.ts`).
3. **One stream per trait.** Each trait has its own mulberry32 generator, seeded with `h XOR hash(traitName)`. This is what makes the set safe to change. Overriding one trait, or adding a new trait with a new name, never moves another trait's draw.
4. **Weighted picks.** Every option has a `weight`, which is 1 when unset. One draw, scaled by the total weight, walks the list.
5. **Continuous jitter.** The `geometry` stream draws, in order: width, height, tilt, four wobble phases, five tail values, three eye values and three accessory values. The order is fixed: appending a draw is safe, inserting one is not.
6. **Rolls.** The disc and the accessory colours each get a stream of their own (`disc`, `acc-colour`, `acc-colour-2`).

`traits(seed)` returns all of this as a plain object. `render(traits)` is a pure function of that object and the render options.

## The traits

| Trait | Options | Weighting and notes |
|---|---|---|
| Shape | Classic, Round, Squat, Tall, Wobbly, Puffy (6) | Classic 1.6, the others 1. A polar superellipse (`hw`, `hh`, exponent `n`) plus three seeded harmonics. Puffy adds ten lobes. Width and height jitter by plus or minus 5%, and the tilt is 3 to 13 degrees. |
| Tail | Seeded base, tip and bend | Part of the geometry stream, not a trait of its own. |
| Side | Tail left, flying right; or mirrored (2) | 2.2 to 1, so about 69% fly right. |
| Colour | Peach, Sky, Butter, Mint, Lilac, Coral, Sand, Cloud, Ink, Ocean, Moss, Plum, Berry, Rust (14) | The brand pastels peach and sky are 1.3. Sand, Cloud and Ink are 0.8. The deep tones are 0.9. |
| Eyes | Dots, Ovals, Sleepy, Wink, Wide, Happy arcs (6) | Dots 2, Ovals 1.5, Wide 1.2, Wink 0.8. Ink eyes, or paper eyes on dark bodies. |
| Mouth | None, Smile, Little o, Cat, Grin (5) | None and Smile 3, Cat and Grin 1.5. |
| Blush | On, Off (2) | On 55% of the time. |
| Accessory | None plus 14 | None is 1.6, so about 11% of Flungies wear nothing. |
| Accessory colour | 18 colours | From the accessory's own preference list (see Colour). |
| Speed lines | Peach and sky, Butter and coral, Mint and sky, Lilac and peach, Coral and butter, Sky and lilac (6) | The brand pair is 2. |

`combinations().discrete` is 907,200 (6 × 14 × 6 × 5 × 2 × 15 × 2 × 6). The disc, the accessory colours and the jitter multiply that further.

## Colour

Every comparison is in OKLab (`distance()`), where about 0.02 is a just-noticeable difference and 0.15 reads as clearly separate. Contrast ratios use WCAG luminance (`contrast()`).

- **Discs are curated, not computed.** Each body colour lists the discs it may sit on, one list for light and one for dark (`COLOURS[i].light` and `.dark`, as keys of `DISCS`). Pale bodies such as Butter, Mint, Sand and Cloud get mid-tone discs in the light theme, because a pale tint would melt into them. Ink gets dimmed colour discs in the dark theme. The `disc` roll picks from the list. Every pair is at least 0.12 apart, and the test `palette contrast` holds that.
- **Eyes** are ink or paper, whichever contrasts more with the body. Every body gets at least 4:1.
- **Shading** is derived from the body colour: a light mixed toward white, a shade mixed toward a deep violet (or toward black on dark bodies), and a deep tone for edges.
- **Accessory colours** walk the accessory's preference list from a seeded start, and take the first colour at least 0.16 from the body. An accessory that sits above the head, against the disc, must also be at least 0.10 from both themes' discs, so a Flungie keeps its hat colour when the theme changes. If no colour passes, the best-scoring colour is used. That happens for about 2% of Flungies, such as a gold ring light on a butter body.
- **A second accessory colour**, for pompoms, patches and confetti, must be 0.20 from the first colour and 0.12 from the body.
- **A rim.** If the body's contrast with its ground is under 1.45, which can happen with `variant: 'bare'`, a rim is stroked behind the fills. The body and tail still read as one shape.

## Size tiers

| Size | What changes |
|---|---|
| Under 32 px | No speed lines, shadow, blush, mouth or eye highlights. Eyes are 1.55 times larger, wide eyes become dots, every stroke is at least 0.95 px, the character is scaled up 1.14 times to fill the disc, and fine accessory detail is dropped. |
| 32 to 63 px | Adds the lines, blush, mouth, sheen and highlights. |
| 64 px and up | Adds every accessory detail. |
| 80 px and up | Adds the felt filter. |

Stroke widths are given in units with a minimum in pixels (`sw(units, minPx)`), so a line never thins out to nothing at small sizes.

## The felt filter

From 80 px, the body's fill passes through one SVG filter, sized in pixels, so the texture neither blurs when small nor vanishes when large:

1. `feTurbulence` fractal noise, seeded from the hash. Its frequency is `size / 270`, clamped to 0.34 to 1.6.
2. `feDisplacementMap` makes the edge wander a little, as felt does.
3. An inner shadow: blur the alpha, offset it toward the light, and keep only the rim. This rolls the edge away from the light.
4. Two colour matrices turn the noise into light and dark specks, the fibres. They are gentler on dark bodies, where light specks shout.

## The WebGL hero

At hero sizes, the SVG body is replaced by a shader. Everything else stays SVG, layered under and over the canvas:

```
under  SVG: disc, shadow, speed lines, accessory parts behind the body
canvas WebGL2: the body
over   SVG: face and accessory parts in front
```

- **A distance field.** The same outline the SVG draws is rasterised onto a 320 px canvas. Two exact Euclidean distance transforms (Felzenszwalb and Huttenlocher) give a signed distance in units, which is uploaded as an `R16F` texture (`src/gl/field.ts`).
- **The shader** (`src/gl/shader.ts`) lifts the field into a dome, which is steep at the edge and flat on top. It lights the dome from the top left and adds a velvet sheen at grazing angles. Fibre noise is stretched along the normal, so the edge breaks into fuzz. A soft occlusion darkens the lower edge, and a fine grain adds texture.
- **Pixel-identical face.** The face and accessories are the SVG renderer's own output, so the hero and the small avatar are recognisably the same character.
- **Idle motion.** A breathing squash of 1.6% on x and 2.8% on y, over 3.6 seconds, is pinned at the bottom of the body. The same transform is applied to the SVG layers and the shader. The eyes blink every 2.5 to 5.5 seconds, and sometimes twice.
- **Cost control.** `requestAnimationFrame` runs only while the hero is on screen (`IntersectionObserver`) and the tab is visible. Under `prefers-reduced-motion`, the hero draws one still frame and listens for the preference to change. `dispose()` cancels the frame, disconnects the observers and calls `WEBGL_lose_context`. Without WebGL2, or after a lost context, it shows the SVG.

## Golden-test policy: never change a seed's output

People recognise their Flungie. A change that alters an existing seed's drawing is a breaking change for every user, even if it looks better.

- `src/__tests__/golden.test.ts` freezes 20 seeds: their discrete traits, their hash, and the SHA-256 of their SVG at 24 px (tiny), at 64 px (full detail) and at 128 px dark (felt). These values came from the original prototype, and the package was checked against that prototype over 3,000 seeds.
- **Never edit a golden value to make a test pass.** Rows may only be added.
- A change that has to alter existing output ships behind a new version. Keep the current drawing as the default (`VERSION = 1`), add a `version` option that selects the new behaviour, and add golden rows for the new version.

These changes are safe:

- adding an option to a list only through a new trait stream, or behind a version;
- new render options that default to the current behaviour;
- a new export.

These changes are not safe:

- reordering, reweighting or removing an option in any list;
- adding an option to an existing list;
- changing a constant in the geometry or a colour value;
- inserting a draw into the geometry stream;
- changing `normalise` or `hash`.

## Adding an accessory, a colour or a body

Adding an option to `ACCESSORIES`, `COLOURS` or `SHAPES` changes which option many existing seeds pick, because the weighted walk covers the whole list. So a new option is never added to the default lists directly.

1. **Draw it.** For an accessory, add a function to `ACC_DRAW` in `src/accessories.ts` that returns `{ back?, front? }` SVG in the body frame. The body frame has its centre at 0,0 and travels toward +x. Use `G.topY(x)` and `G.edgeX(y)` to sit on the outline, `sw()` for strokes, and `detail` (0, 1 or 2) to drop fine parts at small sizes. For a colour, add its `hex` and its two curated disc lists. For a body, add its `hw`, `hh`, `n` and `wobble`.
2. **Make it reachable without moving anyone.** Either:
   - offer it through `overrides` only, which is safe at once and suits a "pick your accessory" control; or
   - put it behind a version: under `version: 2`, pick from the longer list, and keep version 1 on the frozen list.
3. **Check its colours.** Give an accessory a preference list of `ACC_COLOURS` ids. Set `above: true` if it sits against the disc, and `hat: true` if it covers the top of the head. Run the `palette contrast` tests.
4. **Look at it.** Run `node examples/flungies/server.mjs` and check it at 16, 24, 32, 48, 64, 96 and 240 px, in light and dark.
5. **Test it.** Add golden rows that wear it, through overrides or under the new version. Check that the existing rows still pass unchanged.

## Files

| File | What it holds |
|---|---|
| `src/random.ts` | `hash`, `mulberry32`, `normalise` and the weighted pick. |
| `src/colour.ts` | sRGB mixing, WCAG luminance and contrast, OKLab distance. |
| `src/data.ts` | Every trait table. |
| `src/traits.ts` | `traits()`, `colours()` and `palette()`: from a seed to the colours a Flungie wears. |
| `src/geometry.ts` | The outline, the tail, and the points the face and accessories hang from. |
| `src/render.ts` | `render()`, `flungie()`, the body layer, the felt filter and the face. |
| `src/accessories.ts` | One drawing function per accessory. |
| `src/gl/` | The WebGL hero: the distance field, the shader and `mountFlungieGL`. |
| `src/react/`, `src/element/` | `<Flungie>` and `<flung-ie>`. |
