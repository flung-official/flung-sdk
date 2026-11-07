/**
 * Animal onesies: a dinosaur, a cat, a shark, a penguin, a unicorn, and a dragon for the Lunar New Year. Spikes, fins, a mane and
 * flippers sit behind the body, so only their tips show past the outline; ears and horns sit on the head, over the face. With
 * `animate`, spikes ripple, a tail swishes, a fin bobs, flippers flap, a mane bounces and a horn sparkles.
 */
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'
import { type EyesAt, onesie, type OutfitDrawn, rock } from './parts.js'

/** The top of a onesie, as onesie() puts it, for marks drawn on the suit. */
const suitTop = (G: Geometry, chin: number) => Math.max(G.hh * 0.24, chin)

/** A point on the outline at `deg` degrees (0 is the front, -90 the top), pushed `out` units past it. */
function onEdge(G: Geometry, deg: number, out = 0): { x: number; y: number; nx: number; ny: number } {
  const a = (deg * Math.PI) / 180
  const nx = Math.cos(a)
  const ny = Math.sin(a)
  const r = G.radius(a) + out
  return { x: nx * r, y: ny * r, nx, ny }
}

/**
 * A row of spikes along the top of the head and down the back, from `from` to `to` degrees, each with its base sunk inside the
 * body so none floats; with `animate` they ripple, one after another.
 */
function ridge(G: Geometry, look: { fill: string; edge: string }, from: number, to: number, count: number, size: number, animate: boolean): string {
  let s = ''
  for (let i = 0; i < count; i++) {
    const deg = from + ((to - from) * i) / (count - 1)
    const h = size * (1 - (i / (count - 1)) * 0.35)
    const p = onEdge(G, deg, -1.6)
    const tx = -p.ny
    const ty = p.nx
    const bw = h * 0.62
    const apex = `${f(p.x + p.nx * (h + 1.6))} ${f(p.y + p.ny * (h + 1.6))}`
    const d = `M${f(p.x + tx * bw)} ${f(p.y + ty * bw)}Q${f(p.x + tx * bw * 0.3 + p.nx * h * 0.7)} ${f(p.y + ty * bw * 0.3 + p.ny * h * 0.7)} ${apex}Q${f(p.x - tx * bw * 0.3 + p.nx * h * 0.7)} ${f(p.y - ty * bw * 0.3 + p.ny * h * 0.7)} ${f(p.x - tx * bw)} ${f(p.y - ty * bw)}Z`
    s += `<g>${rock(animate, p.x, p.y, 9, 1.3, i * 0.16)}<path d="${d}" fill="${look.fill}" stroke="${look.edge}" stroke-width="0.7" stroke-linejoin="round"/></g>`
  }
  return s
}

/** A few round spots on the suit's back half, below `top`. */
const spots = (G: Geometry, top: number, fill: string) =>
  (
    [
      [-0.62, 0.3, 2.4],
      [-0.3, 0.75, 1.8],
      [-0.78, 0.85, 1.5],
      [0.5, 0.9, 1.4],
    ] as const
  )
    .map(([kx, ky, r]) => `<circle cx="${f(kx * G.hw)}" cy="${f(top + ky * (G.hh - top + 2))}" r="${f(r)}" fill="${fill}"/>`)
    .join('')

/** A dinosaur onesie: green with spots and a pale belly, orange spikes over the head and down the back, and one at the tail. */
export function dinosaur(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const top = suitTop(G, chin)
  let under = onesie(G, id, defs, chin, { base: '#7CC86A', belly: '#E4F3B5', marks: detail >= 1 ? spots(G, top, '#5EAE55') : '' })
  // The tail's own spike, at its tip.
  const [tx, ty] = G.tip
  under += `<g>${rock(animate, tx + 1, ty - 2, -10, 1.3, 0.8)}<path d="M${f(tx + 1.4)} ${f(ty - 2.6)}L${f(tx - 3.4)} ${f(ty + 0.6)}L${f(tx + 0.6)} ${f(ty + 0.4)}Z" fill="#F59E4C" stroke="#D97B2E" stroke-width="0.6" stroke-linejoin="round"/></g>`
  const back = `<g class="fl-outfit fl-spikes">${ridge(G, { fill: '#F59E4C', edge: '#D97B2E' }, -62, -180, 6, 6.6, animate)}</g>`
  return { back, under, over: '' }
}

