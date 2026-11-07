/**
 * Headwear that is earned, never sold (store.ts, EARNED), drawn as the other accessories are (ACC_DRAW takes these in): a laurel
 * wreath for a long streak, and a star crown for a longer one.
 */
import type { DrawContext, Drawn } from './accessories.js'
import { f } from './random.js'

export const EARNED_HAT_DRAW: Readonly<Record<string, (ctx: DrawContext) => Drawn>> = {
  laurel({ G, A, detail, sw }) {
    // Two sprays of leaves around the top of the head, meeting at the front.
    const T = -G.hh
    const w = G.edgeX(T + 4) * 0.9 + 1
    const leaves: string[] = []
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const u = i / 5
        const x = dir * w * (1 - u * 0.88)
        const y = T + 3.2 - Math.sin(u * Math.PI * 0.55) * 4.6
        const ang = dir * (70 - u * 80)
        leaves.push(
          `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.6" ry="3.1" transform="rotate(${f(ang)} ${f(x)} ${f(y)})" fill="${A.base}" stroke="${A.deep}" stroke-width="${sw(0.45)}"/>`,
        )
      }
    }
    let s = `<path d="M${f(-w)} ${f(T + 3.6)}Q0 ${f(T - 4.4)} ${f(w)} ${f(T + 3.6)}" fill="none" stroke="${A.shade}" stroke-width="${sw(0.9)}"/>`
    s += leaves.join('')
    if (detail >= 1) s += `<circle cx="0" cy="${f(T - 0.4)}" r="1.4" fill="#FF7E6E" stroke="${A.deep}" stroke-width="0.4"/>`
    return { front: s }
  },
  starCrown({ G, A, detail, sw, t }) {
    const x0 = G.hw * 0.06 + (t.jitter.acc[0] - 0.5) * 4
    const y0 = G.topY(x0) + 2.6
    const edge = A.deep
    const star = (cx: number, cy: number, r: number) =>
      `<path d="M${Array.from({ length: 10 }, (_, i) => {
        const rr = i % 2 === 0 ? r : r * 0.45
        const a = ((-90 + i * 36) * Math.PI) / 180
        return `${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`
      }).join('L')}Z" fill="${A.base}" stroke="${edge}" stroke-width="${sw(0.55)}" stroke-linejoin="round"/>`
    let s = `<path d="M-8.4 0L-8.4 -5.6L8.4 -5.6L8.4 0Q0 1.8 -8.4 0Z" fill="${A.base}" stroke="${edge}" stroke-width="${sw(0.8)}" stroke-linejoin="round"/>`
    s += star(-6.4, -8, 2.8) + star(0, -10.4, 3.8) + star(6.4, -8, 2.8)
    if (detail >= 1) s += `<path d="M-8 -3.2Q0 -1.6 8 -3.2" fill="none" stroke="${edge}" stroke-width="0.6" opacity="0.6"/>`
    if (detail >= 2)
      s += `<circle cx="-4.2" cy="-2.4" r="1" fill="#BFA4FF"/><circle cx="0" cy="-2.6" r="1.3" fill="#86C0FF"/><circle cx="4.2" cy="-2.4" r="1" fill="#FF8FA8"/><path d="M-1 -12.4L-0.4 -10" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>`
    return { front: `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(6 + t.jitter.acc[1] * 6)})">${s}</g>` }
  },
}
