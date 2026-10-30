import { contrast, distance, mix } from '../colour.js'
import { INK, labelOf, PAPER, WHITE } from '../data.js'
import { clamp, f } from '../random.js'
import type { Theme } from '../traits.js'
import { byMarkId, MARK_CENTRES, MARK_LINE_PAIRS, MARK_PAIRS, MARK_PATTERNS, MARK_RHYTHMS, MARK_SCALES, type MarkLinePair, type MarkPair } from './data.js'
import { type MarkConfig, markInitials, type MarkOverrides, markPalette, type MarkShading, type MarkTraits, markTraits, pairOf } from './traits.js'

// Coordinates: a 100 unit square, y down. The tile is a rounded square with a 22 unit radius; it is never a circle.

/** The smallest size the light sweep is drawn at: below it the walls it catches are too thin to see. */
export const MARK_SWEEP_MIN = 64

export interface MarkRenderOptions {
  /** Pixels, crisp from 20 to 512. Under 32 the pattern is bolder; from 64 it gains its signature and grain. Default 64. */
  size?: number | undefined
  /** 'light' or 'dark'. The mark keeps its colours in both, and only gains a rim where it would melt into the page. */
  theme?: Theme | undefined
  /** 'auto' (from `name`, else the seed), a string, or false for none. Under 24 px one letter shows. Default 'auto'. */
  initials?: string | boolean | undefined
  /** The workspace's display name, for 'auto' initials. */
  name?: string | undefined
  /** false turns the grain off; it only ever appears from 64 px. */
  grain?: boolean | undefined
  /** A slow light sweep across the relief, from MARK_SWEEP_MIN. Hidden under prefers-reduced-motion. */
  animate?: boolean | undefined
  /** The prefix of the SVG's internal ids. Set it to render the same id on a server and in a browser. */
  id?: string | undefined
  /** Colour pairs to resolve the trait's pair from, as MarkConfig.palette. */
  palette?: readonly MarkPair[] | undefined
}

const FONT = `'Funnel Display', 'Rethink Sans', system-ui, sans-serif`
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

function resolveInitials(t: MarkTraits, initials: string | boolean, name: string | undefined, size: number): string {
  if (initials === false) return ''
  const max = size < 24 ? 1 : 2
  const raw = initials === 'auto' || initials === true ? markInitials(name ?? t.seed, max) : initials.toUpperCase()
  return [...raw].slice(0, max).join('')
}

// Pattern geometry --------------------------------------------------------------------------------------------------
// Each returns one path for every feature, so the relief is three draws of it.

export interface MarkGeometry {
  kind: 'fill' | 'stroke'
  d: string
  /** The stroke width, for 'stroke'. */
  width: number
  /** Degrees the pattern is turned about the centre. */
  angle: number
}

const rr = (x: number, y: number, w: number, h: number, radius: number): string => {
  const r = Math.min(radius, w / 2, h / 2)
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  )
}

function tilesPath(t: MarkTraits, pitch: number): string {
  // The brand grid: rounded squares 0.78 of the pitch, corners 0.29 of the side.
  const side = pitch * 0.78
  const r = side * 0.29
  const ox = t.phase[0] * pitch
  const oy = t.phase[1] * pitch
  let d = ''
  for (let y = -40 + oy; y < 140; y += pitch) for (let x = -40 + ox; x < 140; x += pitch) d += rr(x - side / 2, y - side / 2, side, side, r)
  return d
}

function linesPath(t: MarkTraits, pitch: number, tiny: boolean): string {
  // Rows of capsules; each row starts at its own place in the rhythm, as the covers' rows do.
  const R = (byMarkId(MARK_RHYTHMS, t.rhythm) ?? MARK_RHYTHMS[0])!.lengths
  const thick = pitch * (tiny ? 0.5 : 0.46)
  const gap = thick * 1.15
  const unit = pitch * 3.1
  let d = ''
  let row = 0
  for (let y = -40 + t.phase[1] * pitch; y < 140; y += pitch, row++) {
    let k = (row * 3 + Math.floor(t.phase[2] * R.length)) % R.length
    let x = -40 - unit * ((row * 0.37 + t.phase[0]) % 1)
    while (x < 140) {
      const len = Math.max(thick, (R[k % R.length] as number) * unit)
      d += rr(x, y - thick / 2, len, thick, thick / 2)
      x += len + gap
      k++
    }
  }
  return d
}

