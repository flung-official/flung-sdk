/**
 * Dressing up: a pirate's striped shirt, sash and eye patch, an astronaut's suit and helmet, and a red and gold jacket for the
 * Lunar New Year. With `animate`, the astronaut's buttons blink and the helmet's glint sweeps, and the jacket's gold glimmers.
 */
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'
import { clipOf, type EyesAt, type OutfitDrawn, suitBase } from './parts.js'

/** A pirate: a cream shirt with navy stripes, a red sash knotted at the side, and a patch over the front eye. */
export function pirate(G: Geometry, id: string, defs: string[], detail: number, chin: number, eyes: EyesAt, animate: boolean): OutfitDrawn {
  const top = Math.max(G.hh * 0.26, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, '#FFF6E6')
  const inside = [base]
  for (let y = top + 2.2; y < bottom; y += 4.4) inside.push(`<rect x="${f(-w)}" y="${f(y)}" width="${f(w * 2)}" height="2" fill="#2E4A7A"/>`)
  const sy = Math.min(G.hh * 0.62, bottom - 6)
  inside.push(`<rect x="${f(-w)}" y="${f(sy)}" width="${f(w * 2)}" height="3.6" fill="#D9363E"/>`)
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  // The sash's knot and ends, at the back side, swinging a little.
  const kx = -G.edgeX(sy + 1.8) + 3
  const swing = animate ? `<animateTransform attributeName="transform" type="rotate" values="0 ${f(kx)} ${f(sy + 1.8)};8 ${f(kx)} ${f(sy + 1.8)};0 ${f(kx)} ${f(sy + 1.8)}" dur="1.9s" repeatCount="indefinite"/>` : ''
  const knot = `<g>${swing}<path d="M${f(kx)} ${f(sy + 1.8)}l-3.4 6.4l2.4 0.4ZM${f(kx)} ${f(sy + 1.8)}l-0.6 7.4l2.2 -0.6Z" fill="#B3243A"/></g><circle cx="${f(kx)}" cy="${f(sy + 1.8)}" r="2" fill="#B3243A"/>`
  const under = `<g class="fl-outfit"><g clip-path="url(#${clip})">${inside.join('')}</g>${detail >= 1 ? knot : ''}</g>`
  // The patch over the front eye, its strap across the forehead to the back of the head.
  const ex = eyes.x + eyes.s
  const head = clipOf(G, id, defs, false)
  const strap = `<path d="M${f(ex)} ${f(eyes.y)}L${f(-G.hw)} ${f(eyes.y - eyes.r * 5.2)}" stroke="#1E1C27" stroke-width="${f(Math.max(0.8, eyes.r * 0.5))}" clip-path="url(#${head})"/>`
  const patch = `<ellipse cx="${f(ex)}" cy="${f(eyes.y + 0.2)}" rx="${f(eyes.r * 1.9)}" ry="${f(eyes.r * 1.7)}" fill="#1E1C27"/>`
  return { back: '', under, over: `<g class="fl-outfit fl-patch">${strap}${patch}</g>` }
}

