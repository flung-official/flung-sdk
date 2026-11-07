/**
 * Cute costumes: a bee, a frog, a bear and a bunny, fairy wings, a superhero's cape and mask, a wizard's robe, and a scarf. With
 * `animate` the parts that would move do, with SMIL as auras do (wings flutter, a cape and a scarf's end wave, stars twinkle);
 * without it, a still frame.
 */
import { INK } from '../data.js'
import type { Geometry } from '../geometry.js'
import { f } from '../random.js'
import { clipOf, type EyesAt, onesie, type OutfitDrawn, rock, suitBase } from './parts.js'

/** A bee: yellow and black stripes from the chin down, wings on the back that flutter, and antennae with round tips. */
export function bee(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const top = Math.max(G.hh * 0.26, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, '#FFD23F')
  const stripes: string[] = []
  for (let y = top + 2.6; y < bottom; y += 5) stripes.push(`<rect x="${f(-w)}" y="${f(y)}" width="${f(w * 2)}" height="2.6" fill="#2B2834"/>`)
  const under = `<g class="fl-outfit" clip-path="url(#${clip})">${base}${stripes.join('')}<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/></g>`
  // The wings: two round panes over the upper back, each fluttering about where it meets the body.
  const wing = (x: number, tilt: number, rx: number, begin: number) => {
    const y = -G.hh - 3
    return `<g>${rock(animate, x, -G.hh * 0.25, tilt > 0 ? 16 : -16, 0.28, begin)}<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.62)}" transform="rotate(${f(tilt)} ${f(x)} ${f(y)})" fill="#EAF6FF" fill-opacity="0.85" stroke="#8CBDEB" stroke-width="0.8"/>${detail >= 2 ? `<path d="M${f(x)} ${f(y + rx * 0.2)}Q${f(x + tilt * 0.08)} ${f(y - rx * 0.2)} ${f(x + tilt * 0.14)} ${f(y - rx * 0.45)}" fill="none" stroke="#8CBDEB" stroke-width="0.5" opacity="0.8"/>` : ''}</g>`
  }
  const back = `<g class="fl-outfit fl-wings">${wing(-G.hw * 0.4, -30, 10.5, 0)}${wing(G.hw * 0.12, 26, 9.5, 0.14)}</g>`
  // Antennae from the top of the head.
  let over = ''
  for (const m of [-1, 1]) {
    const x0 = m * G.hw * 0.22
    const y0 = G.topY(x0) + 1.4
    const tx = x0 + m * 4.2
    const ty = y0 - 10.5
    over += `<g>${rock(animate, x0, y0, m * 6, 1.6, m > 0 ? 0.4 : 0)}<path d="M${f(x0)} ${f(y0)}Q${f(x0 + m * 0.6)} ${f(y0 - 7)} ${f(tx)} ${f(ty)}" fill="none" stroke="#2B2834" stroke-width="1.1" stroke-linecap="round"/><circle cx="${f(tx)}" cy="${f(ty)}" r="1.9" fill="#2B2834"/></g>`
  }
  return { back, under, over: `<g class="fl-outfit">${over}</g>` }
}

/** A frog onesie: green with a pale belly, and two round eyes on top of the head that look about. */
export function frog(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const green = '#6CC46C'
  const under = onesie(G, id, defs, chin, { base: green, belly: '#D6F2B8' })
  let over = ''
  for (const m of [-1, 1]) {
    const x = m * G.hw * 0.46
    const y = G.topY(x) + 1.2
    const look = animate ? `<animateTransform attributeName="transform" type="translate" values="0 0;0.9 0;0.9 0;-0.6 0;0 0" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>` : ''
    over += `<circle cx="${f(x)}" cy="${f(y)}" r="5.6" fill="${green}" stroke="#4FA352" stroke-width="0.7"/><circle cx="${f(x)}" cy="${f(y - 0.4)}" r="3.6" fill="#FFFFFF"/><g>${look}<circle cx="${f(x + 0.6)}" cy="${f(y - 0.2)}" r="1.9" fill="${INK}"/>${detail >= 2 ? `<circle cx="${f(x + 1.2)}" cy="${f(y - 0.9)}" r="0.6" fill="#FFFFFF"/>` : ''}</g>`
  }
  return { back: '', under, over: `<g class="fl-outfit">${over}</g>` }
}

