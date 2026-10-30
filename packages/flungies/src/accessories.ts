// Accessories. Each returns { back, front } SVG in the body frame: back is drawn under the body, front over the face.

import { mix } from './colour.js'
import type { Geometry } from './geometry.js'
import { f } from './random.js'
import type { AccShading, Shading, Traits } from './traits.js'

export interface DrawContext {
  G: Geometry
  P: Shading
  A: AccShading
  A2: AccShading | null
  /** 0 under 32 px, 1 under 64 px, 2 from 64 px. */
  detail: number
  /** A stroke width in units, never thinner than minPx pixels. */
  sw: (u: number, minPx?: number) => number
  id: string
  defs: string[]
  t: Traits
  eyeR: number
  eyeAt: { x: number; y: number; s: number; eyes: string }
}

export interface Drawn {
  back?: string
  front?: string
}

export const ACC_DRAW: Readonly<Record<string, (ctx: DrawContext) => Drawn>> = {
  headphones({ G, A, detail, sw }) {
    const y0 = -G.hh * 0.06
    const xr = G.edgeX(y0)
    const T = -G.hh
    const band = `M${f(-xr - 0.6)} ${f(y0 - 4)}C${f(-xr - 1.8)} ${f(T - 14)} ${f(xr + 1.8)} ${f(T - 14)} ${f(xr + 0.6)} ${f(y0 - 4)}`
    const cup = (x: number, dir: number) =>
      `<rect x="${f(x - 3.7)}" y="${f(y0 - 7.2)}" width="7.4" height="14.4" rx="3.5" fill="${A.base}"/>` +
      `<rect x="${f(x - 3.7 + (dir < 0 ? 4.2 : 0))}" y="${f(y0 - 5.6)}" width="3.2" height="11.2" rx="1.6" fill="${A.shade}"/>` +
      (detail >= 2 ? `<rect x="${f(x - 1.8 + (dir < 0 ? -0.4 : 1.6))}" y="${f(y0 - 4.6)}" width="1" height="5" rx="0.5" fill="${A.light}" opacity="0.7"/>` : '')
    return {
      front:
        `<path d="${band}" fill="none" stroke="${A.base}" stroke-width="${sw(3.4)}" stroke-linecap="round"/>` +
        (detail >= 1 ? `<path d="${band}" fill="none" stroke="${A.light}" stroke-width="${sw(1)}" stroke-linecap="round" opacity="0.55" transform="translate(0 -0.6)"/>` : '') +
        cup(-xr, -1) +
        cup(xr, 1),
    }
  },
  beanie({ G, A, A2, detail, sw }) {
    const T = -G.hh
    const bw = G.edgeX(T + 5) * 0.96 + 1.2
    let s = `<path d="M${f(-bw * 0.95)} ${f(T + 5)}C${f(-bw * 0.98)} ${f(T - 13.5)} ${f(bw * 0.98)} ${f(T - 13.5)} ${f(bw * 0.95)} ${f(T + 5)}Z" fill="${A.base}"/>`
    if (detail >= 1) for (let i = -2; i <= 2; i++) s += `<path d="M${f(i * bw * 0.32)} ${f(T + 3)}Q${f(i * bw * 0.26)} ${f(T - 4)} ${f(i * bw * 0.1)} ${f(T - 8.6)}" fill="none" stroke="${A.shade}" stroke-width="${sw(0.9)}" opacity="0.45"/>`
    s += `<rect x="${f(-bw - 0.6)}" y="${f(T + 1.6)}" width="${f(bw * 2 + 1.2)}" height="7.2" rx="3.6" fill="${A.shade}"/>`
    if (detail >= 2) for (let x = -bw + 2; x < bw - 1; x += 2.6) s += `<path d="M${f(x)} ${f(T + 3)}V${f(T + 7.4)}" stroke="${A.base}" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>`
    const pc = A2 || A
    s += `<circle cx="${f(bw * 0.08)}" cy="${f(T - 11.8)}" r="4.4" fill="${pc.base}"/>`
    if (detail >= 2) s += `<circle cx="${f(bw * 0.08 - 1.5)}" cy="${f(T - 13.2)}" r="1.6" fill="${pc.light}" opacity="0.8"/><circle cx="${f(bw * 0.08 + 1.6)}" cy="${f(T - 10.4)}" r="1.4" fill="${pc.shade}" opacity="0.4"/>`
    return { front: s }
  },
  cap(ctx) {
    return capDraw(ctx, false)
  },
  capBack(ctx) {
    return capDraw(ctx, true)
  },
  sunglasses({ G, A, detail, sw, eyeAt }) {
    const { x, y, s } = eyeAt
    const lw = Math.min(s - 1.1, 6.4)
    const lh = 5.2
    const lens = mix(A.base, '#14121A', 0.72)
    const one = (cx: number) =>
      `<path transform="translate(${f(cx)} ${f(y)})" d="M${f(-lw)} ${f(-lh * 0.5)}Q${f(-lw)} ${f(-lh * 0.75)} ${f(-lw * 0.78)} ${f(-lh * 0.75)}H${f(lw * 0.78)}Q${f(lw)} ${f(-lh * 0.75)} ${f(lw)} ${f(-lh * 0.5)}Q${f(lw)} ${f(lh * 0.9)} 0 ${f(lh * 0.9)}Q${f(-lw)} ${f(lh * 0.9)} ${f(-lw)} ${f(-lh * 0.5)}Z" fill="${lens}" stroke="${A.base}" stroke-width="${sw(1.2)}" stroke-linejoin="round"/>` +
      (detail >= 1 ? `<path d="M${f(cx - lw * 0.55)} ${f(y + lh * 0.2)}L${f(cx - lw * 0.05)} ${f(y - lh * 0.5)}M${f(cx - lw * 0.05)} ${f(y + lh * 0.35)}L${f(cx + lw * 0.3)} ${f(y - 0.1)}" stroke="#FFFFFF" stroke-width="${sw(1.1)}" stroke-linecap="round" opacity="0.55"/>` : '')
    const ex = G.edgeX(y - 2)
    return {
      front:
        `<path d="M${f(x - s - lw)} ${f(y - lh * 0.5)}L${f(-ex)} ${f(y - lh * 0.8)}M${f(x + s + lw)} ${f(y - lh * 0.5)}L${f(ex)} ${f(y - lh * 0.8)}" stroke="${A.base}" stroke-width="${sw(1.3)}" stroke-linecap="round"/>` +
        `<path d="M${f(x - s + lw * 0.9)} ${f(y - lh * 0.45)}Q${f(x)} ${f(y - lh * 1)} ${f(x + s - lw * 0.9)} ${f(y - lh * 0.45)}" fill="none" stroke="${A.base}" stroke-width="${sw(1.5)}" stroke-linecap="round"/>` +
        one(x - s) +
        one(x + s),
    }
  },
  glasses({ G, A, detail, sw, eyeAt, eyeR }) {
    const { x, y, s, eyes } = eyeAt
    const r = Math.min(s - 0.8, Math.max(5, eyeR * (eyes === 'wide' ? 1.38 : 1) + 2.2))
    const ex = G.edgeX(y - 1)
    const st = `fill="none" stroke="${A.base}" stroke-width="${sw(1.35)}" stroke-linecap="round"`
    let out = `<g fill="#FFFFFF" opacity="0.18"><circle cx="${f(x - s)}" cy="${f(y)}" r="${f(r)}"/><circle cx="${f(x + s)}" cy="${f(y)}" r="${f(r)}"/></g>`
    out += `<circle cx="${f(x - s)}" cy="${f(y)}" r="${f(r)}" ${st}/><circle cx="${f(x + s)}" cy="${f(y)}" r="${f(r)}" ${st}/>`
    out += `<path d="M${f(x - s + r)} ${f(y - 0.6)}Q${f(x)} ${f(y - 2.6)} ${f(x + s - r)} ${f(y - 0.6)}M${f(x - s - r)} ${f(y - 1)}L${f(-ex)} ${f(y - 2.4)}M${f(x + s + r)} ${f(y - 1)}L${f(ex)} ${f(y - 2.4)}" ${st}/>`
    if (detail >= 2) out += [x - s, x + s].map((cx) => `<path d="M${f(cx - r * 0.62)} ${f(y - r * 0.2)}A${f(r * 0.66)} ${f(r * 0.66)} 0 0 1 ${f(cx - r * 0.1)} ${f(y - r * 0.64)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.75"/>`).join('')
    return { front: out }
  },
  partyHat({ G, A, A2, detail, sw, t }) {
    const x0 = -G.hw * 0.12 + (t.jitter.acc[0] - 0.5) * 4
    const y0 = G.topY(x0) + 3
    const ang = -8 - t.jitter.acc[1] * 10
    const B = A2 || A
    let s = `<path d="M-8.2 0L-0.6 -21.5Q0 -22.4 0.6 -21.5L8.2 0Q0 3.2 -8.2 0Z" fill="${A.base}"/>`
    if (detail >= 1) s += `<g fill="${B.base}"><circle cx="-3" cy="-4" r="1.6"/><circle cx="3.2" cy="-7.4" r="1.4"/><circle cx="-1" cy="-12.6" r="1.2"/><circle cx="3.6" cy="-1.8" r="1.2"/></g>`
    if (detail >= 2) s += `<path d="M-4.8 -1.6L-1.3 -16" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity="0.35"/>`
    s += `<path d="M-8.6 0.3Q0 3.8 8.6 0.3" fill="none" stroke="${A.shade}" stroke-width="${sw(1.8)}" stroke-linecap="round"/>`
    s += `<circle cx="0" cy="-22" r="3.1" fill="${B.base}"/>`
    return { front: `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(ang)})">${s}</g>` }
  },
  antenna({ G, A, detail, sw, t }) {
    const x0 = G.hw * 0.02 + (t.jitter.acc[0] - 0.5) * 6
    const yb = G.topY(x0) + 1.2
    const bx = x0 + 3
    const by = yb - 14.5
    let s = `<path d="M${f(x0)} ${f(yb)}Q${f(x0 - 1.4)} ${f(yb - 8)} ${f(bx)} ${f(by + 2.5)}" fill="none" stroke="${A.deep}" stroke-width="${sw(1.7, 1)}" stroke-linecap="round"/>`
    s += `<ellipse cx="${f(x0)}" cy="${f(yb)}" rx="2.6" ry="1.4" fill="${A.deep}"/>`
    s += `<circle cx="${f(bx)}" cy="${f(by)}" r="3" fill="${A.base}"/>`
    if (detail >= 1) s += `<circle cx="${f(bx - 1)}" cy="${f(by - 1.1)}" r="1" fill="#FFFFFF" opacity="0.8"/>`
    const arcs = detail === 0 ? [6.2] : [5.8, 9.4]
    arcs.forEach((r, i) => {
      const a = 0.62
      s += `<path d="M${f(bx + r * Math.cos(a))} ${f(by - r * Math.sin(a))}A${r} ${r} 0 0 1 ${f(bx + r * Math.cos(a))} ${f(by + r * Math.sin(a))}" fill="none" stroke="${A.base}" stroke-width="${sw(1.4, 0.95)}" stroke-linecap="round" opacity="${i ? 0.55 : 1}"/>`
    })
    return { front: s }
  },
  bow({ G, A, detail, t }) {
    const x0 = -G.hw * 0.4 + (t.jitter.acc[0] - 0.5) * 3
    const y0 = G.topY(x0) + 0.8
    const loop = (m: number) =>
      `<path d="M0 0C${-3 * m} -6.2 ${-10.6 * m} -6.6 ${-10.2 * m} -0.4C${-10.6 * m} 5.8 ${-3 * m} 5.6 0 0Z" fill="${A.base}"/>` +
      (detail >= 1 ? `<path d="M${-1.6 * m} 0C${-3.4 * m} -3 ${-6.6 * m} -3.4 ${-7.2 * m} -0.6" fill="none" stroke="${A.shade}" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>` : '')
    const s =
      `<path d="M-0.6 1L-4 8.4L-1.8 7.6L-0.8 9.4L1 1.4Z" fill="${A.shade}"/><path d="M0.6 1L3.6 8L1.6 7.6L0.4 9L-0.8 1.4Z" fill="${A.shade}"/>` +
      loop(1) +
      loop(-1) +
      `<ellipse cx="0" cy="0" rx="2.5" ry="3.1" fill="${A.shade}"/>` +
      (detail >= 2 ? `<ellipse cx="-0.6" cy="-0.9" rx="0.8" ry="1" fill="${A.light}" opacity="0.7"/>` : '')
    return { front: `<g transform="translate(${f(x0)} ${f(y0)}) rotate(-16) scale(0.95)">${s}</g>` }
  },
  halo({ G, detail, sw }) {
    // A ring light, floating above the head: warm, with a gold edge so it holds up on pale discs.
    const cy = -G.hh - 8.5
    const rx = G.hw * 0.58
    const ry = 4.2
    let s = `<ellipse cx="2" cy="${f(cy)}" rx="${f(rx)}" ry="${ry}" fill="none" stroke="#FFE9A6" stroke-width="7" opacity="${detail >= 1 ? 0.35 : 0}"/>`
    s += `<ellipse cx="2" cy="${f(cy)}" rx="${f(rx)}" ry="${ry}" fill="none" stroke="#D99A1E" stroke-width="${sw(4)}"/>`
    s += `<ellipse cx="2" cy="${f(cy)}" rx="${f(rx)}" ry="${ry}" fill="none" stroke="#FFF6D6" stroke-width="${sw(2.4, 0.5)}"/>`
    if (detail >= 2) s += `<ellipse cx="2" cy="${f(cy)}" rx="${f(rx)}" ry="${ry}" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="0.01 2.9" stroke-linecap="round"/>`
    return { front: s }
  },
  crown({ G, A, detail, sw, t }) {
    const x0 = G.hw * 0.06 + (t.jitter.acc[0] - 0.5) * 4
    const y0 = G.topY(x0) + 2.6
    const edge = A.deep
    let s = `<path d="M-8 0L-8.8 -9L-4.2 -4.4L0 -11L4.2 -4.4L8.8 -9L8 0Q0 1.8 -8 0Z" fill="${A.base}" stroke="${edge}" stroke-width="${sw(0.8)}" stroke-linejoin="round"/>`
    s += `<g fill="${A.base}" stroke="${edge}" stroke-width="${sw(0.6)}"><circle cx="-8.8" cy="-9.4" r="1.35"/><circle cx="0" cy="-11.5" r="1.5"/><circle cx="8.8" cy="-9.4" r="1.35"/></g>`
    if (detail >= 1) s += `<path d="M-7.9 -3Q0 -1.2 7.9 -3" fill="none" stroke="${edge}" stroke-width="0.7" opacity="0.6"/>`
    if (detail >= 2) s += `<circle cx="-4.2" cy="-1.3" r="1.1" fill="#86C0FF"/><circle cx="0" cy="-1.6" r="1.4" fill="#FF7E6E"/><circle cx="4.2" cy="-1.3" r="1.1" fill="#8EDDB5"/><path d="M-6 -5.6L-5.4 -2.6" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round" opacity="0.6"/>`
    return { front: `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(6 + t.jitter.acc[1] * 6)})">${s}</g>` }
  },
  megaphone({ G, P, A, A2, detail, sw }) {
    const ey = G.hh * 0.18
    const ex = G.edgeX(ey) - 0.6
    const B = A2 || A
    let m = `<rect x="-0.6" y="0.6" width="2.6" height="5.4" rx="1.1" fill="${A.shade}"/>`
    m += `<path d="M-1.4 -2.2L10.4 -6.8L10.4 6.8L-1.4 2.2Z" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.6)}" stroke-linejoin="round"/>`
    if (detail >= 1) m += `<path d="M4.4 -4.5L6.6 -5.4L6.6 5.4L4.4 4.5Z" fill="${B.base}"/>`
    m += `<rect x="-3.6" y="-2.5" width="2.6" height="5" rx="1" fill="${A.shade}"/>`
    m += `<ellipse cx="10.4" cy="0" rx="1.9" ry="6.8" fill="${A.shade}"/><ellipse cx="10.6" cy="0" rx="1" ry="5.4" fill="${A.deep}"/>`
    if (detail >= 1) m += `<path d="M14.2 -4.2Q15.8 0 14.2 4.2M17 -6.6Q19.6 0 17 6.6" fill="none" stroke="${A.base}" stroke-width="${sw(1.2)}" stroke-linecap="round" opacity="0.8"/>`
    const nub = `<ellipse cx="${f(ex + 0.8)}" cy="${f(ey + 2.6)}" rx="3.1" ry="2.6" fill="${P.base}" stroke="${P.shade}" stroke-width="${sw(0.7)}"/>`
    return { front: `<g transform="translate(${f(ex + 2.6)} ${f(ey - 1.2)}) rotate(-28)">${m}</g>${nub}` }
  },
  pencil({ G, A, detail, sw, t }) {
    // Tucked behind the back top corner, as behind an ear: the body hides the middle.
    const a = (-135 * Math.PI) / 180
    const r = G.radius(a) - 3
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    const ang = -40 - t.jitter.acc[0] * 14
    const w = 2.3
    let s = `<rect x="-13" y="${-w}" width="3.6" height="${w * 2}" rx="1.2" fill="#FF9BB0"/>`
    s += `<rect x="-9.6" y="${-w}" width="2.6" height="${w * 2}" fill="#C9C6D1"/>`
    if (detail >= 1) s += `<path d="M-8.7 ${-w}V${w}M-7.9 ${-w}V${w}" stroke="#9C98A8" stroke-width="0.4"/>`
    s += `<rect x="-7.1" y="${-w}" width="15" height="${w * 2}" fill="${A.base}"/>`
    if (detail >= 1) s += `<rect x="-7.1" y="${-w}" width="15" height="${f(w * 0.7)}" fill="${A.light}" opacity="0.7"/><rect x="-7.1" y="${f(w * 0.45)}" width="15" height="${f(w * 0.55)}" fill="${A.shade}" opacity="0.5"/>`
    s += `<path d="M7.9 ${-w}L12.6 -0.75L12.6 0.75L7.9 ${w}Z" fill="#F2D2A2"/><path d="M11.2 -1.1L13.6 0L11.2 1.1Z" fill="#3A3644"/>`
    return {
      back: `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(ang)})" stroke-linejoin="round">${s}</g>`,
      front: detail === 0 ? '' : `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(ang)})"><path d="M12.6 0H13.6" stroke="#3A3644" stroke-width="${sw(0.5)}"/></g>`,
    }
  },
  plane({ G, A, detail, t }) {
    const x0 = G.hw * 0.06 + (t.jitter.acc[0] - 0.5) * 6
    const y0 = G.topY(x0) - 4.2
    const ang = -8 - t.jitter.acc[1] * 8
    let s = `<path d="M-9.4 -0.8L10 -4L-3.6 3Z" fill="${A.base}" stroke="${A.shade}" stroke-width="0.6" stroke-linejoin="round"/>`
    s += `<path d="M-3.6 3L10 -4L-1.8 5.4Z" fill="${A.shade}" stroke="${A.shade}" stroke-width="0.6" stroke-linejoin="round"/>`
    s += `<path d="M-3.6 3L10 -4" stroke="${A.deep}" stroke-width="0.5" opacity="0.5"/>`
    if (detail >= 2) s += `<path d="M-11.6 0.4C-15 1 -17 -3.2 -21 -2.6" fill="none" stroke="${A.shade}" stroke-width="0.9" stroke-dasharray="1.6 1.8" stroke-linecap="round" opacity="0.7"/>`
    return { front: `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(ang)})">${s}</g>` }
  },
}

