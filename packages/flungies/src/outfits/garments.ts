/** Everyday clothes: a knitted jumper (cosy, Christmas or sweetheart), a sundress, and a coat with a collar, a raincoat or an aloha shirt. */
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'
import { clipOf, neckline, shading, suitBase } from './parts.js'

/** A knitted garment over the middle of the body: a ribbed collar and hem, and a pattern of its own. */
export function jumper(G: Geometry, id: string, defs: string[], detail: number, chin: number, look: { base: string; rib: string; band?: string; flecks?: string; heart?: string }): string {
  const top = Math.max(G.hh * 0.3, chin)
  const bottom = Math.max(G.hh * 0.9, top + 8)
  const { w, d } = neckline(G, top, 2.4)
  const clip = clipOf(G, id, defs, false)
  const shade = shading(id, defs)
  const inside: string[] = [`<path d="${d}L${f(w)} ${f(bottom)}L${f(-w)} ${f(bottom)}Z" fill="${look.base}"/>`]
  if (detail >= 2 && look.band === undefined && look.heart === undefined) {
    // Knit: rows of small vees, faint.
    for (let y = top + 4; y < bottom - 3; y += 2.6) for (let x = -w + 1.5; x < w; x += 2.6) inside.push(`<path d="M${f(x - 0.8)} ${f(y - 0.7)}L${f(x)} ${f(y + 0.5)}L${f(x + 0.8)} ${f(y - 0.7)}" fill="none" stroke="${look.rib}" stroke-width="0.4" opacity="0.45"/>`)
  }
  if (look.band !== undefined) {
    // A festive band across the middle: a zigzag, with dots like snow above and below it.
    const y = (top + bottom) / 2 + 0.6
    let zig = `M${f(-w)} ${f(y)}`
    for (let x = -w, up = true; x < w; x += 2.4, up = !up) zig += `L${f(x + 2.4)} ${f(y + (up ? -1.6 : 1.6))}`
    inside.push(`<rect x="${f(-w)}" y="${f(y - 2.8)}" width="${f(w * 2)}" height="5.6" fill="${look.rib}"/>`, `<path d="${zig}" fill="none" stroke="${look.band}" stroke-width="0.9" stroke-linejoin="round"/>`)
    if (detail >= 2 && look.flecks !== undefined) {
      for (let x = -w + 2, row = 0; x < w; x += 4.2, row++) {
        inside.push(`<circle cx="${f(x)}" cy="${f(y - 5.2 + (row % 2) * 0.8)}" r="0.7" fill="${look.flecks}"/>`, `<circle cx="${f(x + 2.1)}" cy="${f(y + 5 - (row % 2) * 0.8)}" r="0.7" fill="${look.flecks}"/>`)
      }
    }
  }
  if (look.heart !== undefined) {
    // A big heart in the middle, a little to the front.
    const r = Math.min(4.4, (bottom - top - 4) / 2.2)
    const x = G.hw * 0.12
    const y = (top + bottom) / 2 - 0.6
    inside.push(
      `<path d="M${f(x)} ${f(y + r)}C${f(x - r * 1.3)} ${f(y + r * 0.2)} ${f(x - r * 1.3)} ${f(y - r * 0.9)} ${f(x - r * 0.6)} ${f(y - r * 0.9)}C${f(x - r * 0.2)} ${f(y - r * 0.9)} ${f(x)} ${f(y - r * 0.6)} ${f(x)} ${f(y - r * 0.4)}C${f(x)} ${f(y - r * 0.6)} ${f(x + r * 0.2)} ${f(y - r * 0.9)} ${f(x + r * 0.6)} ${f(y - r * 0.9)}C${f(x + r * 1.3)} ${f(y - r * 0.9)} ${f(x + r * 1.3)} ${f(y + r * 0.2)} ${f(x)} ${f(y + r)}Z" fill="${look.heart}"/>`,
    )
  }
  // The ribbed hem, then the collar along the neckline.
  inside.push(`<rect x="${f(-w)}" y="${f(bottom - 3.2)}" width="${f(w * 2)}" height="3.4" fill="${look.rib}"/>`)
  if (detail >= 2) for (let x = -w + 1; x < w; x += 1.6) inside.push(`<path d="M${f(x)} ${f(bottom - 2.8)}V${f(bottom - 0.4)}" stroke="${look.base}" stroke-width="0.45" opacity="0.6"/>`)
  inside.push(`<path d="${d}" fill="none" stroke="${look.rib}" stroke-width="2.2" stroke-linecap="round"/>`)
  inside.push(`<path d="${d}L${f(w)} ${f(bottom)}L${f(-w)} ${f(bottom)}Z" fill="url(#${shade})"/>`)
  return `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
}

/** A sundress: a bodice on thin straps, then a skirt that flares past the body and over the tail, with dots. */
export function sundress(G: Geometry, id: string, defs: string[], detail: number, chin: number): string {
  const base = '#FF8FA8'
  const trim = '#E0577A'
  const top = Math.max(G.hh * 0.26, chin)
  const waist = Math.max(G.hh * 0.6, top + 5)
  const hem = Math.max(G.hh + 9, G.tip[1] + 1.5)
  const clip = clipOf(G, id, defs, false)
  const shade = shading(id, defs)
  const w = G.hw + 4
  const out: string[] = []
  // Straps, from the bodice up the body's sides, clear of the face.
  for (const x of [-G.hw * 0.66, G.hw * 0.68]) out.push(`<path d="M${f(x)} ${f(top + 1)}L${f(x * 0.98)} ${f(-G.hh * 0.32)}" stroke="${trim}" stroke-width="1.5" stroke-linecap="round"/>`)
  // The skirt: from the waist, flaring a little past each side, with a scalloped hem.
  const side = G.edgeX(waist) + 0.4
  const flare = G.hw + 5
  const count = Math.max(7, Math.round((flare * 2) / 4))
  const step = (flare * 2) / count
  let skirt = `M${f(-side)} ${f(waist)}C${f(-side - 2)} ${f(waist + 6)} ${f(-flare)} ${f(hem - 5)} ${f(-flare)} ${f(hem)}`
  for (let i = 0; i < count; i++) skirt += `Q${f(-flare + step * (i + 0.5))} ${f(hem + 2.6)} ${f(-flare + step * (i + 1))} ${f(hem)}`
  skirt += `C${f(flare)} ${f(hem - 5)} ${f(side + 2)} ${f(waist + 6)} ${f(side)} ${f(waist)}Z`
  out.push(`<path d="${skirt}" fill="${base}"/>`)
  if (detail >= 2) {
    const dots: string[] = []
    for (let y = waist + 3, row = 0; y < hem - 1; y += 3.6, row++) {
      const reach = side + ((y - waist) / (hem - waist)) * (flare - side) - 1.5
      for (let x = -reach + (row % 2) * 1.8; x < reach; x += 3.6) dots.push(`<circle cx="${f(x)}" cy="${f(y)}" r="0.75" fill="#FFFFFF" opacity="0.9"/>`)
    }
    out.push(dots.join(''))
  }
  out.push(`<path d="${skirt}" fill="url(#${shade})"/>`)
  // The bodice, inside the body, with a band at the waist.
  out.push(
    `<g clip-path="url(#${clip})"><path d="M${f(-w)} ${f(top)}Q0 ${f(top + 1.6)} ${f(w)} ${f(top)}L${f(w)} ${f(waist + 1)}L${f(-w)} ${f(waist + 1)}Z" fill="${base}"/>` +
      `<path d="M${f(-w)} ${f(top)}Q0 ${f(top + 1.6)} ${f(w)} ${f(top)}" fill="none" stroke="${trim}" stroke-width="1.2"/></g>`,
    `<path d="M${f(-side)} ${f(waist)}H${f(side)}" stroke="${trim}" stroke-width="1.8" stroke-linecap="round"/>`,
  )
  if (detail >= 1) out.push(`<circle cx="${f(G.hw * 0.4)}" cy="${f(waist)}" r="1.5" fill="#FFFFFF"/><circle cx="${f(G.hw * 0.4)}" cy="${f(waist)}" r="0.6" fill="${trim}"/>`)
  return `<g class="fl-outfit">${out.join('')}</g>`
}

/** A coat from the chin down: a collar's two points, a placket with buttons, and pockets. A raincoat, or an aloha shirt. */
export function coat(G: Geometry, id: string, defs: string[], detail: number, chin: number, look: { base: string; trim: string; buttons: string; flowers?: readonly string[] }): string {
  const top = Math.max(G.hh * 0.28, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, look.base)
  const inside: string[] = [base]
  if (look.flowers !== undefined && detail >= 1) {
    // A print of small flowers, five petals round a middle, scattered on a grid with every other row shifted.
    for (let y = top + 3.6, row = 0; y < bottom; y += 6, row++) {
      for (let x = -w + 2 + (row % 2) * 3.5, i = 0; x < w; x += 7, i++) {
        const c = look.flowers[(row + i) % look.flowers.length] as string
        if (detail >= 2) {
          let petals = ''
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 + row
            petals += `<circle cx="${f(x + Math.cos(a) * 1.3)}" cy="${f(y + Math.sin(a) * 1.3)}" r="1.1"/>`
          }
          inside.push(`<g fill="${c}">${petals}</g><circle cx="${f(x)}" cy="${f(y)}" r="0.6" fill="#FFD66E"/>`)
        } else inside.push(`<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${c}"/>`)
      }
    }
  }
  // The placket and its buttons, a little to the front.
  const px = G.hw * 0.08
  inside.push(`<path d="M${f(px)} ${f(top)}V${f(G.hh + 1)}" stroke="${look.trim}" stroke-width="0.8"/>`)
  for (let y = top + 3.2, k = 0; y < G.hh - 1 && k < 3; y += 3.6, k++) inside.push(`<circle cx="${f(px + 1.6)}" cy="${f(y)}" r="0.95" fill="${look.buttons}"/>`)
  if (detail >= 2 && look.flowers === undefined) {
    // Pocket flaps, one each side, low down.
    const py = Math.min(G.hh * 0.7, top + (G.hh - top) * 0.65)
    for (const x of [-G.hw * 0.48, G.hw * 0.56]) inside.push(`<path d="M${f(x - 3.4)} ${f(py)}H${f(x + 3.4)}L${f(x + 3)} ${f(py + 1.8)}H${f(x - 3)}Z" fill="${look.trim}"/>`)
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  let out = `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
  // The collar: two points folded down from the neck.
  out += `<path d="M${f(px)} ${f(top + 0.4)}L${f(px - 6.4)} ${f(top - 0.8)}L${f(px - 3.6)} ${f(top + 4)}ZM${f(px)} ${f(top + 0.4)}L${f(px + 6.4)} ${f(top - 0.8)}L${f(px + 3.6)} ${f(top + 4)}Z" fill="${look.base}" stroke="${look.trim}" stroke-width="0.7" stroke-linejoin="round"/>`
  return out
}
