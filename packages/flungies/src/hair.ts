/**
 * How each hairdo (HAIRS) is drawn: a little felt on the head, the body's own colour a shade deeper, so it reads as part of the
 * same plush toy on any body. It is drawn over the body and under the face, the hats and the glasses. Under a hat only what
 * peeks out shows: a fringe, pigtails, the curls at the sides. A seed never picks one, so a new one is an entry in HAIRS and
 * one here, and no one's drawing changes.
 */
import { luminance, mix } from './colour.js'
import type { Geometry } from './geometry.js'
import { f } from './random.js'
import type { Shading } from './traits.js'

interface HairInk {
  base: string
  light: string
  deep: string
}

/** The hair's felt on a body: a shade deeper on a light body, a shade lighter on a dark one. */
function hairOn(P: Shading): HairInk {
  const dark = luminance(P.base) < 0.1
  const base = dark ? mix(P.base, '#FFFFFF', 0.22) : mix(P.base, '#2A1F45', 0.36)
  return { base, light: mix(base, '#FFFFFF', 0.3), deep: mix(base, '#120F1A', 0.35) }
}

/** A hairdo's parts: `top` sits on the crown of the head (a hat hides it); `side` peeks out under one. */
type HairArt = (G: Geometry, H: HairInk, eye: { x: number; y: number; s: number; r: number }, detail: number) => { top?: string; side?: string }

const RAINBOW = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA']

