/**
 * Headwear for the year's events, drawn as the other accessories are (ACC_DRAW takes these in): reindeer antlers, heart boppers
 * that bob on their springs, and a leprechaun's hat. Store-only, weighted 0, so no seed wears one.
 */
import type { DrawContext, Drawn } from './accessories.js'
import { f } from './random.js'

/** A heart about 2r wide at x, y. */
const heart = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y + r)}C${f(x - r * 1.3)} ${f(y + r * 0.2)} ${f(x - r * 1.3)} ${f(y - r * 0.9)} ${f(x - r * 0.6)} ${f(y - r * 0.9)}C${f(x - r * 0.2)} ${f(y - r * 0.9)} ${f(x)} ${f(y - r * 0.6)} ${f(x)} ${f(y - r * 0.4)}C${f(x)} ${f(y - r * 0.6)} ${f(x + r * 0.2)} ${f(y - r * 0.9)} ${f(x + r * 0.6)} ${f(y - r * 0.9)}C${f(x + r * 1.3)} ${f(y - r * 0.9)} ${f(x + r * 1.3)} ${f(y + r * 0.2)} ${f(x)} ${f(y + r)}Z`

export const FESTIVE_DRAW: Readonly<Record<string, (ctx: DrawContext) => Drawn>> = {
  antlers({ G, A, detail, sw }) {
    // Two branching antlers, each a main beam curving up and out with two tines, and a soft fuzz of a lighter line.
    let s = ''
    for (const m of [-1, 1]) {
      const x0 = m * G.hw * 0.36
      const y0 = G.topY(x0) + 2
      const beam = `M0 0C${f(m * 0.6)} -5 ${f(m * 4)} -9 ${f(m * 8)} -13.5`
      const tines = `M${f(m * 1.6)} -6.2Q${f(m * -1.4)} -9 ${f(m * -0.6)} -12.6M${f(m * 5)} -10.6Q${f(m * 4.2)} -14 ${f(m * 5.4)} -16.6`
      s +=
        `<g transform="translate(${f(x0)} ${f(y0)})" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${beam}${tines}" stroke="${A.shade}" stroke-width="${sw(3.2)}"/><path d="${beam}${tines}" stroke="${A.base}" stroke-width="${sw(2.2)}"/>` +
        (detail >= 2 ? `<path d="${beam}" stroke="${A.light}" stroke-width="0.7" opacity="0.6" transform="translate(${f(-m * 0.5)} -0.3)"/>` : '') +
        `</g>`
    }
    return { front: s }
  },
  boppers({ G, A, detail, sw, animate }) {
    // A thin headband, two springs, and a heart on each that bobs, the two a beat apart.
    const band = G.topY(0) + 2.4
    const bw = G.edgeX(band) * 0.86
    let s = `<path d="M${f(-bw)} ${f(G.topY(-bw) + 3.4)}Q0 ${f(band - 3.8)} ${f(bw)} ${f(G.topY(bw) + 3.4)}" fill="none" stroke="#2B2834" stroke-width="${sw(1.2)}" stroke-linecap="round"/>`
    for (const m of [-1, 1]) {
      const x0 = m * G.hw * 0.3
      const y0 = G.topY(x0) + 1.6
      const hx = x0 + m * 4.6
      const hy = y0 - 13.5
      let spring = `M${f(x0)} ${f(y0)}`
      for (let i = 1; i <= 6; i++) spring += `L${f(x0 + ((hx - x0) * i) / 6 + (i % 2 ? 1.2 : -1.2))} ${f(y0 + ((hy + 3 - y0) * i) / 6)}`
      const bob = animate === true ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.8;0 0.6;0 0" dur="1.1s" begin="${m > 0 ? 0.25 : 0}s" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" repeatCount="indefinite"/>` : ''
      s +=
        `<g>${bob}<path d="${spring}" fill="none" stroke="#2B2834" stroke-width="${sw(0.8)}" stroke-linejoin="round"/>` +
        `<path d="${heart(hx, hy, 3.8)}" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.6)}"/>` +
        (detail >= 2 ? `<circle cx="${f(hx - 1.4)}" cy="${f(hy - 1.6)}" r="0.9" fill="#FFFFFF" opacity="0.75"/>` : '') +
        `</g>`
    }
    return { front: s }
  },
  leprechaun({ G, A, detail, sw }) {
    // A green top hat leaning a little back: a wide brim, a black band with a gold buckle, and a shamrock tucked in the band.
    const T = -G.hh
    const bw = G.edgeX(T + 5) * 0.96 + 1.2
    const brim = T + 3.6
    const crown = bw * 0.62
    const h = 13
    let s = `<g transform="rotate(-6 0 ${f(brim)})">`
    s += `<path d="M${f(-crown)} ${f(brim)}L${f(-crown * 0.9)} ${f(brim - h)}Q0 ${f(brim - h - 1.6)} ${f(crown * 0.9)} ${f(brim - h)}L${f(crown)} ${f(brim)}Z" fill="${A.base}"/>`
    s += `<ellipse cx="0" cy="${f(brim - h)}" rx="${f(crown * 0.9)}" ry="1.6" fill="${A.light}" opacity="0.5"/>`
    s += `<path d="M${f(-crown * 0.98)} ${f(brim - 1)}H${f(crown * 0.98)}L${f(crown * 0.95)} ${f(brim - 4.4)}H${f(-crown * 0.95)}Z" fill="#1E1C27"/>`
    s += `<rect x="-2.2" y="${f(brim - 4.6)}" width="4.4" height="3.8" rx="0.4" fill="none" stroke="#F5BC3C" stroke-width="${sw(1)}"/>`
    if (detail >= 2) {
      const cx = crown * 0.55
      const cy = brim - 6.4
      s += `<g fill="#3E9E4E"><circle cx="${f(cx - 1.1)}" cy="${f(cy)}" r="1.3"/><circle cx="${f(cx + 1.1)}" cy="${f(cy)}" r="1.3"/><circle cx="${f(cx)}" cy="${f(cy - 1.5)}" r="1.3"/></g><path d="M${f(cx)} ${f(cy + 0.4)}l0.6 2.4" stroke="#3E9E4E" stroke-width="0.6"/>`
    }
    s += `<ellipse cx="0" cy="${f(brim + 0.4)}" rx="${f(bw + 5)}" ry="3" fill="${A.shade}"/><ellipse cx="0" cy="${f(brim - 0.1)}" rx="${f(bw + 4.6)}" ry="2.4" fill="${A.base}"/></g>`
    return { front: s }
  },
}