function ripplesPath(t: MarkTraits, step: number): string {
  // Rings of a rounded square that soften into circles as they spread, round a small core: the covers' ripples.
  const C = (byMarkId(MARK_CENTRES, t.centre) ?? MARK_CENTRES[0])!
  const h0 = step * 0.42
  const m0 = step * (0.85 + t.phase[0] * 0.3)
  let d = rr(C.x - h0, C.y - h0, h0 * 2, h0 * 2, h0 * 0.5)
  for (let k = 0; k < 24; k++) {
    const r = m0 + k * step
    const half = h0 + r
    if (r > 160) break
    d += rr(C.x - half, C.y - half, half * 2, half * 2, r + h0 * 0.5)
  }
  return d
}

/** The pattern's features for a trait set at a size: under 32 px fewer, bolder features. */
export function markGeometry(t: MarkTraits, size = 64): MarkGeometry {
  const tiny = size < 32
  const S = (byMarkId(MARK_SCALES, t.scale) ?? MARK_SCALES[1])!
  const boost = tiny ? 1.55 : 1
  if (t.pattern === 'lines') return { kind: 'fill', d: linesPath(t, S.lines * boost, tiny), width: 0, angle: t.angle * 0.5 }
  if (t.pattern === 'ripples') {
    const step = S.ripples * boost
    return { kind: 'stroke', d: ripplesPath(t, step), width: step * (tiny ? 0.42 : 0.32), angle: t.angle * 0.4 }
  }
  return { kind: 'fill', d: tilesPath(t, S.tiles * boost), width: 0, angle: t.angle }
}

// Rendering ---------------------------------------------------------------------------------------------------------

let counter = 0

/**
 * An SVG string for a trait set.
 *   size      pixels; under 32 the pattern is bolder and the relief a gradient, from 64 the signature and grain appear
 *   theme     'light' or 'dark': the mark keeps its colours, and gains a rim only where it would melt into the page
 *   initials  'auto' (from name, else the seed), a string, or false for none
 *   name      the workspace's display name, for 'auto' initials
 *   grain     false turns the grain off
 *   animate   a slow light sweep across the relief, from MARK_SWEEP_MIN
 *   id        the prefix of the internal ids, for a server render that a browser hydrates
 */