/** A bear onesie: brown with a tan belly and round ears on the head that twitch now and then. */
export function bear(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const brown = '#B07A4F'
  const under = onesie(G, id, defs, chin, { base: brown, belly: '#EBCDA4' })
  let over = ''
  for (const m of [-1, 1]) {
    const x = m * G.hw * 0.6
    const y = G.topY(x) + 2.4
    const twitch = animate ? `<animateTransform attributeName="transform" type="rotate" values="0 ${f(x)} ${f(y + 3)};0 ${f(x)} ${f(y + 3)};${f(m * 12)} ${f(x)} ${f(y + 3)};0 ${f(x)} ${f(y + 3)}" keyTimes="0;0.85;0.92;1" dur="${m > 0 ? 3.4 : 4.6}s" repeatCount="indefinite"/>` : ''
    over += `<g>${twitch}<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${brown}" stroke="#8C5D39" stroke-width="0.7"/>${detail >= 1 ? `<circle cx="${f(x)}" cy="${f(y + 0.4)}" r="2.6" fill="#EBCDA4"/>` : ''}</g>`
  }
  return { back: '', under, over: `<g class="fl-outfit">${over}</g>` }
}

/** A bunny suit: white with a pink belly, long ears, one bent at the tip, and a cotton tail at the tail's tip. */
export function bunny(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): OutfitDrawn {
  const white = '#F7F5FA'
  const pink = '#FFC2D1'
  let under = onesie(G, id, defs, chin, { base: white, belly: pink })
  under += `<circle cx="${f(G.tip[0])}" cy="${f(G.tip[1] - 1)}" r="3.6" fill="#FFFFFF" stroke="#E4E0EC" stroke-width="0.6"/>`
  let over = ''
  for (const m of [-1, 1]) {
    const x0 = m * G.hw * 0.3
    const y0 = G.topY(x0) + 3
    const ear =
      m < 0
        ? `<ellipse cx="0" cy="-10.5" rx="4.1" ry="11" fill="${white}" stroke="#DCD7E6" stroke-width="0.7"/>` + (detail >= 1 ? `<ellipse cx="0" cy="-10" rx="1.9" ry="8" fill="${pink}"/>` : '')
        : `<path d="M-4 0C-4.6 -8 -3.8 -15 0 -16.5C3 -17.6 7.6 -15 8.4 -11.6C6.4 -12.8 3.6 -13 3.4 -10C3.6 -6 4.2 -3 4 0Z" fill="${white}" stroke="#DCD7E6" stroke-width="0.7" stroke-linejoin="round"/>` +
          (detail >= 1 ? `<path d="M-1.6 -1.6C-2 -7.6 -1.4 -12.6 0.6 -13.8C1.6 -11 1.4 -7 1.6 -1.6Z" fill="${pink}"/>` : '')
    over += `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(m * 12)})"><g>${rock(animate, 0, 0, m * 7, 2.2, m > 0 ? 0.5 : 0)}${ear}</g></g>`
  }
  return { back: '', under, over: `<g class="fl-outfit">${over}</g>` }
}

/** Fairy wings: two pairs of shimmering panes on the back, with sparkles, fluttering slowly. */
export function fairy(G: Geometry, id: string, defs: string[], detail: number, animate: boolean): OutfitDrawn {
  const shimmer = `${id}fw`
  defs.push(`<linearGradient id="${shimmer}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3D6FF"/><stop offset="0.5" stop-color="#C9F2E4"/><stop offset="1" stop-color="#FFD9E6"/></linearGradient>`)
  const pane = (cx: number, cy: number, rx: number, ry: number, tilt: number) =>
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(tilt)} ${f(cx)} ${f(cy)})" fill="url(#${shimmer})" fill-opacity="0.9" stroke="#B9A5EE" stroke-width="0.7"/>`
  const side = (m: number) => {
    const ax = m * G.hw * 0.3
    const ay = -G.hh * 0.3
    const big = pane(m * (G.hw + 3), -G.hh * 0.85, 11, 7, m * 32)
    const small = pane(m * (G.hw + 1), -G.hh * 0.05, 7, 4.6, m * -22)
    const dots = detail >= 2 ? `<g fill="#FFFFFF"><circle cx="${f(m * (G.hw + 5))}" cy="${f(-G.hh * 0.95)}" r="0.9"/><circle cx="${f(m * (G.hw + 1))}" cy="${f(-G.hh * 0.7)}" r="0.6"/><circle cx="${f(m * (G.hw + 2.6))}" cy="${f(-G.hh * 0.05)}" r="0.6"/></g>` : ''
    return `<g>${rock(animate, ax, ay, m * 10, 1.1)}${big}${small}${dots}</g>`
  }
  const back = `<g class="fl-outfit fl-wings">${side(-1)}${side(1)}</g>`
  return { back, under: '', over: '' }
}

