import { contrast, distance, luminance, mix } from './colour.js'
import {
  ACC,
  ACCESSORIES,
  type Accessory,
  byId,
  type Colour,
  COLOURS,
  DISCS,
  EYES,
  INK,
  LINE_PAIRS,
  type LinePair,
  MOUTHS,
  PAPER,
  SHAPES,
  SIDES,
  WHITE,
} from './data.js'
import { hash, mulberry32, normalise, weighted } from './random.js'

export type Theme = 'light' | 'dark'

/** What a seed picks. Every field may be overridden; `rolls` and `jitter` are the continuous draws. */
export interface Traits {
  /** The normalised seed. */
  seed: string
  /** The 32 bit hash every stream starts from. */
  hash: number
  shape: string
  colour: string
  eyes: string
  mouth: string
  blush: boolean
  accessory: string
  /** null: picked to stand clear of the body. */
  accColour: string | null
  side: string
  lines: string
  rolls: { acc: number; acc2: number; disc: number }
  jitter: {
    w: number
    h: number
    tilt: number
    wob: [number, number, number, number]
    tail: [number, number, number, number, number]
    eye: [number, number, number]
    acc: [number, number, number]
  }
}

export type Overrides = { [K in Exclude<keyof Traits, 'seed'>]?: Traits[K] | undefined }

/**
 * Options for using Flungies in another project. With none set, a seed gives exactly what it gives on Flung.
 *   salt         mixed into the seed, so the same user ID gives a different Flungie in your product than in someone else's
 *   palette      body colours to pick from instead of COLOURS
 *   accessories  ids to allow (include) or leave out (exclude)
 */
export interface FlungieConfig {
  salt?: string | undefined
  palette?: readonly Colour[] | undefined
  accessories?: { include?: readonly string[] | undefined; exclude?: readonly string[] | undefined } | undefined
}

function accessoryList(config: FlungieConfig): readonly Accessory[] {
  const rule = config.accessories
  if (!rule || (!rule.include && !rule.exclude)) return ACCESSORIES
  const list = ACCESSORIES.filter((a) => (!rule.include || rule.include.includes(a.id)) && !rule.exclude?.includes(a.id))
  return list.length ? list : [ACCESSORIES[0] as Accessory]
}

/** The key a seed is hashed as: the normalised seed, with the salt in front when there is one. */
export const seedKey = (seed: unknown, salt?: string): string => {
  const key = normalise(seed)
  return salt ? `${salt}\u0000${key}` : key
}

/** The traits a seed picks, with any overrides applied ({ shape: 'tall', accessory: 'crown', ... }). */
export function traits(seed: unknown, overrides: Overrides = {}, config: FlungieConfig = {}): Traits {
  const key = normalise(seed)
  const h = hash(seedKey(seed, config.salt))
  const s = (name: string) => mulberry32((h ^ hash(name)) >>> 0)
  const g = s('geometry')
  const j = () => g()
  const t: Traits = {
    seed: key,
    hash: h,
    shape: weighted(s('shape'), SHAPES).id,
    colour: weighted(s('colour'), config.palette?.length ? config.palette : COLOURS).id,
    eyes: weighted(s('eyes'), EYES).id,
    mouth: weighted(s('mouth'), MOUTHS).id,
    blush: s('blush')() < 0.55,
    accessory: weighted(s('accessory'), accessoryList(config)).id,
    accColour: null,
    side: weighted(s('side'), SIDES).id,
    lines: weighted(s('lines'), LINE_PAIRS).id,
    rolls: { acc: s('acc-colour')(), acc2: s('acc-colour-2')(), disc: s('disc')() },
    jitter: {
      w: j(),
      h: j(),
      tilt: j(),
      wob: [j(), j(), j(), j()],
      tail: [j(), j(), j(), j(), j()],
      eye: [j(), j(), j()],
      acc: [j(), j(), j()],
    },
  }
  const writable = t as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(overrides || {})) if (v !== undefined && v !== '' && k in t && k !== 'seed') writable[k] = v
  return t
}

/** The number of distinct trait sets, counting discrete traits only (sizes, tilts and wobbles vary on top of these). */
export function combinations() {
  const discrete = SHAPES.length * COLOURS.length * EYES.length * MOUTHS.length * 2 * ACCESSORIES.length * SIDES.length * LINE_PAIRS.length
  return {
    shapes: SHAPES.length,
    colours: COLOURS.length,
    eyes: EYES.length,
    mouths: MOUTHS.length,
    blush: 2,
    accessories: ACCESSORIES.length,
    sides: SIDES.length,
    lines: LINE_PAIRS.length,
    discrete,
  }
}

