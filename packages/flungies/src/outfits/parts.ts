/** What every outfit shares: the shape of what it draws, where the eyes are, a clip of the body, shading, a suit's base. */
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'

export interface OutfitDrawn {
  /** Behind the body, as a cape is. */
  back: string
  under: string
  over: string
}

/** Where the face's eyes are, as the face drew them, for a ghost's eye holes. */
export interface EyesAt {
  x: number
  y: number
  s: number
  r: number
}

const NOTHING: OutfitDrawn = { back: '', under: '', over: '' }

/** The shading every garment shares: light from above, a little shadow at the bottom. Added once per drawing. */
export function shading(id: string, defs: string[]): string {
  const shade = `${id}os`
  defs.push(`<linearGradient id="${shade}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.2"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#1A1426" stop-opacity="0.24"/></linearGradient>`)
  return shade
}

/** A clip of the body, and of the tail too when `tail` is set. */
export function clipOf(G: Geometry, id: string, defs: string[], tail: boolean): string {
  const clip = `${id}o${tail ? 't' : 'b'}`
  defs.push(`<clipPath id="${clip}"><path d="${G.bodyD}"/>${tail ? `<path d="${G.tailD}"/>` : ''}</clipPath>`)
  return clip
}

/** A neckline across the body at `top`: dipping a little in the middle, as a jumper's does. */
export const neckline = (G: Geometry, top: number, dip: number) => {
  const w = G.hw + 4
  return { w, d: `M${f(-w)} ${f(top - dip * 0.6)}Q0 ${f(top + dip)} ${f(w)} ${f(top - dip * 0.6)}` }
}


/** A suit from the chin over the rest of the body and the tail, in one colour, for the outfits below to draw on. */
export function suitBase(G: Geometry, id: string, defs: string[], top: number, fill: string): { clip: string; shade: string; w: number; bottom: number; base: string } {
  const clip = clipOf(G, id, defs, true)
  const shade = shading(id, defs)
  const w = G.hw + 5
  const bottom = G.tip[1] + 4
  return { clip, shade, w, bottom, base: `<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="${fill}"/>` }
}

/** A rocking turn about x, y, out to `deg` and back, every `seconds`; nothing when still. */
export const rock = (animate: boolean, x: number, y: number, deg: number, seconds: number, begin = 0) =>
  animate
    ? `<animateTransform attributeName="transform" type="rotate" values="0 ${f(x)} ${f(y)};${f(deg)} ${f(x)} ${f(y)};0 ${f(x)} ${f(y)}" dur="${f(seconds)}s" begin="${f(begin)}s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>`
    : ''

/** A suit with a paler belly, and any marks (stripes, spots) under the belly: the base of the animal onesies. */
export function onesie(G: Geometry, id: string, defs: string[], chin: number, look: { base: string; belly: string; marks?: string }): string {
  const top = Math.max(G.hh * 0.24, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, look.base)
  const belly = `<ellipse cx="${f(G.hw * 0.08)}" cy="${f(G.hh * 0.95)}" rx="${f(G.hw * 0.56)}" ry="${f(Math.max(4, G.hh - top) * 0.9)}" fill="${look.belly}"/>`
  const sheen = `<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`
  // A soft hem along the top, a shade darker, so the suit reads as one.
  const hem = `<path d="M${f(-w)} ${f(top)}H${f(w)}" stroke="#000000" stroke-width="1.2" opacity="0.12"/>`
  return `<g class="fl-outfit" clip-path="url(#${clip})">${base}${look.marks ?? ''}${belly}${hem}${sheen}</g>`
}
