/**
 * What goes on the face itself: piercings (PIERCINGS) and face tattoos (FACE_TATTOOS). Both hang from where the eyes and the
 * mouth are, so they sit clear of every hat, pair of glasses, outfit and pair of pants, and can be worn with any of them. A
 * face tattoo is in the skin, under everything worn; a piercing is over the face and under an outfit that covers it. A seed
 * never picks one, so a new one is an entry in its table (data.ts) and one here, and no one's drawing changes. Drawn from 32 px.
 */
import { luminance, mix } from './colour.js'
import { WHITE } from './data.js'
import { f } from './random.js'
import type { Shading } from './traits.js'

/** Where the face is, in the body's frame: the eyes' centre and spread, their size, and the mouth. */
export interface FaceAt {
  x: number
  y: number
  s: number
  r: number
}

/** The face ink on a body: light on a dark one, a near-black blue on the rest, strong enough to read at shelf size. */
export const inkOn = (P: Shading): string => (luminance(P.base) < 0.1 ? mix(P.base, WHITE, 0.72) : mix(P.base, '#0E1030', 0.9))

/** How much bigger than a body tattoo's line the face's metal and marks are drawn, so they read at shelf size. */
const K = 1.7

/** `inner` grown by K around its own anchor. */
const grown = (x: number, y: number, inner: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${K}) translate(${f(-x)} ${f(-y)})">${inner}</g>`

const METALS = {
  silver: { fill: '#E3E7EF', edge: '#7D869A' },
  gold: { fill: '#F2C553', edge: '#A4731F' },
  rose: { fill: '#F2B3A0', edge: '#A8604C' },
} as const
type Metal = keyof typeof METALS
const GEM = { fill: '#FF5C9A', edge: '#A3245A', glint: '#FFFFFF' }

const stud = (x: number, y: number, r: number, metal: Metal) => grown(x, y, studAt(x, y, r, metal))
const studAt = (x: number, y: number, r: number, metal: Metal) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${METALS[metal].fill}" stroke="${METALS[metal].edge}" stroke-width="0.4"/>` +
  `<circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.32)}" fill="#FFFFFF" opacity="0.85"/>`

const gem = (x: number, y: number, r: number) => grown(x, y, gemAt(x, y, r))
const gemAt = (x: number, y: number, r: number) =>
  `<path d="M${f(x)} ${f(y - r)}L${f(x + r)} ${f(y)}L${f(x)} ${f(y + r)}L${f(x - r)} ${f(y)}Z" fill="${GEM.fill}" stroke="${GEM.edge}" stroke-width="0.35" stroke-linejoin="round"/>` +
  `<circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.28)}" fill="${GEM.glint}"/>`

/** A hoop through a point, hanging below it: most of a ring, its gap at the top where it goes through. */
const hoop = (x: number, y: number, r: number, metal: Metal) => grown(x, y, hoopAt(x, y, r, metal))
const hoopAt = (x: number, y: number, r: number, metal: Metal) =>
  `<path d="M${f(x - r * 0.45)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x + r * 0.45)} ${f(y)}" fill="none" stroke="${METALS[metal].edge}" stroke-width="1.25" stroke-linecap="round"/>` +
  `<path d="M${f(x - r * 0.45)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x + r * 0.45)} ${f(y)}" fill="none" stroke="${METALS[metal].fill}" stroke-width="0.6" stroke-linecap="round"/>`

/** A bar between two balls, for a brow or a bridge. */
const bar = (x1: number, y1: number, x2: number, y2: number, metal: Metal) =>
  `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${METALS[metal].edge}" stroke-width="${f(0.8 * K)}" stroke-linecap="round"/>` +
  stud(x1, y1, 0.85, metal) +
  stud(x2, y2, 0.85, metal)

/** Each piercing: where it goes on a face. `back` and `front` are the eyes, `mx`, `my` the middle of the mouth. */
const PIERCING_ART: Readonly<Record<string, (at: { back: number; front: number; ey: number; R: number; mx: number; my: number }) => string>> = {
  noseStud: ({ front, ey, R, mx }) => stud((mx + front) / 2 - 0.4, ey + R * 1.05, 0.75, 'silver'),
  noseRing: ({ front, ey, R, mx }) => hoop((mx + front) / 2 - 0.4, ey + R * 1.05, 1.15, 'gold'),
  septum: ({ ey, R, mx, my }) => hoop(mx, Math.min(ey + R * 1.25, my - 1.9), 1.05, 'silver'),
  browBar: ({ front, ey, R }) => bar(front + R * 0.35, ey - R * 2.15, front + R * 1.25, ey - R * 1.55, 'silver'),
  browRing: ({ front, ey, R }) => hoop(front + R * 1.1, ey - R * 1.7, 1.05, 'gold'),
  lipRing: ({ mx, my }) => hoop(mx + 2.1, my + 0.6, 1.05, 'silver'),
  snakebites: ({ mx, my }) => hoop(mx - 2.2, my + 1.4, 0.95, 'silver') + hoop(mx + 2.2, my + 1.4, 0.95, 'silver'),
  labret: ({ mx, my }) => stud(mx, my + 3.4, 0.8, 'gold'),
  dimples: ({ back, front, ey, R }) => stud(back - 2.4, ey + R + 3.7, 0.75, 'rose') + stud(front + 2.4, ey + R + 3.7, 0.75, 'rose'),
  bridge: ({ back, front, ey, R }) => bar((back + front) / 2 - 1.6, ey - R * 0.2, (back + front) / 2 + 1.6, ey - R * 0.2, 'silver'),
  faceGem: ({ back, front, ey, R }) => gem((back + front) / 2, ey - R * 1.9, 1.15),
}

