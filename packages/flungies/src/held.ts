/**
 * Things to hold, drawn as the other accessories are (ACC_DRAW takes these in): a coffee, a phone, a balloon that sways, a
 * sign, an ice cream, a bouquet, and the trophy that is earned. Each is held up at the front edge of the body by a little nub
 * of a hand, as the megaphone is, and sits in the hand slot, so it is worn with any hat and glasses.
 */
import type { DrawContext, Drawn } from './accessories.js'
import { mix } from './colour.js'
import { f } from './random.js'

/** Where the hand is: on the front edge, a little below the middle. */
export function handAt({ G }: Pick<DrawContext, 'G'>): { x: number; y: number } {
  const y = G.hh * 0.18
  return { x: G.edgeX(y) - 0.6, y }
}

/** The nub of a hand, in the body's colour, over what it holds. */
const nub = ({ P, sw }: DrawContext, x: number, y: number) =>
  `<ellipse cx="${f(x + 0.8)}" cy="${f(y + 2.6)}" rx="3.1" ry="2.6" fill="${P.base}" stroke="${P.shade}" stroke-width="${sw(0.7)}"/>`

export const HELD_DRAW: Readonly<Record<string, (ctx: DrawContext) => Drawn>> = {
  coffee(ctx) {
    const { A, A2, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    const sleeve = A2 ?? A
    let s = `<path d="M-3.6 -4.6L3.6 -4.6L2.8 5.4Q0 6.4 -2.8 5.4Z" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.6)}" stroke-linejoin="round"/>`
    s += `<path d="M-3.35 -1.4L3.35 -1.4L3 2.4L-3 2.4Z" fill="${sleeve.base}"/>`
    s += `<rect x="-4.3" y="-6.6" width="8.6" height="2.4" rx="1.1" fill="${A.shade}"/>`
    if (detail >= 1) s += `<path d="M-2.2 -0.4L2.2 -0.4" stroke="${sleeve.shade}" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>`
    if (detail >= 2)
      s +=
        `<path d="M-1.4 -8.2Q-2.6 -10 -1.4 -11.6Q-0.2 -13.2 -1.4 -14.8M1.6 -8.6Q0.4 -10.2 1.6 -11.8" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.75"/>` +
        `<path d="M-2.6 -3.6L-2 4.2" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round" opacity="0.35"/>`
    return { front: `<g transform="translate(${f(x + 5)} ${f(y - 2.6)}) rotate(6) scale(1.5)">${s}</g>${nub(ctx, x, y)}` }
  },
  phone(ctx) {
    const { A, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    let s = `<rect x="-3.4" y="-6.6" width="6.8" height="12.6" rx="1.8" fill="${A.base}" stroke="${A.deep}" stroke-width="${sw(0.6)}"/>`
    s += `<rect x="-2.6" y="-5.4" width="5.2" height="9.6" rx="0.9" fill="#1E2350"/>`
    if (detail >= 1) {
      // A little speech bubble on the screen: posting, of course.
      s += `<rect x="-1.9" y="-3.6" width="3.8" height="2.6" rx="1" fill="#86C0FF"/><path d="M-1.2 -1.2L-0.2 -1.2L-1.6 0.2Z" fill="#86C0FF"/>`
      s += `<rect x="-1.9" y="0.6" width="3" height="0.7" rx="0.35" fill="#FFFFFF" opacity="0.6"/><rect x="-1.9" y="1.8" width="2.2" height="0.7" rx="0.35" fill="#FFFFFF" opacity="0.4"/>`
    }
    if (detail >= 2) s += `<path d="M-2.2 -5L1.2 -5" stroke="#FFFFFF" stroke-width="0.5" stroke-linecap="round" opacity="0.5"/>`
    return { front: `<g transform="translate(${f(x + 4.4)} ${f(y - 4)}) rotate(14) scale(1.4)">${s}</g>${nub(ctx, x, y)}` }
  },
  balloon(ctx) {
    const { A, G, detail, sw, animate } = ctx
    const { x, y } = handAt(ctx)
    const bx = x + 2
    const by = -G.hh - 3.5
    const string = `<path d="M${f(x + 1.2)} ${f(y + 1)}C${f(x + 4)} ${f((y + by) / 2 + 4)} ${f(bx - 2)} ${f((y + by) / 2 - 2)} ${f(bx)} ${f(by + 8.4)}" fill="none" stroke="${mix(A.deep, '#16141C', 0.4)}" stroke-width="${sw(0.6, 0.6)}"/>`
    let b = `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="6.2" ry="7.4" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.5)}"/>`
    b += `<path d="M${f(bx - 1.2)} ${f(by + 8.6)}L${f(bx + 1.2)} ${f(by + 8.6)}L${f(bx)} ${f(by + 7.1)}Z" fill="${A.shade}"/>`
    if (detail >= 1)
      b += `<ellipse cx="${f(bx - 2.2)}" cy="${f(by - 3)}" rx="1.5" ry="2.4" transform="rotate(-24 ${f(bx - 2.2)} ${f(by - 3)})" fill="#FFFFFF" opacity="0.55"/>`
    // It sways about the hand when it moves.
    const sway = animate
      ? `<animateTransform attributeName="transform" type="rotate" values="-4 ${f(x)} ${f(y)};5 ${f(x)} ${f(y)};-4 ${f(x)} ${f(y)}" dur="3.2s" repeatCount="indefinite"/>`
      : ''
    return { front: `<g class="fl-balloon">${string}${b}${sway}</g>${nub(ctx, x, y)}` }
  },
  sign(ctx) {
    const { A, A2, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    const mark = A2 ?? A
    const sx = x + 4.2
    const top = y - 19
    let s = `<path d="M${f(sx)} ${f(y + 2)}V${f(top + 6)}" stroke="#B98A57" stroke-width="${sw(1.4)}" stroke-linecap="round"/>`
    s += `<rect x="${f(sx - 8)}" y="${f(top - 4)}" width="16" height="10.5" rx="1.6" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.7)}"/>`
    // A heart on it: it says the nicest thing a sign can.
    const hx = sx
    const hy = top + 1.4
    s += `<path d="M${f(hx)} ${f(hy + 2.6)}C${f(hx - 3.6)} ${f(hy + 0.2)} ${f(hx - 3.4)} ${f(hy - 2.6)} ${f(hx - 1.6)} ${f(hy - 2.6)}C${f(hx - 0.7)} ${f(hy - 2.6)} ${f(hx)} ${f(hy - 1.9)} ${f(hx)} ${f(hy - 1.2)}C${f(hx)} ${f(hy - 1.9)} ${f(hx + 0.7)} ${f(hy - 2.6)} ${f(hx + 1.6)} ${f(hy - 2.6)}C${f(hx + 3.4)} ${f(hy - 2.6)} ${f(hx + 3.6)} ${f(hy + 0.2)} ${f(hx)} ${f(hy + 2.6)}Z" fill="${mark.base === A.base ? '#FF5C8A' : mark.base}"/>`
    if (detail >= 2) s += `<path d="M${f(sx - 6.6)} ${f(top - 2.6)}H${f(sx - 3)}" stroke="#FFFFFF" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>`
    return { front: `<g transform="rotate(6 ${f(sx)} ${f(y)})">${s}</g>${nub(ctx, x, y)}` }
  },
  iceCream(ctx) {
    const { A, A2, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    const second = A2 ?? A
    let s = `<path d="M-3.2 -1L3.2 -1L0 8.4Z" fill="#E7B36C" stroke="#B9813F" stroke-width="${sw(0.5)}" stroke-linejoin="round"/>`
    if (detail >= 1)
      s += `<path d="M-2.2 0.8L1.6 4.6M0.4 -0.6L2.4 1.6M-1.6 -0.6L2.6 3.4M2 0.6L-1.2 4.4M-0.4 -0.6L-2.4 1.8" stroke="#B9813F" stroke-width="0.4" opacity="0.7"/>`
    s += `<circle cx="0" cy="-3" r="3.6" fill="${A.base}"/><circle cx="0.3" cy="-7.4" r="3" fill="${second.base}"/>`
    s += `<path d="M-3.6 -2Q-2.4 -0.2 -1.2 -1.6Q0 -0.2 1.2 -1.6Q2.4 -0.2 3.6 -2" fill="${A.base}"/>`
    s += `<circle cx="0.8" cy="-10.6" r="1.2" fill="#E5363F"/>`
    if (detail >= 2)
      s += `<path d="M0.8 -11.6Q1.4 -13 2.6 -13.2" fill="none" stroke="#4E9A73" stroke-width="0.5" stroke-linecap="round"/><circle cx="-1.2" cy="-4.2" r="0.8" fill="#FFFFFF" opacity="0.5"/>`
    return { front: `<g transform="translate(${f(x + 4)} ${f(y - 2.6)}) rotate(10) scale(1.5)">${s}</g>${nub(ctx, x, y)}` }
  },
  bouquet(ctx) {
    const { A, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    const flower = (cx: number, cy: number, c: string) =>
      [0, 72, 144, 216, 288]
        .map((deg) => {
          const a = (deg * Math.PI) / 180
          return `<circle cx="${f(cx + Math.cos(a) * 1.5)}" cy="${f(cy + Math.sin(a) * 1.5)}" r="1.25" fill="${c}"/>`
        })
        .join('') + `<circle cx="${f(cx)}" cy="${f(cy)}" r="0.85" fill="#FFD66E"/>`
    let s = `<path d="M-2.4 -6.4L-4.2 -3.6M2.6 -6.6L4.4 -4M0 -7L0.4 -4" stroke="#4E9A73" stroke-width="${sw(0.9)}" stroke-linecap="round"/>`
    s += `<ellipse cx="-3.6" cy="-4.6" rx="1.8" ry="0.9" transform="rotate(-40 -3.6 -4.6)" fill="#6FC79F"/><ellipse cx="3.8" cy="-4.8" rx="1.8" ry="0.9" transform="rotate(40 3.8 -4.8)" fill="#6FC79F"/>`
    s += flower(-2.6, -8, '#FF7E9C') + flower(2.6, -8.4, '#BFA4FF') + flower(0, -10.6, '#FF9F6E')
    s += `<path d="M-4.2 -4.4L4.4 -4.4L1.2 5.2L-1.2 5.2Z" fill="${A.base}" stroke="${A.shade}" stroke-width="${sw(0.6)}" stroke-linejoin="round"/>`
    if (detail >= 1) s += `<path d="M-1.8 0.4Q0 1.6 1.8 0.4" fill="none" stroke="#FF5C8A" stroke-width="0.9" stroke-linecap="round"/>`
    return { front: `<g transform="translate(${f(x + 5)} ${f(y - 2.2)}) rotate(8) scale(1.5)">${s}</g>${nub(ctx, x, y)}` }
  },
  trophy(ctx) {
    const { A, detail, sw } = ctx
    const { x, y } = handAt(ctx)
    let s = `<path d="M-4.4 -8L4.4 -8Q4.6 -1.4 0 0.4Q-4.6 -1.4 -4.4 -8Z" fill="${A.base}" stroke="${A.deep}" stroke-width="${sw(0.6)}" stroke-linejoin="round"/>`
    s += `<path d="M-4.2 -6.6Q-7.4 -6.4 -6.6 -3.6Q-6 -2 -3.4 -2.6M4.2 -6.6Q7.4 -6.4 6.6 -3.6Q6 -2 3.4 -2.6" fill="none" stroke="${A.deep}" stroke-width="${sw(0.8)}"/>`
    s += `<rect x="-1" y="0.2" width="2" height="2.8" fill="${A.shade}"/><rect x="-3.4" y="2.8" width="6.8" height="2.2" rx="0.6" fill="${A.deep}"/>`
    if (detail >= 1) s += `<path d="M0 -6.4L0.7 -4.9L2.3 -4.7L1.1 -3.6L1.4 -2L0 -2.8L-1.4 -2L-1.1 -3.6L-2.3 -4.7L-0.7 -4.9Z" fill="#FFFFFF" opacity="0.85"/>`
    if (detail >= 2) s += `<path d="M-3.2 -7.2Q-3.2 -3.6 -1.6 -1.8" fill="none" stroke="#FFFFFF" stroke-width="0.7" stroke-linecap="round" opacity="0.5"/>`
    return { front: `<g transform="translate(${f(x + 5)} ${f(y - 3.6)}) rotate(6) scale(1.5)">${s}</g>${nub(ctx, x, y)}` }
  },
}