/** An astronaut: a white suit with a ring at the neck, a chest panel whose buttons blink, a patch, and a clear helmet with a glint. */
export function astronaut(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const top = Math.max(G.hh * 0.26, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, '#F4F6FA')
  const inside = [base]
  // Seams, and the knee-high band of grey.
  inside.push(`<rect x="${f(-w)}" y="${f(G.hh * 0.78)}" width="${f(w * 2)}" height="${f(bottom - G.hh * 0.78)}" fill="#DDE3EC"/>`)
  if (detail >= 1) {
    const px = G.hw * 0.08
    const py = top + 3.2
    inside.push(`<rect x="${f(px)}" y="${f(py)}" width="9" height="5.4" rx="1" fill="#B8C2D0"/>`)
    ;['#FF7E6E', '#86C0FF', '#8EDDB5'].forEach((colour, i) => {
      const blink = animate ? `<animate attributeName="opacity" values="1;0.25;1" dur="${f(1.1 + i * 0.4)}s" begin="${f(i * 0.3)}s" repeatCount="indefinite"/>` : ''
      inside.push(`<circle cx="${f(px + 2 + i * 2.5)}" cy="${f(py + 2.7)}" r="0.95" fill="${colour}">${blink}</circle>`)
    })
    // A mission patch on the back side: Flung's peach and sky.
    const mx = -G.hw * 0.5
    const my = top + 4.4
    inside.push(`<circle cx="${f(mx)}" cy="${f(my)}" r="2.8" fill="#86C0FF"/><path d="M${f(mx - 2.8)} ${f(my)}A2.8 2.8 0 0 1 ${f(mx + 2.8)} ${f(my)}Z" fill="#FFA584"/><circle cx="${f(mx)}" cy="${f(my)}" r="2.8" fill="none" stroke="#FFFFFF" stroke-width="0.6"/>`)
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  inside.push(`<path d="M${f(-w)} ${f(top + 0.8)}H${f(w)}" stroke="#B8C2D0" stroke-width="2.4"/>`)
  const under = `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
  // The helmet: a clear bubble round the head, above the ring, with a glint on its upper front.
  const cy = (top - G.hh) / 2
  const rx = G.hw + 2.6
  const ry = (top + G.hh) / 2 + 2.6
  const gx = G.hw * 0.35
  const sweep = animate ? `<animate attributeName="opacity" values="0.2;0.95;0.2" dur="2.6s" repeatCount="indefinite"/>` : ''
  const glint = `<path d="M${f(gx - rx * 0.32)} ${f(cy - ry * 0.86)}A${f(rx)} ${f(ry)} 0 0 1 ${f(gx + rx * 0.3)} ${f(cy - ry * 0.55)}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.85">${sweep}</path>`
  const over = `<g class="fl-outfit fl-helmet"><ellipse cx="0" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#DCEBFA" fill-opacity="0.16" stroke="#C5D7EA" stroke-width="1.2"/>${detail >= 1 ? glint : ''}</g>`
  return { back: '', under, over }
}

/** A Lunar New Year jacket: red silk, a gold standing collar, a curved gold opening with knotted buttons, and gold coins that glimmer. */
export function newYearJacket(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): string {
  const gold = '#F5BC3C'
  const top = Math.max(G.hh * 0.26, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, '#C8232C')
  const inside = [base]
  if (detail >= 1) {
    const coins: [number, number][] = [
      [-0.62, 0.42],
      [-0.2, 0.85],
      [-0.82, 1],
      [0.5, 0.95],
    ]
    coins.forEach(([kx, ky], i) => {
      const x = kx * G.hw
      const y = top + ky * (G.hh - top + 2)
      if (y > bottom - 2) return
      const glimmer = animate ? `<animate attributeName="opacity" values="0.75;0.3;0.75" dur="${f(2 + (i % 2) * 0.7)}s" begin="${f(i * 0.4)}s" repeatCount="indefinite"/>` : ''
      inside.push(`<g opacity="0.75">${glimmer}<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="none" stroke="${gold}" stroke-width="0.8"/><rect x="${f(x - 0.7)}" y="${f(y - 0.7)}" width="1.4" height="1.4" fill="${gold}"/></g>`)
    })
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  // The standing collar, and the opening sweeping from it to the front side.
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="2.4" fill="${gold}"/>`)
  const ox = G.hw * 0.1
  const front = G.edgeX(top + 7)
  inside.push(`<path d="M${f(ox)} ${f(top + 2.4)}Q${f(ox + 1)} ${f(top + 6)} ${f(front + 1)} ${f(top + 7.4)}" fill="none" stroke="${gold}" stroke-width="0.9"/>`)
  if (detail >= 2)
    for (let k = 0; k < 2; k++) {
      const bx = ox + 3.6 + k * (front - ox - 4) * 0.55
      const by = top + 4.4 + k * 1.6
      inside.push(`<path d="M${f(bx - 1.6)} ${f(by)}H${f(bx + 1.6)}" stroke="${gold}" stroke-width="0.7" stroke-linecap="round"/><circle cx="${f(bx)}" cy="${f(by)}" r="0.8" fill="${gold}"/>`)
    }
  return `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
}
