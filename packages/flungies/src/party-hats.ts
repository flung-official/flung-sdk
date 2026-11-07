/**
 * Party headwear, drawn as the other accessories are (ACC_DRAW takes these in): a birthday cake with a candle that flickers, a
 * pirate's hat, and a red lantern for the Lunar New Year that sways on its pin. Store-only, weighted 0, so no seed wears one.
 */
import type { DrawContext, Drawn } from './accessories.js'
import { f } from './random.js'

export const PARTY_DRAW: Readonly<Record<string, (ctx: DrawContext) => Drawn>> = {
  cakeHat({ G, A, detail, sw, animate }) {
    // A little round cake on the head, tipped a touch: sponge, frosting dripping over the edge, sprinkles and one lit candle.
    const x = G.hw * 0.05
    const base = G.topY(x) + 2.2
    const cw = Math.min(10, G.hw * 0.42)
    const h = 8
    const t = base - h
    let s = `<g transform="rotate(7 ${f(x)} ${f(base)})">`
    s += `<rect x="${f(x - cw)}" y="${f(t)}" width="${f(cw * 2)}" height="${f(h)}" rx="1.4" fill="#FFF1DC" stroke="#E6CFA8" stroke-width="${sw(0.6)}"/>`
    let drips = `M${f(x - cw)} ${f(t + 1.4)}`
    for (let k = 0; k < 5; k++) {
      const x0 = x - cw + (k * cw * 2) / 5
      const x1 = x0 + (cw * 2) / 5
      drips += `Q${f((x0 + x1) / 2)} ${f(t + (k % 2 ? 4.4 : 3))} ${f(x1)} ${f(t + 1.4)}`
    }
    s += `<path d="${drips}V${f(t + 0.4)}Q${f(x)} ${f(t - 1.6)} ${f(x - cw)} ${f(t + 0.4)}Z" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.5)}" stroke-linejoin="round"/>`
    if (detail >= 2) s += ['#FF7E6E', '#86C0FF', '#8EDDB5', '#FFD66E'].map((c, k) => `<rect x="${f(x - cw * 0.7 + k * cw * 0.45)}" y="${f(t + 4.6 + (k % 2) * 0.8)}" width="1.2" height="0.5" rx="0.25" fill="${c}" transform="rotate(${k * 40} ${f(x - cw * 0.7 + k * cw * 0.45)} ${f(t + 4.6)})"/>`).join('')
    // The candle and its flame.
    s += `<rect x="${f(x - 0.9)}" y="${f(t - 5)}" width="1.8" height="5.2" rx="0.4" fill="#86C0FF"/>`
    if (detail >= 1) s += `<path d="M${f(x - 0.9)} ${f(t - 3.6)}l1.8 -1M${f(x - 0.9)} ${f(t - 1.6)}l1.8 -1" stroke="#FFFFFF" stroke-width="0.5"/>`
    const flicker = animate === true ? `<animateTransform attributeName="transform" type="scale" values="1 1;0.85 1.18;1.05 0.92;1 1" dur="0.7s" repeatCount="indefinite"/>` : ''
    s += `<g transform="translate(${f(x)} ${f(t - 5)})"><g>${flicker}<path d="M0 0C-1.7 -0.6 -1.7 -2.8 0 -4.4C1.7 -2.8 1.7 -0.6 0 0Z" fill="#FFB347"/><path d="M0 -0.4C-0.7 -0.8 -0.7 -1.8 0 -2.8C0.7 -1.8 0.7 -0.8 0 -0.4Z" fill="#FFE9A8"/></g></g>`
    return { front: s + `</g>` }
  },
  pirateHat({ G, A, detail, sw }) {
    // A tricorn: a wide hat turned up at both points, edged in gold, with a skull and crossbones on the front.
    const T = -G.hh
    const bw = G.edgeX(T + 5) * 0.96 + 3
    const brim = T + 4.2
    const h = 9.5
    let s = `<g transform="rotate(-5 0 ${f(brim)})">`
    const d = `M${f(-bw - 2)} ${f(brim - 4)}Q${f(-bw * 0.7)} ${f(brim - h - 3)} 0 ${f(brim - h)}Q${f(bw * 0.7)} ${f(brim - h - 3)} ${f(bw + 2)} ${f(brim - 4)}Q${f(bw * 0.5)} ${f(brim + 1.4)} 0 ${f(brim + 0.6)}Q${f(-bw * 0.5)} ${f(brim + 1.4)} ${f(-bw - 2)} ${f(brim - 4)}Z`
    s += `<path d="${d}" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.6)}" stroke-linejoin="round"/>`
    s += `<path d="M${f(-bw - 1.4)} ${f(brim - 3.6)}Q${f(-bw * 0.5)} ${f(brim + 0.8)} 0 ${f(brim)}Q${f(bw * 0.5)} ${f(brim + 0.8)} ${f(bw + 1.4)} ${f(brim - 3.6)}" fill="none" stroke="#F5BC3C" stroke-width="${sw(1)}" stroke-linecap="round"/>`
    if (detail >= 1) {
      const sy = brim - h * 0.5
      s += `<path d="M-3 ${f(sy - 1.6)}L3 ${f(sy + 2.4)}M3 ${f(sy - 1.6)}L-3 ${f(sy + 2.4)}" stroke="#FFFFFF" stroke-width="${sw(0.9)}" stroke-linecap="round"/>`
      s += `<circle cx="0" cy="${f(sy - 0.6)}" r="2" fill="#FFFFFF"/><rect x="-1.1" y="${f(sy + 0.6)}" width="2.2" height="1.4" rx="0.3" fill="#FFFFFF"/>`
      if (detail >= 2) s += `<circle cx="-0.75" cy="${f(sy - 0.6)}" r="0.5" fill="${A.base}"/><circle cx="0.75" cy="${f(sy - 0.6)}" r="0.5" fill="${A.base}"/>`
    }
    return { front: s + `</g>` }
  },
  lantern({ G, A, detail, sw, animate }) {
    // A pin from the back of the head curving up and over, a round paper lantern hanging from its end, gold caps and a tassel.
    const x0 = -G.hw * 0.3
    const y0 = G.topY(x0) + 2
    const tx = G.hw * 0.16
    const ty = G.topY(tx) - 17
    const pin = `<path d="M${f(x0)} ${f(y0)}Q${f(x0 - 1)} ${f(ty - 2)} ${f(tx)} ${f(ty)}" fill="none" stroke="#7A4A2A" stroke-width="${sw(1.1)}" stroke-linecap="round"/>`
    const ly = ty + 7.4
    let lamp = `<path d="M${f(tx)} ${f(ty)}V${f(ly - 4.6)}" stroke="#F5BC3C" stroke-width="${sw(0.5)}"/>`
    lamp += `<ellipse cx="${f(tx)}" cy="${f(ly)}" rx="5.6" ry="4.4" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.5)}"/>`
    if (detail >= 1) lamp += `<path d="M${f(tx - 2.6)} ${f(ly - 3.9)}Q${f(tx - 4)} ${f(ly)} ${f(tx - 2.6)} ${f(ly + 3.9)}M${f(tx + 2.6)} ${f(ly - 3.9)}Q${f(tx + 4)} ${f(ly)} ${f(tx + 2.6)} ${f(ly + 3.9)}M${f(tx)} ${f(ly - 4.4)}V${f(ly + 4.4)}" fill="none" stroke="${A.shade}" stroke-width="0.5" opacity="0.7"/>`
    lamp += `<rect x="${f(tx - 2.4)}" y="${f(ly - 5.4)}" width="4.8" height="1.6" rx="0.4" fill="#F5BC3C"/><rect x="${f(tx - 2.4)}" y="${f(ly + 3.8)}" width="4.8" height="1.6" rx="0.4" fill="#F5BC3C"/>`
    lamp += `<path d="M${f(tx)} ${f(ly + 5.4)}V${f(ly + 7)}M${f(tx - 0.8)} ${f(ly + 7)}L${f(tx - 1)} ${f(ly + 10)}M${f(tx)} ${f(ly + 7)}V${f(ly + 10.4)}M${f(tx + 0.8)} ${f(ly + 7)}L${f(tx + 1)} ${f(ly + 10)}" stroke="#F5BC3C" stroke-width="${sw(0.5)}" stroke-linecap="round"/>`
    if (detail >= 2) lamp += `<ellipse cx="${f(tx - 1.8)}" cy="${f(ly - 1.4)}" rx="1.2" ry="1.6" fill="#FFFFFF" opacity="0.35"/>`
    const sway = animate === true ? `<animateTransform attributeName="transform" type="rotate" values="-7 ${f(tx)} ${f(ty)};7 ${f(tx)} ${f(ty)};-7 ${f(tx)} ${f(ty)}" dur="2.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>` : ''
    return { front: `${pin}<g>${sway}${lamp}</g>` }
  },
}