export function renderMark(t: MarkTraits, options: MarkRenderOptions = {}): string {
  const { size = 64, theme = 'light', initials = 'auto', name, grain = true, animate = false, palette: list = MARK_PAIRS } = options
  const id = options.id ? `wm${options.id.replace(/[^A-Za-z0-9_-]/g, '')}` : `wm${t.hash.toString(36)}${(counter++).toString(36)}`
  const tiny = size < 32
  const upx = 100 / size // units per pixel
  const pair = pairOf(t, list)
  const P = markPalette(pair)
  const G = markGeometry(t, size)
  const emboss = t.finish !== 'deboss'
  const letters = resolveInitials(t, initials, name, size)
  const page = theme === 'dark' ? INK : PAPER
  const sweep = animate && size >= MARK_SWEEP_MIN
  const defs: string[] = []
  const out: string[] = []
  defs.push(`<clipPath id="${id}c"><rect width="100" height="100" rx="22"/></clipPath>`)

  // Ground: the brand wash's direction, the ground at the top left into the tone at the bottom right.
  defs.push(
    `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="92" y2="100">` +
      `<stop offset="0" stop-color="${mix(pair.ground, WHITE, P.dark ? 0.06 : 0.12)}"/><stop offset="0.5" stop-color="${pair.ground}"/>` +
      `<stop offset="1" stop-color="${pair.tone}"/></linearGradient>`,
  )
  const inner = [`<rect width="100" height="100" fill="url(#${id}g)"/>`]

  // The calm zone: the pattern fades out behind the letters, as it does behind the logo on the covers.
  let mask = ''
  if (letters) {
    const rx = letters.length > 1 ? 40 : 30
    defs.push(
      `<radialGradient id="${id}mg" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="${rx}" gradientTransform="translate(50 50) scale(1 ${tiny ? 0.95 : 0.88}) translate(-50 -50)">` +
        `<stop offset="${tiny ? 0.3 : 0.42}" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>`,
    )
    defs.push(`<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="url(#${id}mg)"/></mask>`)
    mask = ` mask="url(#${id}m)"`
  }

  // The relief. One path holds every feature; it is drawn as a lit edge, a shaded edge and a face that matches the ground,
  // so only the walls show, as on the covers. Raised: light from the top left. Pressed: the same edges swapped.
  const paint = (fill: string) => (G.kind === 'stroke' ? `fill="none" stroke="${fill}" stroke-width="${f(G.width)}"` : `fill="${fill}"`)
  defs.push(`<path id="${id}p" d="${G.d}"/>`)
  const rot = G.angle ? ` transform="rotate(${f(G.angle)} 50 50)"` : ''
  // The faces wear the ground gradient turned back by the pattern's lean, so they match the ground exactly.
  defs.push(`<linearGradient id="${id}gr" href="#${id}g" gradientTransform="rotate(${f(-G.angle)} 50 50)"/>`)
  const relief: string[] = []
  if (tiny) {
    // Under 32 px the walls would be sub-pixel: the relief is a gradient across each feature instead.
    const [a, b] = emboss ? [P.hi, P.lo] : [P.lo, P.hi]
    defs.push(
      `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="${emboss ? 0.75 : 0.6}"/>` +
        `<stop offset="1" stop-color="${b}" stop-opacity="${emboss ? 0.6 : 0.4}"/></linearGradient>`,
    )
    relief.push(`<use href="#${id}p" ${paint(`url(#${id}r)`)}/>`)
  } else {
    const d = clamp(size / 90, 0.8, 2.6) * upx
    const lit = emboss ? -d : d
    const shade = emboss ? d : -d
    const sheen = G.kind === 'stroke'
      ? `fill="none" stroke="${emboss ? '#FFFFFF' : P.lo}" stroke-opacity="0.1" stroke-width="${f(G.width)}"`
      : emboss ? `fill="#FFFFFF" fill-opacity="0.1"` : `fill="${P.lo}" fill-opacity="0.1"`
    relief.push(
      `<use href="#${id}p" transform="translate(${f(shade)} ${f(shade)})" ${paint(P.lo)} opacity="${P.loOpacity}"/>`,
      `<use href="#${id}p" transform="translate(${f(lit)} ${f(lit)})" ${paint(P.hi)} opacity="${P.hiOpacity}"/>`,
      `<use href="#${id}p" ${paint(`url(#${id}gr)`)}/>`,
      `<use href="#${id}p" ${sheen}/>`,
    )
  }
  inner.push(`<g${mask}><g${rot}>${relief.join('')}</g></g>`)

  // The light sweep: a soft band, masked to the relief's lit edges, that crosses the tile every nine seconds.
  if (sweep) {
    defs.push(
      `<linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>` +
        `<stop offset="0.5" stop-color="#FFFFFF" stop-opacity="${P.dark ? 0.5 : 0.85}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`,
    )
    defs.push(
      `<mask id="${id}wm" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><g${rot}>` +
        `<use href="#${id}p" transform="translate(${f(-3.2 * upx)} ${f(-3.2 * upx)})" ${paint('#fff')}/></g></mask>`,
    )
    const band =
      `<rect x="-120" y="-40" width="44" height="180" fill="url(#${id}w)" transform="rotate(20 50 50)">` +
      `<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;260 0;260 0" keyTimes="0;0.55;1" dur="9s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.35 1;0 0 1 1"/></rect>`
    inner.push(`<g class="wm-sweep"${mask}><g mask="url(#${id}wm)">${band}</g><g opacity="0.16">${band}</g></g>`)
  }

  // Grain: fine specks of light and dark, sized in pixels, from 64 px.
  if (grain && size >= 64) {
    const bf = f(clamp((0.85 * size) / 100, 0.5, 2.4))
    const k = P.dark ? 0.5 : 0.7
    defs.push(
      `<filter id="${id}n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="2" seed="${t.hash % 997}" result="n"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${k} 0 0 0 ${f(-k * 0.58)}" result="hi"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${-k} 0 0 ${f(k * 0.42)}" result="lo"/>` +
        `<feMerge><feMergeNode in="hi"/><feMergeNode in="lo"/></feMerge></filter>`,
    )
    inner.push(`<rect width="100" height="100" filter="url(#${id}n)" opacity="0.55"/>`)
  }

  // Signature: the logo's two speed lines, small, in a corner, from 64 px; smaller, they crowd the letters.
  if (size >= 64 && t.signature !== 'none') {
    const L = pickLines(P)
    const th = clamp(3.4, 1.6 * upx, 6)
    const gap = th * 0.75
    const L1 = 13
    const L2 = 8
    const m = 13
    const right = t.signature.endsWith('Right')
    const top = t.signature.startsWith('top')
    const y1 = top ? m : 100 - m - gap - th
    const x1 = right ? 100 - m - L1 : m
    // The lower line is shorter and sits back from the throw, as in the logo.
    const x2 = right ? 100 - m - L2 - 3 : m + 3
    const cap = (x: number, y: number, len: number, col: string) => `<path d="${rr(x, y, len, th, th / 2)}" fill="${col}"/>`
    inner.push(
      `<g class="wm-sig"><g fill-opacity="0.35" opacity="0.6" transform="translate(${f(0.8 * upx)} ${f(0.8 * upx)})">` +
        cap(x1, y1, L1, P.lo) + cap(x2, y1 + gap + th, L2, P.lo) + `</g>` +
        cap(x1, y1, L1, L.top) + cap(x2, y1 + gap + th, L2, L.bottom) + `</g>`,
    )
  }

  // The letters, in Funnel Display at 750, with a soft pressed shadow under them from 32 px.
  if (letters) {
    const two = letters.length > 1
    const fs = tiny ? (two ? 46 : 60) : two ? 40 : 52
    const y = 50 + fs * 0.355
    const ls = two ? ' letter-spacing="-1.2"' : ''
    const text = (fill: string, extra = '') =>
      `<text x="50" y="${f(y)}" text-anchor="middle" font-family="${FONT}" font-weight="750" font-size="${fs}"${ls} fill="${fill}"${extra}>${esc(letters)}</text>`
    if (!tiny) {
      const o = clamp(size / 110, 0.7, 2) * upx
      const shadow = ` transform="translate(${f(o * 0.8)} ${f(o * 1.1)})"`
      inner.push(P.letter === INK ? text(P.hi, ` opacity="0.7"${shadow}`) : text(P.lo, ` opacity="0.6"${shadow}`))
    }
    inner.push(text(P.letter, ' class="wm-letter"'))
  }

  // The object's own edge: a lit top rim and a shaded foot, and a page-coloured rim where the tile would melt away.
  const ew = clamp(1.1 * upx, 0.6, 3)
  defs.push(
    `<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${P.dark ? 0.22 : 0.5}"/>` +
      `<stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.7" stop-color="${P.lo}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${P.lo}" stop-opacity="${P.dark ? 0.5 : 0.35}"/></linearGradient>`,
  )
  inner.push(`<rect x="${f(ew / 2)}" y="${f(ew / 2)}" width="${f(100 - ew)}" height="${f(100 - ew)}" rx="${f(22 - ew / 2)}" fill="none" stroke="url(#${id}e)" stroke-width="${f(ew)}"/>`)
  out.push(`<g clip-path="url(#${id}c)">${inner.join('')}</g>`)
  if (contrast(P.mid, page) < 1.5) {
    const rim = theme === 'dark' ? mix(P.ground, WHITE, 0.18) : mix(P.ground, INK, 0.16)
    const rw = clamp(upx, 0.5, 2)
    out.push(`<rect x="${f(rw / 2)}" y="${f(rw / 2)}" width="${f(100 - rw)}" height="${f(100 - rw)}" rx="${f(22 - rw / 2)}" fill="none" stroke="${rim}" stroke-width="${f(rw)}"/>`)
  }

  const style = sweep ? '<style>@media (prefers-reduced-motion: reduce){.wm-sweep{display:none}}</style>' : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(describeMark(t, letters, list))}">` +
    `${style}<defs>${defs.join('')}</defs>${out.join('')}</svg>`
  )
}

/** The accessible name of a mark: "Workspace mark NS: Peach into coral tiles". */
export function describeMark(t: MarkTraits, letters = '', list: readonly MarkPair[] = MARK_PAIRS): string {
  return `Workspace mark${letters ? ` ${letters}` : ''}: ${pairOf(t, list).label} ${labelOf(MARK_PATTERNS, t.pattern).toLowerCase()}`
}

function pickLines(P: MarkShading): MarkLinePair {
  // The brand pair when it stands clear of the tile, else the pair that stands furthest from it.
  let best = MARK_LINE_PAIRS[0] as MarkLinePair
  let bestScore = -1
  for (const L of MARK_LINE_PAIRS) {
    const score = Math.min(distance(L.top, P.mid), distance(L.bottom, P.mid)) + (L.id === 'brand' ? 0.06 : 0)
    if (score > bestScore) {
      bestScore = score
      best = L
    }
  }
  return best
}

export interface MarkOptions extends MarkRenderOptions, MarkConfig {
  /** Traits to set instead of the seed's ({ pattern: 'ripples' }). */
  overrides?: MarkOverrides | undefined
}

/** The seed in, an SVG string out. Seed with the workspace's ID and pass its name for the initials. */
export function workspaceMark(seed: unknown, options: MarkOptions = {}): string {
  return renderMark(markTraits(seed, options.overrides, options), options)
}

/**
 * The calm fallback: a rounded square tinted from the same pair, with the initials in Funnel Display. For places that want
 * no pattern at all (dense pickers, print). The letters hold at least 4.5:1.
 */
export function plainMark(seed: unknown, options: MarkOptions = {}): string {
  const { size = 64, theme = 'light', initials = 'auto', name } = options
  const t = markTraits(seed, options.overrides, options)
  const pair = pairOf(t, options.palette)
  const letters = resolveInitials(t, initials, name, size)
  const dark = theme === 'dark'
  const bg = dark ? mix(pair.ground, INK, 0.72) : mix(pair.ground, WHITE, 0.68)
  let fg = dark ? mix(pair.ground, WHITE, 0.35) : mix(pair.ground, INK, 0.62)
  if (contrast(fg, bg) < 4.5) fg = dark ? mix(pair.ground, WHITE, 0.7) : mix(pair.ground, INK, 0.8)
  const two = letters.length > 1
  const fs = size < 32 ? (two ? 44 : 56) : two ? 38 : 48
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(`Workspace ${letters}`.trim())}">` +
    `<rect width="100" height="100" rx="22" fill="${bg}"/>` +
    (letters
      ? `<text x="50" y="${f(50 + fs * 0.355)}" text-anchor="middle" font-family="${FONT}" font-weight="750" font-size="${fs}"${two ? ' letter-spacing="-1"' : ''} fill="${fg}">${esc(letters)}</text>`
      : '') +
    `</svg>`
  )
}