/** A dragon for the Lunar New Year: red with gold scales and belly, gold spikes, two little horns and long whiskers that wave. */
export function dragon(G: Geometry, id: string, defs: string[], detail: number, chin: number, eyes: EyesAt, animate: boolean): OutfitDrawn {
  const gold = '#F5BC3C'
  const top = suitTop(G, chin)
  let scales = ''
  if (detail >= 1)
    for (let row = 0, y = top + 3; y < G.hh + 6; row++, y += 3.6)
      for (let x = -G.hw - 2 + (row % 2) * 2.4; x < G.hw * 0.1; x += 4.8) scales += `M${f(x - 2.4)} ${f(y)}A2.4 2.4 0 0 0 ${f(x + 2.4)} ${f(y)}`
  const under = onesie(G, id, defs, chin, { base: '#D9363E', belly: gold, marks: scales === '' ? '' : `<path d="${scales}" fill="none" stroke="#A8232B" stroke-width="0.6" opacity="0.8"/>` })
  const back = `<g class="fl-outfit fl-spikes">${ridge(G, { fill: gold, edge: '#C99A16' }, -60, -175, 6, 5.6, animate)}</g>`
  let over = ''
  for (const m of [-1, 1]) {
    const x0 = G.hw * 0.08 + m * G.hw * 0.26
    const y0 = G.topY(x0) + 1.8
    over += `<path d="M${f(x0 - 1.3)} ${f(y0)}Q${f(x0 - 1)} ${f(y0 - 5)} ${f(x0 + m * 2.6)} ${f(y0 - 8.4)}Q${f(x0 + m * 0.6)} ${f(y0 - 4)} ${f(x0 + 1.3)} ${f(y0)}Z" fill="${gold}" stroke="#C99A16" stroke-width="0.6" stroke-linejoin="round"/>`
  }
  // Whiskers from the snout, the front of the face, flowing forward and out.
  const sx = Math.min(G.edgeX(eyes.y) - 1, eyes.x + eyes.s + eyes.r * 2.4)
  const whisker = (dy: number, wave: number) => `M${f(sx)} ${f(eyes.y + dy)}C${f(sx + 5)} ${f(eyes.y + dy - 3 + wave)} ${f(sx + 8)} ${f(eyes.y + dy + 4 - wave)} ${f(sx + 13)} ${f(eyes.y + dy + 1 + wave)}`
  for (const [dy, begin] of [
    [3.4, 0],
    [5.6, 0.35],
  ] as const) {
    const flow = animate ? `<animate attributeName="d" values="${whisker(dy, 0)};${whisker(dy, 2.2)};${whisker(dy, 0)}" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/>` : ''
    over += `<path d="${whisker(dy, 0)}" fill="none" stroke="${gold}" stroke-width="0.9" stroke-linecap="round">${flow}</path>`
  }
  return { back, under, over: `<g class="fl-outfit">${over}</g>` }
}

