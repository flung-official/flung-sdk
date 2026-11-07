/** Costumes for the year's events: Santa, a ghost, a pumpkin, a skeleton, a suit and a vampire's cape, a mummy. */
import { INK } from '../data.js'
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'
import { clipOf, type EyesAt, type OutfitDrawn, shading, suitBase } from './parts.js'

/** A Santa suit: red over the lower body and the tail, white fur at the top and the hem, a black belt with a gold buckle. */
export function santa(G: Geometry, id: string, defs: string[], detail: number, chin: number): string {
  const red = '#D9363E'
  const deep = '#A8232B'
  const top = Math.max(G.hh * 0.32, chin + 1.5)
  const belt = Math.max(G.hh * 0.64, top + 5.5)
  const bottom = G.tip[1] + 4
  const clip = clipOf(G, id, defs, true)
  const shade = shading(id, defs)
  const w = G.hw + 5
  const inside: string[] = [`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="${red}"/>`]
  if (detail >= 1) inside.push(`<circle cx="${f(G.hw * 0.08)}" cy="${f((top + belt) / 2 + 1.2)}" r="0.9" fill="${deep}"/>`)
  inside.push(`<rect x="${f(-w)}" y="${f(belt - 1.7)}" width="${f(w * 2)}" height="3.4" fill="#1E1C27"/>`)
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  // Fur at the tail's tip.
  inside.push(`<circle cx="${f(G.tip[0])}" cy="${f(G.tip[1])}" r="3" fill="#FFFFFF"/>`)
  let out = `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
  // The buckle, over the belt.
  out += `<rect x="${f(G.hw * 0.08 - 2.4)}" y="${f(belt - 2.4)}" width="4.8" height="4.8" rx="0.8" fill="none" stroke="#F5BC3C" stroke-width="1.1"/>`
  // The fur along the top: a row of soft bumps, a little past the body each side, under the body's own outline.
  const reach = G.edgeX(top) + 1.2
  const bumps = Math.max(6, Math.round((reach * 2) / 3.2))
  const step = (reach * 2) / bumps
  let fur = ''
  for (let i = 0; i <= bumps; i++) fur += `<circle cx="${f(-reach + step * i)}" cy="${f(top + (i % 2) * 0.5)}" r="${f(detail >= 2 ? 2.1 : 1.9)}"/>`
  out += `<g fill="#FFFFFF">${fur}</g>`
  return out
}

/** A sheet over the whole Flungie, like a ghost: the head's dome, sides falling past the tail, a wavy hem, and eye holes. */
export function ghost(G: Geometry, detail: number, eyes: EyesAt): string {
  const sheet = '#F4F2F8'
  const fold = '#C9C3DA'
  const pad = 2.6
  const rx = G.hw + pad
  const ry = G.hh + pad
  const n = G.n
  // The dome: the body's own superellipse, a little bigger, from the left side over the top to the right.
  const dome: string[] = []
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (i / 24) * Math.PI
    const c = Math.cos(a)
    const s = Math.sin(a)
    dome.push(`${f(Math.sign(c) * rx * Math.abs(c) ** (2 / n))} ${f(Math.sign(s) * ry * Math.abs(s) ** (2 / n))}`)
  }
  const hem = Math.max(G.hh + 11, G.tip[1] + 3)
  const flare = rx + 3.2
  const count = 5
  const step = (flare * 2) / count
  let d = `M${f(-rx)} 0L${dome.join('L')}`
  d += `C${f(rx + 0.6)} ${f(G.hh * 0.6)} ${f(flare)} ${f(hem - 6)} ${f(flare)} ${f(hem)}`
  for (let i = 0; i < count; i++) {
    const x0 = flare - step * i
    d += `Q${f(x0 - step * 0.25)} ${f(hem + 3.2)} ${f(x0 - step * 0.5)} ${f(hem)}Q${f(x0 - step * 0.75)} ${f(hem - 2.6)} ${f(x0 - step)} ${f(hem)}`
  }
  d += `C${f(-flare)} ${f(hem - 6)} ${f(-rx - 0.6)} ${f(G.hh * 0.6)} ${f(-rx)} 0Z`
  let out = `<path d="${d}" fill="${sheet}" stroke="${fold}" stroke-width="0.7" stroke-linejoin="round"/>`
  if (detail >= 2) {
    // Folds falling from under the face to the hem.
    out += `<path d="M${f(-G.hw * 0.45)} ${f(G.hh * 0.55)}Q${f(-G.hw * 0.55)} ${f(hem - 5)} ${f(-G.hw * 0.62)} ${f(hem - 1)}M${f(G.hw * 0.55)} ${f(G.hh * 0.6)}Q${f(G.hw * 0.62)} ${f(hem - 5)} ${f(G.hw * 0.72)} ${f(hem - 1.5)}" fill="none" stroke="${fold}" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>`
    out += `<path d="M${f(-rx * 0.55)} ${f(-ry * 0.62)}Q${f(-rx * 0.2)} ${f(-ry * 0.95)} ${f(rx * 0.2)} ${f(-ry * 0.9)}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>`
  }
  // Eye holes where the face's eyes are, and a small round mouth.
  const r = eyes.r
  out += `<g fill="${INK}"><ellipse cx="${f(eyes.x - eyes.s)}" cy="${f(eyes.y)}" rx="${f(r * 0.95)}" ry="${f(r * 1.3)}"/><ellipse cx="${f(eyes.x + eyes.s)}" cy="${f(eyes.y)}" rx="${f(r * 0.95)}" ry="${f(r * 1.3)}"/>`
  out += `<ellipse cx="${f(eyes.x + 0.6)}" cy="${f(eyes.y + r + 4.4)}" rx="1.7" ry="2.2"/></g>`
  return `<g class="fl-outfit fl-ghost">${out}</g>`
}

