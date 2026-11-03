/**
 * How each tattoo (TATTOOS) is drawn: a small mark on the lower back of the body, in an ink that reads on the body's colour.
 * A seed never picks one, so a new tattoo is one entry in TATTOOS and one here, and no one's drawing changes.
 */
import { luminance, mix } from './colour.js'
import { WHITE } from './data.js'
import type { Geometry } from './geometry.js'
import { f } from './random.js'
import type { Shading } from './traits.js'

/** Each tattoo in a 10 unit box around 0,0: `fill` shapes take the ink, `line` paths are stroked with it. */
const TATTOO_ART: Readonly<Record<string, { fill?: string; line?: string; hole?: string }>> = {
  heart: { fill: 'M0 3.8C-4.8 0.7 -5 -2.6 -2.7 -3.7C-1.3 -4.3 -0.2 -3.5 0 -2.4C0.2 -3.5 1.3 -4.3 2.7 -3.7C5 -2.6 4.8 0.7 0 3.8Z' },
  star: {
    fill: `M${Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 4.6 : 2
      const a = ((-90 + i * 36) * Math.PI) / 180
      return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r + 0.4)}`
    }).join('L')}Z`,
  },
  bolt: { fill: 'M1.3 -4.8L-2.9 0.7H-0.1L-1.3 4.8L2.9 -0.9H0.1Z' },
  flower: {
    fill: [0, 72, 144, 216, 288]
      .map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180
        const x = Math.cos(a) * 2.5
        const y = Math.sin(a) * 2.5
        return `M${f(x + 1.9)} ${f(y)}A1.9 1.9 0 1 0 ${f(x - 1.9)} ${f(y)}A1.9 1.9 0 1 0 ${f(x + 1.9)} ${f(y)}Z`
      })
      .join(''),
    hole: 'M1.2 0A1.2 1.2 0 1 0 -1.2 0A1.2 1.2 0 1 0 1.2 0Z',
  },
  note: { fill: 'M-0.2 2.9A2 1.5 -20 1 1 -4.1 3.6A2 1.5 -20 1 1 -0.2 2.9Z', line: 'M-0.3 3V-4.4Q2.4 -3.6 3 -1' },
  flame: { fill: 'M0 -4.8C3 -2 3.6 0.6 2.8 2.5C1.9 4.5 -1.9 4.5 -2.8 2.5C-3.6 0.7 -2.2 -0.7 -1.1 -2.1C-0.7 -0.9 0 -0.3 0.7 -0.5C1.1 -2 0.7 -3.4 0 -4.8Z' },
  anchor: { line: 'M0 -2.6V4.2M-2 -1.2H2M-3.6 1.4Q-3 4.2 0 4.2Q3 4.2 3.6 1.4', hole: 'M1 -3.6A1 1 0 1 0 -1 -3.6A1 1 0 1 0 1 -3.6Z' },
}

/** A tattoo in the body's frame, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0). */
export function tattoo(kind: string, G: Geometry, P: Shading, detail: number): string {
  const art = TATTOO_ART[kind]
  if (art === undefined || detail === 0) return ''
  const ink = luminance(P.base) < 0.1 ? mix(P.base, WHITE, 0.6) : mix(P.base, '#1E2350', 0.78)
  const parts: string[] = []
  if (art.fill) parts.push(`<path d="${art.fill}" fill="${ink}"/>`)
  if (art.line) parts.push(`<path d="${art.line}" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`)
  // A flower's middle is the body showing through; the anchor's eye is a ring.
  if (art.hole) parts.push(art.fill ? `<path d="${art.hole}" fill="${P.light}"/>` : `<path d="${art.hole}" fill="none" stroke="${ink}" stroke-width="1.1"/>`)
  return `<g class="fl-tattoo" opacity="0.9" transform="translate(${f(-G.hw * 0.4)} ${f(G.hh * 0.42)}) rotate(-12) scale(0.92)">${parts.join('')}</g>`
}