/** A cat suit: an orange tabby with stripes, pointed ears with pink insides, and a long tail behind that swishes. */
export function cat(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const fur = '#F4A259'
  const stripe = '#D9822B'
  const top = suitTop(G, chin)
  let marks = ''
  if (detail >= 1)
    for (const kx of [-0.85, -0.6, -0.35]) marks += `<path d="M${f(kx * G.hw - 2)} ${f(top + 1)}L${f(kx * G.hw + 1)} ${f(top + 4.6)}L${f(kx * G.hw - 2)} ${f(top + 8)}" fill="none" stroke="${stripe}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  const under = onesie(G, id, defs, chin, { base: fur, belly: '#FFF1DC', marks })
  // The tail: from low on the back side, out and curling up at the end.
  const by = G.hh * 0.3
  const bx = -G.edgeX(by) + 2.4
  const tail = `M${f(bx)} ${f(by)}C${f(bx - 9)} ${f(by + 3)} ${f(bx - 13)} ${f(by - 4)} ${f(bx - 11)} ${f(by - 12)}Q${f(bx - 10)} ${f(by - 16)} ${f(bx - 6.6)} ${f(by - 15)}`
  const back = `<g class="fl-outfit fl-tail"><g>${rock(animate, bx, by, 14, 2.4)}<path d="${tail}" fill="none" stroke="${stripe}" stroke-width="5" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${fur}" stroke-width="3.6" stroke-linecap="round"/></g></g>`
  let over = ''
  for (const m of [-1, 1]) {
    const x = G.hw * 0.05 + m * G.hw * 0.5
    const y = G.topY(x) + 3.2
    over += `<g transform="rotate(${f(m * 16)} ${f(x)} ${f(y)})"><path d="M${f(x - 4.6)} ${f(y)}Q${f(x - 1.6)} ${f(y - 8)} ${f(x)} ${f(y - 9.6)}Q${f(x + 1.6)} ${f(y - 8)} ${f(x + 4.6)} ${f(y)}Z" fill="${fur}" stroke="${stripe}" stroke-width="0.7" stroke-linejoin="round"/>${detail >= 1 ? `<path d="M${f(x - 2.2)} ${f(y - 0.6)}Q${f(x)} ${f(y - 7)} ${f(x + 2.2)} ${f(y - 0.6)}Z" fill="#FFB8C6"/>` : ''}</g>`
  }
  return { back, under, over: `<g class="fl-outfit">${over}</g>` }
}

/** A shark onesie: blue-grey with a white belly and gills, and a fin on top that bobs as if through the waves. */
export function shark(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const blue = '#7F9FC9'
  const top = suitTop(G, chin)
  let gills = ''
  if (detail >= 1) for (let k = 0; k < 3; k++) gills += `<path d="M${f(-G.hw * 0.42 + k * 2.6)} ${f(top + 2)}Q${f(-G.hw * 0.42 + k * 2.6 - 1.4)} ${f(top + 4.6)} ${f(-G.hw * 0.42 + k * 2.6)} ${f(top + 7.2)}" fill="none" stroke="#56769F" stroke-width="0.9" stroke-linecap="round"/>`
  const under = onesie(G, id, defs, chin, { base: blue, belly: '#F4F8FC', marks: gills })
  const x = -G.hw * 0.22
  const y = G.topY(x) + 3
  const bob = animate ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="1.6s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>` : ''
  const fin = `M${f(x + 6)} ${f(y)}Q${f(x + 2.4)} ${f(y - 8)} ${f(x - 5.4)} ${f(y - 16)}Q${f(x - 4.6)} ${f(y - 6)} ${f(x - 7)} ${f(y)}Z`
  const back = `<g class="fl-outfit fl-fin"><g>${bob}<path d="${fin}" fill="${blue}" stroke="#56769F" stroke-width="0.8" stroke-linejoin="round"/></g></g>`
  return { back, under, over: '' }
}

/** A penguin: black with a big white front, flippers at the sides that flap, and orange feet below. */
export function penguin(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const black = '#2B2834'
  let under = onesie(G, id, defs, chin, { base: black, belly: '#FFFFFF' })
  if (detail >= 1) under += `<g fill="#F59E3B">${[0.12, 0.46].map((k) => `<ellipse cx="${f(k * G.hw)}" cy="${f(G.hh + 0.6)}" rx="3.4" ry="1.7"/>`).join('')}</g>`
  let back = ''
  for (const m of [-1, 1]) {
    const y = G.hh * 0.12
    const x = m * (G.edgeX(y) - 1.4)
    back += `<g>${rock(animate, x, y - 2, m * -18, 0.9, m > 0 ? 0.2 : 0)}<ellipse cx="${f(x + m * 2.6)}" cy="${f(y + 4.6)}" rx="2.6" ry="7" transform="rotate(${f(m * -28)} ${f(x + m * 2.6)} ${f(y + 4.6)})" fill="${black}"/></g>`
  }
  return { back: `<g class="fl-outfit fl-flippers">${back}</g>`, under, over: '' }
}