/** A pumpkin: orange ribs from the chin down, a leafy green collar with a curl of vine, and a small carved grin low down. */
export function pumpkin(G: Geometry, id: string, defs: string[], detail: number, chin: number): string {
  const orange = '#F28C28'
  const deep = '#C2601C'
  const top = Math.max(G.hh * 0.28, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, orange)
  const inside: string[] = [base]
  // The ribs: lines bowing outward from the collar to the bottom.
  for (const k of [-0.7, -0.3, 0.3, 0.7]) {
    const x = k * G.hw
    inside.push(`<path d="M${f(x * 0.7)} ${f(top + 1)}Q${f(x * 1.25)} ${f((top + G.hh) / 2)} ${f(x * 0.8)} ${f(G.hh + 1)}" fill="none" stroke="${deep}" stroke-width="${detail >= 2 ? 1 : 1.2}" stroke-linecap="round" opacity="0.6"/>`)
  }
  // A carved grin, glowing, where there is room for one under the face.
  const room = G.hh - top
  if (detail >= 2 && room >= 9) {
    const cy = top + room * 0.5
    const glow = '#FFD34D'
    let grin = `M-4.6 ${f(cy - 0.6)}`
    for (let i = 0; i < 4; i++) grin += `L${f(-4.6 + (i + 0.5) * 2.3)} ${f(cy + (i % 2 ? 0.4 : 1.6))}L${f(-4.6 + (i + 1) * 2.3)} ${f(cy - 0.6)}`
    grin += `Q0 ${f(cy + 4)} -4.6 ${f(cy - 0.6)}Z`
    inside.push(`<path d="${grin}" fill="${glow}" stroke="${deep}" stroke-width="0.5" stroke-linejoin="round"/>`)
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  let out = `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
  // The collar: a band of green leaves along the top, and a curl of vine at one side.
  const leaf = '#3E8E4E'
  const reach = G.edgeX(top) - 1.6
  const n = Math.max(4, Math.round((reach * 2) / 4.6))
  const step = (reach * 2) / n
  let leaves = ''
  for (let i = 0; i <= n; i++) {
    const x = -reach + step * i
    leaves += `<path d="M${f(x - 2.4)} ${f(top + 0.6)}Q${f(x)} ${f(top - 2.4)} ${f(x + 2.4)} ${f(top + 0.6)}Q${f(x)} ${f(top + 3.4)} ${f(x - 2.4)} ${f(top + 0.6)}Z"/>`
  }
  out += `<g fill="${leaf}">${leaves}</g>`
  if (detail >= 2) out += `<path d="M${f(reach * 0.6)} ${f(top - 0.6)}q2.2 -3.4 4.4 -1.6q1.6 1.6 -0.6 2.6" fill="none" stroke="${leaf}" stroke-width="0.9" stroke-linecap="round"/>`
  return out
}

/** A skeleton suit: black from the chin down, with white bones on it, a collarbone, ribs either side of a spine, and hips. */
export function skeleton(G: Geometry, id: string, defs: string[], detail: number, chin: number): string {
  const black = '#1E1C27'
  const bone = '#F4F2F8'
  const top = Math.max(G.hh * 0.28, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, black)
  const inside: string[] = [base]
  const st = `fill="none" stroke="${bone}" stroke-linecap="round"`
  // The collarbone, then the ribs, as many as fit above the hips.
  const span = G.edgeX(top + 1) * 0.72
  inside.push(`<path d="M${f(-span)} ${f(top + 1.6)}Q0 ${f(top + 0.4)} ${f(span)} ${f(top + 1.6)}" ${st} stroke-width="1.3"/>`)
  const hips = Math.max(G.hh * 0.72, top + 9)
  const ribs: string[] = []
  for (let y = top + 4.2, k = 0; y < hips - 2.6 && k < 4; y += 3, k++) {
    const r = G.edgeX(y) * (0.62 - k * 0.06)
    ribs.push(`M-1.2 ${f(y)}Q${f(-r * 0.7)} ${f(y - 1.4)} ${f(-r)} ${f(y + 0.9)}M1.2 ${f(y)}Q${f(r * 0.7)} ${f(y - 1.4)} ${f(r)} ${f(y + 0.9)}`)
  }
  inside.push(`<path d="${ribs.join('')}" ${st} stroke-width="${detail >= 2 ? 1.2 : 1.4}"/>`)
  // The spine, a bead at a time, down to the hips.
  if (detail >= 2) for (let y = top + 3; y < hips; y += 2) inside.push(`<rect x="-0.8" y="${f(y)}" width="1.6" height="1.4" rx="0.5" fill="${bone}"/>`)
  else inside.push(`<path d="M0 ${f(top + 3)}V${f(hips)}" ${st} stroke-width="1.2"/>`)
  // Hips: two rounded wings each side of the spine's end.
  inside.push(`<path d="M0 ${f(hips + 0.8)}C-2 ${f(hips - 1.6)} -6 ${f(hips - 1.2)} -5.6 ${f(hips + 1.6)}C-5.2 ${f(hips + 3.6)} -1.8 ${f(hips + 3.2)} 0 ${f(hips + 0.8)}C1.8 ${f(hips + 3.2)} 5.2 ${f(hips + 3.6)} 5.6 ${f(hips + 1.6)}C6 ${f(hips - 1.2)} 2 ${f(hips - 1.6)} 0 ${f(hips + 0.8)}Z" fill="${bone}"/>`)
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  return `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
}

/**
 * A suit with a white shirt front and a bow tie: a tuxedo, or a vampire's, which adds a cape behind the body, black outside
 * and red inside, with a high collar standing up either side of the head.
 */
export function suit(G: Geometry, id: string, defs: string[], detail: number, chin: number, look: { jacket: string; bow: string; cape?: { outside: string; inside: string } }): OutfitDrawn {
  const top = Math.max(G.hh * 0.28, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, look.jacket)
  const shirt = '#FFFFFF'
  const v = Math.min(8, Math.max(5, (G.hh - top) * 0.7))
  const inside: string[] = [base]
  // The shirt front: a vee from the collar, with studs down it.
  inside.push(`<path d="M${f(-5.2)} ${f(top - 1)}L0 ${f(top + v)}L5.2 ${f(top - 1)}Z" fill="${shirt}"/>`)
  if (detail >= 2) inside.push(`<g fill="${look.jacket}"><circle cx="0" cy="${f(top + v * 0.45)}" r="0.5"/><circle cx="0" cy="${f(top + v * 0.75)}" r="0.5"/></g>`)
  // Lapels: a darker edge down each side of the vee.
  inside.push(`<path d="M-5.2 ${f(top - 1)}L0 ${f(top + v)}M5.2 ${f(top - 1)}L0 ${f(top + v)}" fill="none" stroke="#000000" stroke-width="0.9" opacity="0.35"/>`)
  if (look.cape === undefined && detail >= 2) {
    // A white pocket square on the front side.
    const px = G.hw * 0.42
    const py = top + v * 0.55
    inside.push(`<path d="M${f(px - 2)} ${f(py)}L${f(px - 1)} ${f(py - 1.8)}L${f(px)} ${f(py - 0.6)}L${f(px + 1)} ${f(py - 1.8)}L${f(px + 2)} ${f(py)}Z" fill="${shirt}"/>`)
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  let under = `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
  // The bow tie, at the top of the vee.
  under += `<path d="M0 ${f(top + 0.4)}L-3.6 ${f(top - 1.6)}L-3.6 ${f(top + 2.4)}ZM0 ${f(top + 0.4)}L3.6 ${f(top - 1.6)}L3.6 ${f(top + 2.4)}Z" fill="${look.bow}" stroke="${look.bow}" stroke-width="0.6" stroke-linejoin="round"/><circle cx="0" cy="${f(top + 0.4)}" r="1.1" fill="${look.bow}"/>`
  if (look.cape === undefined) return { back: '', under, over: '' }
  // The cape: from the shoulders, falling past the body each side to a hem below the tail, with points along it.
  const { outside, inside: lining } = look.cape
  const sh = -G.hh * 0.15
  const hem = Math.max(G.hh + 4, G.tip[1] + 1)
  const flare = G.hw + 3.5
  const points = 5
  const cape = (out: number) => {
    let d = `M${f(-G.hw + 1)} ${f(sh)}C${f(-flare - out)} ${f(sh + 6)} ${f(-flare - out)} ${f(hem - 6)} ${f(-flare - out)} ${f(hem + out)}`
    const step = ((flare + out) * 2) / points
    for (let i = 0; i < points; i++) d += `L${f(-flare - out + step * (i + 0.5))} ${f(hem + out - 2.2)}L${f(-flare - out + step * (i + 1))} ${f(hem + out)}`
    return `${d}C${f(flare + out)} ${f(hem - 6)} ${f(flare + out)} ${f(sh + 6)} ${f(G.hw - 1)} ${f(sh)}Z`
  }
  // The collar: a tall point standing up each side of the head, red inside.
  const cy = G.hh * 0.1
  const collar = (m: number) =>
    `<path d="M${f(m * (G.hw - 4))} ${f(cy)}L${f(m * (G.hw + 6))} ${f(-G.hh * 0.75)}L${f(m * (G.hw + 1))} ${f(-G.hh * 0.2)}Z" fill="${outside}"/>` +
    `<path d="M${f(m * (G.hw - 2.6))} ${f(cy - 1.4)}L${f(m * (G.hw + 4.4))} ${f(-G.hh * 0.62)}L${f(m * (G.hw + 0.6))} ${f(-G.hh * 0.18)}Z" fill="${lining}"/>`
  const back = `<g class="fl-outfit fl-cape"><path d="${cape(1)}" fill="${outside}"/><path d="${cape(-1)}" fill="${lining}"/>${collar(-1)}${collar(1)}</g>`
  return { back, under, over: '' }
}

/** A mummy's wrappings over the whole Flungie, face too, but for a gap at the eyes; a loose end hangs from one side. */
export function mummy(G: Geometry, id: string, defs: string[], detail: number, eyes: EyesAt): string {
  const wrap = '#EDE6D3'
  const edge = '#BDB091'
  const clip = clipOf(G, id, defs, true)
  const shade = shading(id, defs)
  const w = G.hw + 6
  const gapTop = eyes.y - eyes.r - 2.6
  const gapBottom = eyes.y + eyes.r + 2.2
  const T = -G.hh - 2
  const B = G.tip[1] + 4
  const inside: string[] = [
    `<rect x="${f(-w)}" y="${f(T)}" width="${f(w * 2)}" height="${f(gapTop - T)}" fill="${wrap}"/>`,
    `<rect x="${f(-w)}" y="${f(gapBottom)}" width="${f(w * 2)}" height="${f(B - gapBottom)}" fill="${wrap}"/>`,
  ]
  // The edges of each turn of bandage, at a slant that changes from one to the next, clear of the eye gap.
  const lines: string[] = []
  for (let y = T + 3.2, k = 0; y < B; y += 3.4, k++) {
    if (y > gapTop - 1.4 && y < gapBottom + 1.4) continue
    const tilt = k % 2 ? 1.6 : -1.4
    lines.push(`M${f(-w)} ${f(y - tilt)}L${f(w)} ${f(y + tilt)}`)
  }
  inside.push(`<path d="${lines.join('')}" fill="none" stroke="${edge}" stroke-width="${detail >= 2 ? 0.7 : 0.9}" stroke-linecap="round"/>`)
  // The bandage's edges along the gap.
  inside.push(`<path d="M${f(-w)} ${f(gapTop)}H${f(w)}M${f(-w)} ${f(gapBottom)}H${f(w)}" stroke="${edge}" stroke-width="0.8"/>`)
  inside.push(`<rect x="${f(-w)}" y="${f(T)}" width="${f(w * 2)}" height="${f(B - T)}" fill="url(#${shade})"/>`)
  let out = `<g class="fl-outfit fl-mummy" clip-path="url(#${clip})">${inside.join('')}</g>`
  if (detail >= 2) {
    // A loose end, hanging from the front side under the gap.
    const x = G.edgeX(gapBottom + 4) - 1
    const y = gapBottom + 4
    out += `<path d="M${f(x)} ${f(y)}q4 1 3.4 5.2l-0.4 3.6l-2.4 -0.6l0.6 -3.2q0.4 -2.6 -2.2 -2.6Z" fill="${wrap}" stroke="${edge}" stroke-width="0.6" stroke-linejoin="round"/>`
  }
  return out
}
