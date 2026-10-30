// Flungies: generated avatars. Each one is a plush speech bubble caught mid-throw, with two speed lines behind it, a
// face and maybe an accessory, all picked from a string seed. No dependencies and no DOM: it runs in browsers, workers
// and Node, and only ever returns strings.
//
//   import { flungie, traits, render } from '@flung.dev/flungies'
//   el.innerHTML = flungie('usr_8f3k2', { size: 32, theme: 'dark' })
//   const t = traits('usr_8f3k2', { accessory: 'crown' })   // overrides win over the seed
//   el.innerHTML = render(t, { size: 256, variant: 'square' })
//
// Every trait draws from its own stream (the seed's hash mixed with the trait's name), so overriding one trait, or
// adding a new one later, never changes the others. How it is built: BUILDING.md.

export { contrast, distance, luminance, mix } from './colour.js'
export {
  ACC_COLOURS,
  type Accessory,
  ACCESSORIES,
  type Colour,
  COLOURS,
  DISCS,
  EYES,
  INK,
  LINE_PAIRS,
  type LinePair,
  MOUTHS,
  type Option,
  PAPER,
  type Shape,
  SHAPES,
  SIDES,
  TRAITS,
} from './data.js'
export { CX, CY, type Geometry, geometry, type Point } from './geometry.js'
export { hash, mulberry32, normalise } from './random.js'
export { describe, flungie, type FlungieOptions, type Layer, LAYERS, render, type RenderOptions, toDataUri, type Variant } from './render.js'
export {
  type AccShading,
  colours,
  combinations,
  type FlungieConfig,
  type Overrides,
  palette,
  type Resolved,
  seedKey,
  type Shading,
  type Theme,
  type Traits,
  traits,
} from './traits.js'

/**
 * The version of the drawing. A seed's Flungie never changes within a version; a change that would alter an existing
 * seed's output ships behind a new version, chosen by an option, and this default stays 1.
 */
export const VERSION = 1