function capDraw({ G, A, A2, detail, sw, P }: DrawContext, backward: boolean): Drawn {
  const T = -G.hh
  const cw = G.edgeX(T + 4.5) * 0.92 + 1
  const crown = `<path d="M${f(-cw)} ${f(T + 4.8)}C${f(-cw)} ${f(T - 11.5)} ${f(cw)} ${f(T - 11.5)} ${f(cw)} ${f(T + 4.8)}Z" fill="${A.base}"/>`
  const dir = backward ? -1 : 1
  const bx = (x: number) => f(x * dir)
  const brim = `<path d="M${bx(cw * 0.3)} ${f(T + 2.6)}C${bx(cw + 5)} ${f(T + 0.4)} ${bx(cw + 12.5)} ${f(T + 2.6)} ${bx(cw + 11.4)} ${f(T + 6.2)}C${bx(cw + 6)} ${f(T + 7.8)} ${bx(cw * 0.6)} ${f(T + 7)} ${bx(cw * 0.1)} ${f(T + 5.2)}Z" fill="${A.shade}"/>`
  let s = backward ? brim + crown : crown
  if (detail >= 1) s += `<path d="M${f(cw * 0.05)} ${f(T + 4.6)}Q${f(cw * 0.02)} ${f(T - 2)} ${f(-cw * 0.06)} ${f(T - 7.2)}" fill="none" stroke="${A.shade}" stroke-width="${sw(0.8)}" opacity="0.55"/>`
  s += `<circle cx="${f(-cw * 0.06)}" cy="${f(T - 7.6)}" r="1.4" fill="${A.shade}"/>`
  if (backward) {
    // The strap opening at the front, showing a little of the head through it.
    const x = cw * 0.42
    s +=
      `<path d="M${f(x - 3)} ${f(T + 5)}A3 3.2 0 0 1 ${f(x + 3)} ${f(T + 5)}Z" fill="${P.base}"/>` +
      `<path d="M${f(x - 3.2)} ${f(T + 3.6)}H${f(x + 3.2)}" stroke="${A.shade}" stroke-width="${sw(1)}" stroke-linecap="round"/>`
  } else {
    s += brim
    if (detail >= 1 && A2) {
      // A tiny speech bubble patch on the front panel.
      const x = cw * 0.28
      const y = T - 2.4
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(-12)"><rect x="-3" y="-2.2" width="6" height="4.2" rx="1.8" fill="${A2.base}"/><path d="M-1.8 1.4L0 1.4L-2.4 3.6Z" fill="${A2.base}"/></g>`
    }
  }
  return { front: s }
}