const HAIR_ART: Readonly<Record<string, HairArt>> = {
  tuft: (G, H, _eye, detail) => {
    const x = G.hw * 0.08
    const y = G.topY(x) + 1.2
    const strand = (dx: number, h: number, lean: number) =>
      `M${f(x + dx - 2.4)} ${f(y)}Q${f(x + dx + lean * 0.3 - 1)} ${f(y - h * 0.6)} ${f(x + dx + lean)} ${f(y - h)}Q${f(x + dx + lean * 0.3 + 1.6)} ${f(y - h * 0.45)} ${f(x + dx + 2.4)} ${f(y)}Z`
    let top = `<path d="${strand(-3.2, 8, -4.6)}${strand(0, 11, 1.4)}${strand(3.2, 7.4, 5.2)}" fill="${H.base}"/>`
    if (detail >= 2)
      top += `<path d="M${f(x - 0.4)} ${f(y - 1)}Q${f(x + 0.2)} ${f(y - 4.6)} ${f(x + 0.9)} ${f(y - 7)}" fill="none" stroke="${H.light}" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>`
    return { top }
  },
  fringe: (G, H, eye, detail) => {
    // Scallops across the forehead, from the back of the head to just past the front eye, stopping above the brows.
    const x1 = -G.hw * 0.5
    const x2 = Math.min(eye.x + eye.s + eye.r * 2.2, G.hw * 0.8)
    const top = (x: number) => G.topY(x) - 0.6
    // A band about 7 units deep under the top outline, never down over the brows.
    const low = (x: number) => Math.min(top(x) + 7, eye.y - eye.r * 1.9)
    const n = 5
    const w = (x2 - x1) / n
    // Scallops along the bottom edge, front to back along the top outline.
    let path = `M${f(x1)} ${f(top(x1) + 1)}`
    for (let i = 0; i < n; i++) {
      const a = x1 + w * i
      const last = i === n - 1
      path += `Q${f(a + w * 0.5)} ${f(low(a + w * 0.5) + 1.6)} ${f(a + w)} ${f(last ? top(x2) + 1 : low(a + w) - 1.6)}`
    }
    for (let i = 0; i <= 12; i++) {
      const x = x2 - ((x2 - x1) * i) / 12
      path += `L${f(x)} ${f(top(x))}`
    }
    path += 'Z'
    let side = `<path d="${path}" fill="${H.base}"/>`
    if (detail >= 2)
      side += `<path d="M${f(x1 + w)} ${f(top(x1 + w) + 2.4)}Q${f(x1 + w * 1.6)} ${f(top(x1 + w * 1.6) + 1.4)} ${f(x1 + w * 2.4)} ${f(top(x1 + w * 2.4) + 2)}" fill="none" stroke="${H.light}" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>`
    return { side }
  },
  mohawk: (G, H, _eye, detail) => {
    // A ridge of spikes over the top, from the back to the front.
    const spikes: string[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      const x = -G.hw * 0.5 + u * G.hw * 0.95
      const y = G.topY(x) + 1.4
      const h = 4.6 + Math.sin(u * Math.PI) * 3.2
      spikes.push(`M${f(x - 2.4)} ${f(y)}L${f(x + 0.6)} ${f(y - h)}L${f(x + 2.4)} ${f(y)}Z`)
    }
    let top = `<path d="${spikes.join('')}" fill="${H.base}" stroke="${H.deep}" stroke-width="0.5" stroke-linejoin="round"/>`
    if (detail >= 2)
      top += `<path d="M${f(-G.hw * 0.42)} ${f(G.topY(0) - 1)}Q0 ${f(G.topY(0) - 3)} ${f(G.hw * 0.4)} ${f(G.topY(0) - 1)}" fill="none" stroke="${H.light}" stroke-width="0.6" opacity="0.55"/>`
    return { top }
  },
  curls: (G, H, _eye, detail) => {
    const curl = (x: number, y: number, r: number) =>
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${H.base}"/>` +
      (detail >= 2
        ? `<path d="M${f(x - r * 0.4)} ${f(y - r * 0.1)}A${f(r * 0.45)} ${f(r * 0.45)} 0 1 1 ${f(x + r * 0.2)} ${f(y + r * 0.35)}" fill="none" stroke="${H.light}" stroke-width="0.55" opacity="0.75"/>`
        : '')
    const crown: string[] = []
    for (let i = 0; i < 6; i++) {
      const u = i / 5
      const x = -G.hw * 0.62 + u * G.hw * 1.15
      crown.push(curl(x, G.topY(x) + 0.8 - Math.sin(u * Math.PI) * 1.6, 3.1 + Math.sin(u * Math.PI) * 0.6))
    }
    const sx = -G.edgeX(-G.hh * 0.55)
    const side = curl(sx + 0.8, -G.hh * 0.55, 2.7) + curl(sx + 0.2, -G.hh * 0.3, 2.3)
    return { top: crown.join(''), side }
  },
  bun: (G, H, _eye, detail) => {
    const x = -G.hw * 0.08
    const y = G.topY(x) - 3.6
    let top = `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${H.base}"/><path d="M${f(x - 5.4)} ${f(y + 4.4)}Q${f(x)} ${f(y + 6.6)} ${f(x + 5.4)} ${f(y + 4.4)}" fill="none" stroke="#FF8FA8" stroke-width="2" stroke-linecap="round"/>`
    if (detail >= 2)
      top += `<path d="M${f(x - 2.6)} ${f(y - 1)}A3 3 0 0 1 ${f(x + 1)} ${f(y - 3.4)}" fill="none" stroke="${H.light}" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>`
    return { top }
  },
  pigtails: (G, H, _eye, detail) => {
    const y = -G.hh * 0.42
    const tail = (dir: number) => {
      const x = dir * G.edgeX(y)
      const tip = x + dir * 6.4
      let s = `<path d="M${f(x)} ${f(y - 2.4)}Q${f(tip + dir * 1.6)} ${f(y - 4.4)} ${f(tip)} ${f(y + 4.6)}Q${f(x + dir * 3.6)} ${f(y + 2.4)} ${f(x)} ${f(y + 1.6)}Z" fill="${H.base}"/>`
      s += `<circle cx="${f(x + dir * 0.6)}" cy="${f(y - 0.4)}" r="1.5" fill="#FF8FA8"/>`
      if (detail >= 2)
        s += `<path d="M${f(x + dir * 2)} ${f(y - 1.6)}Q${f(tip)} ${f(y - 2.2)} ${f(tip - dir * 0.4)} ${f(y + 2.4)}" fill="none" stroke="${H.light}" stroke-width="0.55" opacity="0.7"/>`
      return s
    }
    return { side: tail(-1) + tail(1) }
  },
  rainbow: (G, _H, _eye, detail) => {
    // The earned crest: a mohawk in six colours.
    const spikes: string[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      const x = -G.hw * 0.5 + u * G.hw * 0.95
      const y = G.topY(x) + 1.4
      const h = 5 + Math.sin(u * Math.PI) * 3.6
      spikes.push(
        `<path d="M${f(x - 2.5)} ${f(y)}L${f(x + 0.6)} ${f(y - h)}L${f(x + 2.5)} ${f(y)}Z" fill="${RAINBOW[i]}" stroke="#FFFFFF" stroke-width="0.4" stroke-linejoin="round"/>`,
      )
    }
    if (detail >= 2)
      spikes.push(
        `<path d="M${f(-G.hw * 0.2)} ${f(G.topY(0) - 6)}l0.6 1.2 1.3 0.2 -1 0.9 0.3 1.3 -1.2 -0.7 -1.2 0.7 0.3 -1.3 -1 -0.9 1.3 -0.2Z" fill="#FFFFFF" opacity="0.9"/>`,
      )
    return { top: spikes.join('') }
  },
}

/**
 * A hairdo on the head, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0). `covered`: something on the
 * head (a hat, a crown, headphones) hides its top, so only what peeks out is drawn.
 */
export function hair(kind: string, G: Geometry, P: Shading, eye: { x: number; y: number; s: number; r: number }, detail: number, covered: boolean): string {
  const art = HAIR_ART[kind]
  if (art === undefined || detail === 0) return ''
  const parts = art(G, hairOn(P), eye, detail)
  const shown = (covered ? '' : (parts.top ?? '')) + (parts.side ?? '')
  return shown === '' ? '' : `<g class="fl-hair">${shown}</g>`
}
