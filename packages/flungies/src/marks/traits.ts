import { contrast, luminance, mix } from '../colour.js'
import { INK, PAPER, type Option, WHITE } from '../data.js'
import { hash, mulberry32, normalise, weighted } from '../random.js'
import { seedKey } from '../traits.js'
import {
  byMarkId,
  MARK_ANGLES,
  MARK_CENTRES,
  MARK_FINISHES,
  MARK_PAIRS,
  MARK_PATTERNS,
  MARK_RHYTHMS,
  MARK_SCALES,
  MARK_SIGNATURES,
  type MarkPair,
} from './data.js'

/** What a seed picks for its workspace mark. Every field but `seed` may be overridden; `phase` is the continuous draw. */
export interface MarkTraits {
  /** The normalised seed. */
  seed: string
  /** The 32 bit hash every stream starts from. */
  hash: number
  pattern: string
  pair: string
  finish: string
  scale: string
  /** Degrees. */
  angle: number
  centre: string
  rhythm: string
  signature: string
  /** Where the grid, the rows and the rings start, each in [0, 1). */
  phase: [number, number, number]
}

export type MarkOverrides = { [K in Exclude<keyof MarkTraits, 'seed'>]?: MarkTraits[K] | undefined }

/**
 * Options for using workspace marks in another project. With none set, a seed gives exactly what it gives on Flung.
 *   salt      mixed into the seed, so the same workspace ID gives a different mark in your product
 *   palette   colour pairs to pick from instead of MARK_PAIRS
 *   patterns  ids to allow (include) or leave out (exclude)
 */
export interface MarkConfig {
  salt?: string | undefined
  palette?: readonly MarkPair[] | undefined
  patterns?: { include?: readonly string[] | undefined; exclude?: readonly string[] | undefined } | undefined
}

function patternList(config: MarkConfig): readonly Option[] {
  const rule = config.patterns
  if (!rule || (!rule.include && !rule.exclude)) return MARK_PATTERNS
  const list = MARK_PATTERNS.filter((p) => (!rule.include || rule.include.includes(p.id)) && !rule.exclude?.includes(p.id))
  return list.length ? list : [MARK_PATTERNS[0] as Option]
}

/** The traits a seed picks, with the overrides applied ({ pattern: 'lines', pair: 'ocean', ... }). */
export function markTraits(seed: unknown, overrides: MarkOverrides = {}, config: MarkConfig = {}): MarkTraits {
  const key = normalise(seed)
  const h = hash(seedKey(seed, config.salt))
  const s = (name: string) => mulberry32((h ^ hash(name)) >>> 0)
  const ph = s('phase')
  const t: MarkTraits = {
    seed: key,
    hash: h,
    pattern: weighted(s('pattern'), patternList(config)).id,
    pair: weighted(s('pair'), config.palette?.length ? config.palette : MARK_PAIRS).id,
    finish: weighted(s('finish'), MARK_FINISHES).id,
    scale: weighted(s('scale'), MARK_SCALES).id,
    angle: weighted(s('angle'), MARK_ANGLES).id,
    centre: weighted(s('centre'), MARK_CENTRES).id,
    rhythm: weighted(s('rhythm'), MARK_RHYTHMS).id,
    signature: weighted(s('signature'), MARK_SIGNATURES).id,
    phase: [ph(), ph(), ph()],
  }
  const writable = t as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === undefined || v === '' || v === null || !(k in t) || k === 'seed') continue
    writable[k] = k === 'angle' ? Number(v) : v
  }
  return t
}

/** The number of distinct trait sets, counting discrete traits only, and only the traits each pattern uses. */
export function markCombinations() {
  const common = MARK_PAIRS.length * MARK_FINISHES.length * MARK_SCALES.length * MARK_ANGLES.length * MARK_SIGNATURES.length
  const tiles = common
  const lines = common * MARK_RHYTHMS.length
  const ripples = common * MARK_CENTRES.length
  return {
    patterns: MARK_PATTERNS.length,
    pairs: MARK_PAIRS.length,
    finishes: MARK_FINISHES.length,
    scales: MARK_SCALES.length,
    angles: MARK_ANGLES.length,
    centres: MARK_CENTRES.length,
    rhythms: MARK_RHYTHMS.length,
    signatures: MARK_SIGNATURES.length,
    tiles,
    lines,
    ripples,
    discrete: tiles + lines + ripples,
  }
}

/**
 * One or two letters for a workspace name. Drops a trailing "'s workspace" (and a bare "workspace"), uses an email's local
 * part without its digits, and takes the first letter of the first two words: "maya@northwind.studio's workspace" gives "M",
 * "Northwind Studio" gives "NS" and "john.doe@acme.io" gives "JD". A single camel-cased word gives its two capitals
 * ("GitHub" gives "GH"). Digits count only when there is no letter at all. max: 1 or 2.
 */
export function markInitials(name: unknown, max = 2): string {
  let s = String(name ?? '').trim()
  s = s.replace(/[’']s\s+workspace$/i, '').replace(/\s+workspace$/i, '').trim()
  const at = s.indexOf('@')
  if (at > 0) s = s.slice(0, at).replace(/\d+/g, ' ')
  const words = s
    .split(/[\s._\-+/&,]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean)
  const lettered = words.filter((w) => /^\p{L}/u.test(w))
  const use = lettered.length ? lettered : words
  if (!use.length) return ''
  const first = use[0] as string
  if (use.length === 1 && max > 1) {
    const caps = first.match(/\p{Lu}/gu)
    if (caps && caps.length >= 2 && /^\p{Lu}/u.test(first) && !/^\p{Lu}+$/u.test(first)) return `${caps[0]}${caps[1]}`.toUpperCase()
  }
  return use
    .slice(0, max)
    .map((w) => [...w][0])
    .join('')
    .toUpperCase()
}

export interface MarkShading {
  ground: string
  tone: string
  /** The blend's midpoint, which the letters and the page are checked against. */
  mid: string
  /** The lit wall. */
  hi: string
  hiOpacity: number
  /** The shaded wall. */
  lo: string
  loOpacity: number
  letter: string
  dark: boolean
}

/** The shading set for a colour pair. */
export function markPalette(pair: MarkPair): MarkShading {
  const { ground, tone } = pair
  const mid = mix(ground, tone, 0.5)
  const dark = luminance(mid) < 0.12
  return {
    ground,
    tone,
    mid,
    hi: dark ? mix(ground, WHITE, 0.32) : mix(ground, WHITE, 0.72),
    hiOpacity: dark ? 0.55 : 0.9,
    lo: dark ? mix(ground, '#000000', 0.55) : mix(mid, '#2A1F45', 0.38),
    loOpacity: dark ? 0.75 : 0.55,
    letter: contrast(INK, mid) >= contrast(PAPER, mid) ? INK : PAPER,
    dark,
  }
}

/** The pair a trait set wears, from the palette in use. */
export const pairOf = (t: MarkTraits, list: readonly MarkPair[] = MARK_PAIRS): MarkPair =>
  byMarkId(list, t.pair) ?? byMarkId(MARK_PAIRS, t.pair) ?? (list[0] as MarkPair)