// Colour choices that depend on more than one trait -----------------------------------------------------------------

export interface Shading {
  base: string
  light: string
  shade: string
  deep: string
  eye: string
  blush: string
  blushOpacity: number
}

/** The shading set for a body colour. */
export function palette(base: string): Shading {
  const L = luminance(base)
  const dark = L < 0.1
  return {
    base,
    light: mix(base, WHITE, dark ? 0.26 : 0.5),
    shade: dark ? mix(base, '#000000', 0.45) : mix(base, '#3B2B5A', 0.32),
    deep: mix(base, '#1A1426', dark ? 0.6 : 0.5),
    eye: contrast(INK, base) >= contrast(PAPER, base) ? INK : PAPER,
    blush: dark ? '#FF8FB0' : mix(base, '#FF4F86', 0.5),
    blushOpacity: dark ? 0.45 : 0.55,
  }
}

export interface AccShading {
  base: string
  light: string
  shade: string
  deep: string
}

function accSet(base: string): AccShading {
  const dark = luminance(base) < 0.08
  return {
    base,
    light: mix(base, WHITE, dark ? 0.3 : 0.45),
    shade: dark ? mix(base, '#000000', 0.4) : mix(base, '#2A1F45', 0.3),
    deep: mix(base, '#120F1A', 0.55),
  }
}

/** The body colour a trait set wears, from the palette in use. */
export const colourOf = (t: Traits, list: readonly Colour[] = COLOURS): Colour =>
  byId(list, t.colour) ?? byId(COLOURS, t.colour) ?? (list[0] as Colour)

function discFor(t: Traits, theme: Theme, list: readonly Colour[]): string {
  const c = colourOf(t, list)
  const discs = theme === 'dark' ? c.dark : c.light
  const key = discs[Math.floor(t.rolls.disc * discs.length) % discs.length] as string
  return DISCS[key] ?? key
}

function pickAccColour(list: readonly string[], roll: number, avoid: readonly string[], minBody = 0.16, minOther = 0.1): string | null {
  if (!list.length) return null
  const start = Math.floor(roll * list.length) % list.length
  let best: string | null = null
  let bestScore = -1
  for (let i = 0; i < list.length; i++) {
    const id = list[(start + i) % list.length] as string
    const c = ACC[id] as string
    const dBody = distance(c, avoid[0] as string)
    const dOther = Math.min(1, ...avoid.slice(1).map((x) => distance(c, x)))
    if (dBody >= minBody && dOther >= minOther) return id
    const score = Math.min(dBody / minBody, dOther / minOther)
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

export interface Resolved {
  body: string
  P: Shading
  disc: string
  discL: string
  discD: string
  accId: string | null
  A: AccShading | null
  A2: AccShading | null
  pair: LinePair
}

const SECOND = ['butter', 'coral', 'sky', 'mint', 'paper', 'rose', 'lilac', 'gold']

/** Resolves the colours a trait set wears: body palette, disc, lines and the accessory's colours. */
export function colours(t: Traits, theme: Theme = 'light', list: readonly Colour[] = COLOURS): Resolved {
  const body = colourOf(t, list).hex
  const P = palette(body)
  const acc = byId(ACCESSORIES, t.accessory) ?? (ACCESSORIES[0] as Accessory)
  const discL = discFor(t, 'light', list)
  const discD = discFor(t, 'dark', list)
  const disc = theme === 'dark' ? discD : discL
  // Choose accessory colours against both themes' discs, so a Flungie keeps its hat colour when the theme changes.
  const avoid = acc.above ? [body, discL, discD] : [body]
  const accId = t.accColour && ACC[t.accColour] ? t.accColour : pickAccColour(acc.colours, t.rolls.acc, avoid)
  const A = accId ? accSet(ACC[accId] as string) : null
  const acc2Id = A ? pickAccColour(SECOND, t.rolls.acc2, [A.base, body], 0.2, 0.12) : null
  const A2 = acc2Id ? accSet(ACC[acc2Id] as string) : null
  const pair = byId(LINE_PAIRS, t.lines) ?? (LINE_PAIRS[0] as LinePair)
  return { body, P, disc, discL, discD, accId, A, A2, pair }
}