/** A unicorn onesie: pearly white, a rainbow mane down the back of the head that bounces, ears, and a golden horn that sparkles. */
export function unicorn(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const pearl = '#F8F4FF'
  const under = onesie(G, id, defs, chin, { base: pearl, belly: '#FFE3F1' })
  const colours = ['#FF8FB1', '#BFA4FF', '#86C0FF', '#8EDDB5', '#FFD66E']
  const mane = colours
    .map((colour, i) => {
      const p = onEdge(G, -96 - i * 19, 1.4)
      const bounce = animate ? `<animateTransform attributeName="transform" type="translate" values="0 0;${f(p.nx * 1.2)} ${f(p.ny * 1.2)};0 0" dur="1.2s" begin="${f(i * 0.12)}s" repeatCount="indefinite"/>` : ''
      return `<g>${bounce}<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(5 - i * 0.3)}" fill="${colour}"/></g>`
    })
    .join('')
  const back = `<g class="fl-outfit fl-mane">${mane}</g>`
  // The horn: a gold cone with a spiral, on the top of the head toward the front.
  const shine = `${id}uh`
  defs.push(`<linearGradient id="${shine}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F5BC3C"/><stop offset="0.5" stop-color="#FFE9A8"/><stop offset="1" stop-color="#E0A21E"/></linearGradient>`)
  const hx = G.hw * 0.2
  const hy = G.topY(hx) + 2.4
  let horn = `<path d="M${f(hx - 2.8)} ${f(hy)}L${f(hx + 1.4)} ${f(hy - 13)}L${f(hx + 2.8)} ${f(hy)}Z" fill="url(#${shine})" stroke="#C99A16" stroke-width="0.6" stroke-linejoin="round"/>`
  if (detail >= 2) for (let k = 1; k <= 3; k++) horn += `<path d="M${f(hx - 2.8 + k * 1.05)} ${f(hy - k * 3.2)}l${f(2.4 - k * 0.5)} -1.4" stroke="#C99A16" stroke-width="0.5"/>`
  const twinkle = animate ? `<animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" values="0 ${f(hx + 3.6)} ${f(hy - 13)};90 ${f(hx + 3.6)} ${f(hy - 13)}" dur="1.6s" repeatCount="indefinite"/>` : ''
  const sparkle = `<path d="M${f(hx + 3.6)} ${f(hy - 15.4)}L${f(hx + 4.1)} ${f(hy - 13.5)}L${f(hx + 6)} ${f(hy - 13)}L${f(hx + 4.1)} ${f(hy - 12.5)}L${f(hx + 3.6)} ${f(hy - 10.6)}L${f(hx + 3.1)} ${f(hy - 12.5)}L${f(hx + 1.2)} ${f(hy - 13)}L${f(hx + 3.1)} ${f(hy - 13.5)}Z" fill="#FFFFFF" stroke="#F5BC3C" stroke-width="0.3" opacity="${animate ? 0 : 0.9}">${twinkle}</path>`
  let ears = ''
  for (const m of [-1, 1]) {
    const x = hx + m * G.hw * 0.4
    const y = G.topY(x) + 2.6
    ears += `<path d="M${f(x - 3)} ${f(y)}Q${f(x)} ${f(y - 9)} ${f(x + 3)} ${f(y)}Z" fill="${pearl}" stroke="#DCD3EE" stroke-width="0.7"/>${detail >= 1 ? `<path d="M${f(x - 1.4)} ${f(y - 0.4)}Q${f(x)} ${f(y - 6)} ${f(x + 1.4)} ${f(y - 0.4)}Z" fill="#FFC2D6"/>` : ''}`
  }
  return { back, under, over: `<g class="fl-outfit">${ears}${horn}${detail >= 1 ? sparkle : ''}</g>` }
}