/** A superhero: a red cape from the shoulders streaming behind, waving; a gold badge on the chest; a mask over the eyes. */
export function superhero(G: Geometry, id: string, defs: string[], detail: number, chin: number, eyes: EyesAt, animate: boolean): OutfitDrawn {
  const red = '#E2373F'
  const deep = '#A8232B'
  const sh = -G.hh * 0.2
  // The cape streams out behind: to the left, the tail's side, which the drawing mirrors when the Flungie flies the other way.
  const cape = (wave: number) =>
    `M${f(G.hw * 0.55)} ${f(sh)}C${f(-G.hw * 0.2)} ${f(sh - 2)} ${f(-G.hw - 6)} ${f(sh - 4 + wave)} ${f(-G.hw - 15)} ${f(sh + 2 + wave)}` +
    `Q${f(-G.hw - 13)} ${f(G.hh * 0.35 - wave)} ${f(-G.hw - 16)} ${f(G.hh * 0.75 + wave)}Q${f(-G.hw - 8)} ${f(G.hh * 0.6 - wave)} ${f(-G.hw * 0.4)} ${f(G.hh * 0.85)}Z`
  const wave = animate ? `<animate attributeName="d" values="${cape(0)};${cape(3)};${cape(-1.5)};${cape(0)}" dur="1.4s" repeatCount="indefinite"/>` : ''
  const back = `<g class="fl-outfit fl-cape"><path d="${cape(0)}" fill="${red}" stroke="${deep}" stroke-width="0.8" stroke-linejoin="round">${wave}</path></g>`
  // The badge: a gold disc with a red star, under the chin.
  const top = Math.max(G.hh * 0.3, chin)
  const bx = G.hw * 0.18
  const by = Math.min(top + 4, G.hh - 4)
  let star = ''
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? 1.2 : 2.9
    star += `${i ? 'L' : 'M'}${f(bx + Math.cos(a) * r)} ${f(by + Math.sin(a) * r)}`
  }
  const clasp = `<circle cx="${f(G.hw * 0.55)}" cy="${f(sh)}" r="1.6" fill="#F5BC3C"/>`
  const under = `<g class="fl-outfit"><circle cx="${f(bx)}" cy="${f(by)}" r="4.4" fill="#F5BC3C" stroke="${deep}" stroke-width="0.6"/><path d="${star}Z" fill="${red}"/>${clasp}</g>`
  // The mask: a band across the eyes with a hole round each, its ties fluttering out behind.
  const r = eyes.r
  const hw = eyes.s + r * 2.6
  const band = `M${f(eyes.x - hw)} ${f(eyes.y - r * 0.8)}Q${f(eyes.x)} ${f(eyes.y - r * 2.4)} ${f(eyes.x + hw)} ${f(eyes.y - r * 0.8)}Q${f(eyes.x + hw + 0.6)} ${f(eyes.y + r * 1.6)} ${f(eyes.x + eyes.s)} ${f(eyes.y + r * 2)}Q${f(eyes.x)} ${f(eyes.y + r * 0.9)} ${f(eyes.x - eyes.s)} ${f(eyes.y + r * 2)}Q${f(eyes.x - hw - 0.6)} ${f(eyes.y + r * 1.6)} ${f(eyes.x - hw)} ${f(eyes.y - r * 0.8)}Z`
  const hole = (x: number) => `M${f(x - r * 1.5)} ${f(eyes.y)}A${f(r * 1.5)} ${f(r * 1.6)} 0 1 0 ${f(x + r * 1.5)} ${f(eyes.y)}A${f(r * 1.5)} ${f(r * 1.6)} 0 1 0 ${f(x - r * 1.5)} ${f(eyes.y)}Z`
  const tx = eyes.x - hw
  const ties = `<g>${rock(animate, tx, eyes.y, 14, 0.9)}<path d="M${f(tx)} ${f(eyes.y)}q-4 -1.6 -7.4 -0.6q2.4 1.6 0.2 3.6q3.4 -0.4 7.2 -1.6Z" fill="${deep}"/></g>`
  const over = `<g class="fl-outfit fl-mask">${ties}<path d="${band}${hole(eyes.x - eyes.s)}${hole(eyes.x + eyes.s)}" fill="${detail >= 1 ? red : deep}" fill-rule="evenodd" stroke="${deep}" stroke-width="0.6"/></g>`
  return { back, under, over }
}

