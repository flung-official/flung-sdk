/**
 * How each body pattern (PATTERNS) is drawn: a print on the felt, clipped to the body and its tail, in the skin: under tattoos,
 * pants, outfits, the face and every accessory. Prints that scatter (spots, stars, hearts) keep clear of the face, so the eyes
 * always read. A seed never picks one, so a new one is an entry in PATTERNS and one here, and no one's drawing changes.
 */
import { luminance, mix } from './colour.js'
import type { Geometry } from './geometry.js'
import { f, mulberry32 } from './random.js'
import type { Shading } from './traits.js'

type Face = { x: number; y: number; s: number; r: number }

/** The print's ink on a body: lighter on a dark or mid body, deeper on a pale one. */
const printOn = (P: Shading): string => (luminance(P.base) < 0.45 ? mix(P.base, '#FFFFFF', 0.42) : mix(P.base, '#2A1F45', 0.3))

/** Points spread over the body, the same for every Flungie of a shape, none on the face. */
function scatter(G: Geometry, face: Face, count: number, salt: number): { x: number; y: number; k: number }[] {
  const rnd = mulberry32(salt)
  const out: { x: number; y: number; k: number }[] = []
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    const x = (rnd() * 2 - 1) * G.hw * 0.92
    const y = (rnd() * 2 - 1) * G.hh * 0.92
    if (Math.abs(x) > G.edgeX(y) - 1.5) continue
    const onFace = x > face.x - face.s - face.r * 2.4 && x < face.x + face.s + face.r * 2.4 && y > face.y - face.r * 2.6 && y < face.y + face.r + 5.2
    if (onFace) continue
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < 6.2)) continue
    out.push({ x, y, k: 0.75 + rnd() * 0.5 })
  }
  return out
}

const heartPath = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y + r)}C${f(x - r * 1.5)} ${f(y)} ${f(x - r * 1.2)} ${f(y - r * 1.1)} ${f(x - r * 0.6)} ${f(y - r * 1.05)}C${f(x - r * 0.25)} ${f(y - r * 1.05)} ${f(x)} ${f(y - r * 0.75)} ${f(x)} ${f(y - r * 0.45)}C${f(x)} ${f(y - r * 0.75)} ${f(x + r * 0.25)} ${f(y - r * 1.05)} ${f(x + r * 0.6)} ${f(y - r * 1.05)}C${f(x + r * 1.2)} ${f(y - r * 1.1)} ${f(x + r * 1.5)} ${f(y)} ${f(x)} ${f(y + r)}Z`

const starPath = (x: number, y: number, r: number, points = 5, inner = 0.45) =>
  `M${Array.from({ length: points * 2 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * inner
    const a = ((-90 + (i * 180) / points) * Math.PI) / 180
    return `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`
  }).join('L')}Z`

type PatternArt = (ctx: { G: Geometry; P: Shading; ink: string; face: Face; id: string; defs: string[]; detail: number }) => string

const PATTERN_ART: Readonly<Record<string, PatternArt>> = {
  spots: ({ G, ink, face }) =>
    scatter(G, face, 7, 101)
      .map(
        (p) =>
          `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(3.4 * p.k)}" ry="${f(2.7 * p.k)}" transform="rotate(${f(p.k * 60 - 30)} ${f(p.x)} ${f(p.y)})" fill="${ink}" opacity="0.85"/>`,
      )
      .join(''),
  stripes: ({ G, ink }) => {
    const out: string[] = []
    const span = G.hw + G.hh + 12
    for (let x = -span; x <= span; x += 7.4) out.push(`M${f(x)} ${f(-G.hh - 12)}l${f(G.hh * 0.6 + 7)} ${f(G.hh * 2 + 24)}`)
    return `<path d="${out.join('')}" fill="none" stroke="${ink}" stroke-width="2.9" opacity="0.55"/>`
  },
  speckles: ({ G, ink, face }) =>
    [...scatter(G, face, 22, 202), ...scatter(G, face, 16, 203)]
      .map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(0.55 * p.k + 0.25)}" fill="${ink}" opacity="0.9"/>`)
      .join(''),
  ombre: ({ G, P, id, defs }) => {
    // A sunset: gold coming up to a warm pink at the bottom, the same on every body.
    const warm = luminance(P.base) < 0.1 ? '#FF7EB6' : mix(P.base, '#FF5C8A', 0.7)
    const gold = '#FFC15E'
    defs.push(
      `<linearGradient id="${id}om" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="${gold}" stop-opacity="0"/><stop offset="0.68" stop-color="${gold}" stop-opacity="0.6"/><stop offset="1" stop-color="${warm}" stop-opacity="0.95"/></linearGradient>`,
    )
    return `<rect x="${f(-G.hw - 12)}" y="${f(-G.hh - 2)}" width="${f(G.hw * 2 + 24)}" height="${f(G.hh * 2 + 18)}" fill="url(#${id}om)"/>`
  },
  stars: ({ G, ink, face }) =>
    scatter(G, face, 7, 303)
      .map((p) => `<path d="${starPath(p.x, p.y, 3.3 * p.k)}" fill="${ink}" stroke="${ink}" stroke-width="0.5" stroke-linejoin="round"/>`)
      .join(''),
  hearts: ({ G, ink, face }) =>
    scatter(G, face, 7, 404)
      .map((p) => `<path d="${heartPath(p.x, p.y, 2.6 * p.k)}" fill="${ink}"/>`)
      .join(''),
  galaxy: ({ G, face, id, defs, detail }) => {
    // The earned print: a night sky over the felt, with a nebula and stars.
    defs.push(
      `<radialGradient id="${id}gx" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#C77DFF" stop-opacity="0.75"/><stop offset="0.45" stop-color="#5A3FC0" stop-opacity="0.8"/><stop offset="1" stop-color="#1B1640" stop-opacity="0.92"/></radialGradient>`,
    )
    const stars = scatter(G, face, detail >= 2 ? 18 : 9, 505)
      .map((p, i) =>
        i % 4 === 0
          ? `<path d="${starPath(p.x, p.y, 1.5 * p.k, 4, 0.3)}" fill="#FFFFFF"/>`
          : `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(0.45 * p.k)}" fill="#FFFFFF" opacity="0.9"/>`,
      )
      .join('')
    return `<rect x="${f(-G.hw - 12)}" y="${f(-G.hh - 2)}" width="${f(G.hw * 2 + 24)}" height="${f(G.hh * 2 + 18)}" fill="url(#${id}gx)"/>${stars}`
  },
}

/** A pattern on the body, clipped to it, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0). */
export function pattern(kind: string, G: Geometry, P: Shading, face: Face, id: string, defs: string[], detail: number): string {
  const art = PATTERN_ART[kind]
  if (art === undefined || detail === 0) return ''
  defs.push(`<clipPath id="${id}pt"><path d="${G.tailD}"/><path d="${G.bodyD}"/></clipPath>`)
  return `<g class="fl-pattern" clip-path="url(#${id}pt)">${art({ G, P, ink: printOn(P), face, id, defs, detail })}</g>`
}
