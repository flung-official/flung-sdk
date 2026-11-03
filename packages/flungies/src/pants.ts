/**
 * How each pair of pants (PANTS) is drawn: the bottom of the body and the whole tail, the spike of the speech bubble, in a
 * garment of its own colours, with a waistband and its pattern. A seed never picks a pair, so a new one is an entry in PANTS
 * and one here, and no one's drawing changes. In the body's frame; nothing under 32 px.
 */
import type { Geometry } from './geometry.js'
import { f } from './random.js'

type Detail = 'stripes' | 'polka' | 'jeans' | 'plaid' | 'tutu' | 'gold'

const LOOKS: Readonly<Record<string, { base: string; trim: string; detail?: Detail }>> = {
  shorts: { base: '#FF7E6E', trim: '#C94E43' },
  stripes: { base: '#FFFFFF', trim: '#2B3A8C', detail: 'stripes' },
  polka: { base: '#86C0FF', trim: '#3F7EDB', detail: 'polka' },
  jeans: { base: '#4A6FB5', trim: '#2F4C87', detail: 'jeans' },
  plaid: { base: '#C9453B', trim: '#7E2A25', detail: 'plaid' },
  tutu: { base: '#FFB3CC', trim: '#FF7FA8', detail: 'tutu' },
  gold: { base: '#F5BC3C', trim: '#B9800F', detail: 'gold' },
}

/** How far down the body the waistband sits, as a share of the half height. */
const WAIST = 0.68

/** Pants in the body's frame, with their clip and shading added to `defs`, or nothing. `animate` sweeps the gold's sheen. */
export function pants(kind: string, G: Geometry, id: string, defs: string[], detail: number, animate: boolean): string {
  const look = LOOKS[kind]
  if (look === undefined || detail === 0) return ''
  const top = G.hh * WAIST
  const bottom = G.tip[1] + 4
  const left = -G.hw - 4
  const width = G.hw * 2 + 8
  const height = bottom - top
  defs.push(
    `<clipPath id="${id}p"><path d="${G.bodyD}"/><path d="${G.tailD}"/></clipPath>` +
      `<linearGradient id="${id}ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#1A1426" stop-opacity="0.22"/></linearGradient>`,
  )
  const inside: string[] = [`<rect x="${f(left)}" y="${f(top)}" width="${f(width)}" height="${f(height)}" fill="${look.base}"/>`]
  const rows = (step: number) => Array.from({ length: Math.ceil(height / step) + 1 }, (_, i) => top + 3 + i * step)
  const cols = (step: number) => Array.from({ length: Math.ceil(width / step) + 1 }, (_, i) => left + i * step)
  switch (look.detail) {
    case 'stripes':
      for (const y of rows(3.2)) inside.push(`<rect x="${f(left)}" y="${f(y)}" width="${f(width)}" height="1.5" fill="${look.trim}"/>`)
      break
    case 'polka':
      rows(3.6).forEach((y, row) => {
        for (const x of cols(4)) inside.push(`<circle cx="${f(x + (row % 2) * 2)}" cy="${f(y)}" r="0.95" fill="#FFFFFF"/>`)
      })
      break
    case 'jeans':
      inside.push(
        `<path d="M${f(left)} ${f(top + 3)}H${f(left + width)}" stroke="#F5BC3C" stroke-width="0.45" stroke-dasharray="1 0.8"/>`,
        `<path d="M${f(G.tip[0] * 0.5)} ${f(top + 2)}L${f(G.tip[0])} ${f(bottom)}" stroke="${look.trim}" stroke-width="0.6"/>`,
        `<circle cx="${f(G.hw * 0.35)}" cy="${f(top + 4.2)}" r="0.55" fill="#F5BC3C"/>`,
      )
      break
    case 'plaid':
      for (const y of rows(4)) inside.push(`<rect x="${f(left)}" y="${f(y)}" width="${f(width)}" height="1.4" fill="#1A1426" opacity="0.28"/>`)
      for (const x of cols(4)) inside.push(`<rect x="${f(x)}" y="${f(top)}" width="1.4" height="${f(height)}" fill="#1A1426" opacity="0.22"/>`)
      for (const y of rows(4)) inside.push(`<rect x="${f(left)}" y="${f(y + 2.1)}" width="${f(width)}" height="0.4" fill="#FFD66E" opacity="0.7"/>`)
      break
    case 'gold':
      inside.push(
        `<rect x="${f(left)}" y="${f(top)}" width="5" height="${f(height)}" fill="#FFFFFF" opacity="0.4" transform="skewX(-20)">` +
          (animate ? `<animate attributeName="x" values="${f(left - 8)};${f(left + width + 8)}" dur="2.6s" repeatCount="indefinite"/>` : '') +
          `</rect>`,
      )
      for (const [dx, dy] of [
        [-0.3, 0.3],
        [0.35, 0.55],
        [0.05, 0.85],
      ] as const) {
        const x = G.hw * dx
        const y = top + height * dy * 0.6
        inside.push(`<path d="M${f(x)} ${f(y - 1.2)}L${f(x + 0.35)} ${f(y - 0.35)}L${f(x + 1.2)} ${f(y)}L${f(x + 0.35)} ${f(y + 0.35)}L${f(x)} ${f(y + 1.2)}L${f(x - 0.35)} ${f(y + 0.35)}L${f(x - 1.2)} ${f(y)}L${f(x - 0.35)} ${f(y - 0.35)}Z" fill="#FFFFFF" opacity="0.85"/>`)
      }
      break
    default:
      break
  }
  inside.push(`<rect x="${f(left)}" y="${f(top)}" width="${f(width)}" height="1.9" fill="${look.trim}"/>`)
  inside.push(`<rect x="${f(left)}" y="${f(top)}" width="${f(width)}" height="${f(height)}" fill="url(#${id}ps)"/>`)
  let out = `<g class="fl-pants" clip-path="url(#${id}p)">${inside.join('')}</g>`
  if (look.detail === 'tutu') {
    // A tutu flares past the body: scallops along the waist, a little wider than the body each side.
    const y = top + 1.2
    const half = G.edgeX(Math.min(y, G.hh * 0.98)) + 2.4
    const count = Math.max(6, Math.round((half * 2) / 3.4))
    const step = (half * 2) / count
    let d = `M${f(-half)} ${f(y)}`
    for (let i = 0; i < count; i++) d += `Q${f(-half + step * (i + 0.5))} ${f(y + 4.2)} ${f(-half + step * (i + 1))} ${f(y)}`
    out += `<path class="fl-tutu" d="${d}Z" fill="${look.trim}" opacity="0.92"/><path d="M${f(-half)} ${f(y)}H${f(half)}" stroke="#FFFFFF" stroke-width="0.6" opacity="0.7"/>`
  }
  return out
}