/** A wizard's robe: deep purple from the chin down, gold trim at the collar, and gold stars and a moon that twinkle. */
export function wizard(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): string {
  const top = Math.max(G.hh * 0.26, chin)
  const { clip, shade, w, bottom, base } = suitBase(G, id, defs, top, '#5B3FA8')
  const gold = '#F5BC3C'
  const inside: string[] = [base]
  const spots: [number, number, number][] = [
    [-0.55, 0.35, 1.8],
    [0.35, 0.25, 1.4],
    [-0.1, 0.7, 1.6],
    [0.62, 0.75, 1.3],
    [-0.75, 0.95, 1.2],
  ]
  spots.forEach(([kx, ky, r], i) => {
    const x = kx * G.hw
    const y = top + ky * (G.hh - top + 4)
    if (y > bottom - 2) return
    const twinkle = animate ? `<animate attributeName="opacity" values="1;0.35;1" dur="${f(1.8 + (i % 3) * 0.6)}s" begin="${f(i * 0.35)}s" repeatCount="indefinite"/>` : ''
    inside.push(`<path d="M${f(x)} ${f(y - r * 1.6)}L${f(x + r * 0.45)} ${f(y - r * 0.45)}L${f(x + r * 1.6)} ${f(y)}L${f(x + r * 0.45)} ${f(y + r * 0.45)}L${f(x)} ${f(y + r * 1.6)}L${f(x - r * 0.45)} ${f(y + r * 0.45)}L${f(x - r * 1.6)} ${f(y)}L${f(x - r * 0.45)} ${f(y - r * 0.45)}Z" fill="${gold}">${twinkle}</path>`)
  })
  if (detail >= 2) {
    // A crescent moon on the front side.
    const mx = G.hw * 0.2
    const my = top + (G.hh - top) * 0.55
    inside.push(`<path d="M${f(mx)} ${f(my - 2.6)}A2.6 2.6 0 1 0 ${f(mx)} ${f(my + 2.6)}A2 2 0 1 1 ${f(mx)} ${f(my - 2.6)}Z" fill="${gold}"/>`)
  }
  inside.push(`<rect x="${f(-w)}" y="${f(top)}" width="${f(w * 2)}" height="${f(bottom - top)}" fill="url(#${shade})"/>`)
  inside.push(`<path d="M${f(-w)} ${f(top + 0.6)}H${f(w)}" stroke="${gold}" stroke-width="1.4"/>`)
  return `<g class="fl-outfit" clip-path="url(#${clip})">${inside.join('')}</g>`
}

/** A chunky striped scarf round the neck, its end hanging off the back side with a fringe, swinging in the wind. */
export function scarf(G: Geometry, id: string, defs: string[], detail: number, chin: number, animate: boolean): string {
  const red = '#E2373F'
  const cream = '#FFF4E0'
  const y = Math.max(G.hh * 0.2, chin - 1)
  const clip = clipOf(G, id, defs, false)
  const w = G.hw + 4
  const stripes: string[] = []
  for (let x = -w, k = 0; x < w; x += 3, k++) stripes.push(`<rect x="${f(x)}" y="${f(y - 2.8)}" width="3" height="5.6" fill="${k % 2 ? cream : red}"/>`)
  const wrap = `<g clip-path="url(#${clip})">${stripes.join('')}<path d="M${f(-w)} ${f(y + 2.8)}H${f(w)}" stroke="#000000" stroke-width="0.8" opacity="0.15"/></g>`
  // The end: from the back side of the wrap, down and out, striped across, with a fringe.
  const ex = -G.edgeX(y) + 1.6
  const len = Math.min(13, G.hh * 0.75)
  let end = `<path d="M${f(ex)} ${f(y - 2)}L${f(ex - 4.6)} ${f(y + len)}L${f(ex - 0.6)} ${f(y + len + 0.8)}L${f(ex + 3)} ${f(y + 1)}Z" fill="${red}"/>`
  if (detail >= 1) for (let k = 1; k < 3; k++) end += `<path d="M${f(ex - (4.6 * k) / 3 + 0.4)} ${f(y - 2 + ((len + 2) * k) / 3)}l3.8 0.4" stroke="${cream}" stroke-width="1.8"/>`
  if (detail >= 2) for (let k = 0; k < 4; k++) end += `<path d="M${f(ex - 4.4 + k * 1.3)} ${f(y + len + 0.3)}l-0.2 2" stroke="${red}" stroke-width="0.7" stroke-linecap="round"/>`
  return `<g class="fl-outfit">${wrap}<g>${rock(animate, ex, y, 9, 1.8)}${end}</g></g>`
}