/** Each face tattoo, in the ink tattoos take. */
const FACE_TATTOO_ART: Readonly<
  Record<
    string,
    (
      at: {
        back: number
        front: number
        ey: number
        R: number
        mx: number
        my: number
      },
      ink: string,
    ) => string
  >
> = {
  freckles: ({ back, front, ey, R }, ink) => {
    const y = ey + R + 1.6
    const dots = [
      [-1.7, 0],
      [0, 0.9],
      [1.6, -0.2],
      [0.4, -0.9],
    ]
    return [back - 2.6, front + 2.6]
      .flatMap((cx) => dots.map(([dx, dy]) => `<circle cx="${f(cx + (dx as number))}" cy="${f(y + (dy as number))}" r="0.62" fill="${ink}"/>`))
      .join('')
  },
  heart: ({ front, ey, R }, ink) => {
    const x = front + R * 0.9
    const y = ey + R * 1.75
    return grown(
      x,
      y,
      `<path d="M${f(x)} ${f(y + 1.3)}C${f(x - 1.7)} ${f(y + 0.2)} ${f(x - 1.7)} ${f(y - 1)} ${f(x - 0.9)} ${f(y - 1.2)}C${f(x - 0.4)} ${f(y - 1.4)} ${f(x)} ${f(y - 1.1)} ${f(x)} ${f(y - 0.7)}C${f(x)} ${f(y - 1.1)} ${f(x + 0.4)} ${f(y - 1.4)} ${f(x + 0.9)} ${f(y - 1.2)}C${f(x + 1.7)} ${f(y - 1)} ${f(x + 1.7)} ${f(y + 0.2)} ${f(x)} ${f(y + 1.3)}Z" fill="${ink}"/>`,
    )
  },
  star: ({ front, ey, R }, ink) => {
    const x = front + R * 0.95
    const y = ey + R * 1.75
    const points = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 1.6 : 0.7
      const a = ((-90 + i * 36) * Math.PI) / 180
      return `${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`
    })
    return grown(x, y, `<path d="M${points.join('L')}Z" fill="${ink}"/>`)
  },
  teardrop: ({ back, ey, R }, ink) => {
    const x = back - R * 0.25
    const y = ey + R * 2.05
    return grown(
      x,
      y,
      `<path d="M${f(x)} ${f(y - 1.3)}Q${f(x + 1)} ${f(y + 0.2)} ${f(x + 0.8)} ${f(y + 0.6)}A0.85 0.85 0 1 1 ${f(x - 0.8)} ${f(y + 0.6)}Q${f(x - 1)} ${f(y + 0.2)} ${f(x)} ${f(y - 1.3)}Z" fill="none" stroke="${ink}" stroke-width="0.55" stroke-linejoin="round"/>`,
    )
  },
  bolt: ({ front, ey, R }, ink) => {
    const x = front + R * 1.15
    const y = ey + R * 1.3
    return grown(
      x,
      y,
      `<path d="M${f(x + 0.6)} ${f(y - 1.8)}L${f(x - 1)} ${f(y + 0.3)}H${f(x)}L${f(x - 0.6)} ${f(y + 1.9)}L${f(x + 1)} ${f(y - 0.4)}H${f(x)}Z" fill="${ink}"/>`,
    )
  },
  whiskers: ({ back, front, ey, R }, ink) => {
    const y = ey + R + 2.1
    const side = (x: number, dir: number) => [-0.9, 0, 0.9].map((dy) => `M${f(x)} ${f(y + dy * 0.7)}L${f(x + dir * 3.8)} ${f(y + dy * 1.6)}`).join('')
    return `<path d="${side(back - 1.4, -1)}${side(front + 1.4, 1)}" fill="none" stroke="${ink}" stroke-width="0.75" stroke-linecap="round"/>`
  },
  sparkle: ({ front, ey, R }, ink) => {
    const x = front + R * 1.5
    const y = ey - R * 0.9
    const r = 1.5
    const k = 0.32
    return grown(
      x,
      y,
      `<path d="M${f(x)} ${f(y - r)}Q${f(x + r * k)} ${f(y - r * k)} ${f(x + r)} ${f(y)}Q${f(x + r * k)} ${f(y + r * k)} ${f(x)} ${f(y + r)}Q${f(x - r * k)} ${f(y + r * k)} ${f(x - r)} ${f(y)}Q${f(x - r * k)} ${f(y - r * k)} ${f(x)} ${f(y - r)}Z" fill="${ink}"/>`,
    )
  },
  dots: ({ back, ey, R }, ink) => {
    const x = back - R * 0.2
    const y = ey + R * 2.1
    return grown(
      x,
      y,
      [
        [0, -0.8],
        [-0.85, 0.6],
        [0.85, 0.6],
      ]
        .map(([dx, dy]) => `<circle cx="${f(x + (dx as number))}" cy="${f(y + (dy as number))}" r="0.45" fill="${ink}"/>`)
        .join(''),
    )
  },
}

const placesOf = (at: FaceAt) => ({
  back: at.x - at.s,
  front: at.x + at.s,
  ey: at.y,
  R: at.r,
  mx: at.x + 0.6,
  my: at.y + at.r + 3.3,
})

/** A piercing on the face, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0). */
export function piercing(kind: string, at: FaceAt, detail: number): string {
  const art = PIERCING_ART[kind]
  if (art === undefined || detail === 0) return ''
  return `<g class="fl-piercing">${art(placesOf(at))}</g>`
}

/** A face tattoo, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0). */
export function faceTattoo(kind: string, at: FaceAt, P: Shading, detail: number): string {
  const art = FACE_TATTOO_ART[kind]
  if (art === undefined || detail === 0) return ''
  return `<g class="fl-face-tattoo" opacity="0.95">${art(placesOf(at), inkOn(P))}</g>`
}
