// Seeding. A Flungie is a pure function of its seed, so nothing here may change what an existing seed gives: see
// BUILDING.md, "Never change a seed's output".

/** FNV-1a over UTF-16 code units, with murmur3's finaliser so close seeds land far apart. */
export function hash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** A small, fast, seeded PRNG: returns a function giving floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeds are trimmed and lower-cased, so an email gives the same Flungie whatever its case. */
export const normalise = (seed: unknown): string => String(seed ?? '').trim().toLowerCase()

export interface Weighted {
  readonly weight?: number
}

/** Picks from a list by weight (1 when unset), with one draw of r. */
export function weighted<T extends Weighted>(r: () => number, list: readonly T[]): T {
  const total = list.reduce((s, x) => s + (x.weight ?? 1), 0)
  let k = r() * total
  for (const x of list) {
    k -= x.weight ?? 1
    if (k < 0) return x
  }
  return list[list.length - 1] as T
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x))
/** Two decimals, as a number: keeps the SVG short. */
export const f = (v: number): number => +v.toFixed(2)
