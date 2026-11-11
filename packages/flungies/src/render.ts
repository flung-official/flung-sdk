import { ACC_DRAW, type DrawContext, type Drawn } from './accessories.js'
import { contrast, luminance, mix } from './colour.js'
import { type Accessory, ACCESSORIES, byId, type Colour, COLOURS, INK, labelOf, PAPER, SHAPES, WHITE } from './data.js'
import { type Geometry, geometry, toWorld } from './geometry.js'
import { type Expression, expressionOf } from './expressions.js'
import { clamp, f } from './random.js'
import { aura, auraFront } from './auras.js'
import { outfit } from './outfits/index.js'
import { pants } from './pants.js'
import { faceTattoo, piercing } from './face-marks.js'
import { hair } from './hair.js'
import { pattern } from './patterns.js'
import { pet } from './pets.js'
import { tattoo } from './tattoos.js'
import { colourOf, colours, type FlungieConfig, type Overrides, type Shading, type Theme, type Traits, traits, wornAccessories } from './traits.js'

export type Layer = 'disc' | 'shadow' | 'lines' | 'back' | 'body' | 'face' | 'front'
export type Variant = 'disc' | 'square' | 'bare'

export const LAYERS: readonly Layer[] = ['disc', 'shadow', 'lines', 'back', 'body', 'face', 'front']

export interface RenderOptions {
  /** Pixels. Under 32 the drawing simplifies; from 80 the body gets its felt texture. Default 64. */
  size?: number | undefined
  /** Picks the disc and checks contrast against the ground. Default 'light'. */
  theme?: Theme | undefined
  /** 'disc' (default), 'square' (a rounded tile) or 'bare' (no ground). */
  variant?: Variant | undefined
  /** false turns the felt filter off at every size. */
  texture?: boolean | undefined
  /** A subset of LAYERS. The WebGL renderer draws the body itself. */
  layers?: readonly Layer[] | undefined
  /** With variant 'bare': the colour the Flungie sits on, for the rim check. Defaults to the theme's page colour. */
  ground?: string | undefined
  /** The prefix of the SVG's internal ids. Set it to render the same id on a server and in a browser. */
  id?: string | undefined
  /** Body colours to resolve the trait's colour from, as FlungieConfig.palette. */
  palette?: readonly Colour[] | undefined
  /** What it is feeling: its face for the moment (EXPRESSIONS). Left out: its `mood`, which is 'neutral', the seed's own face, until one is put on. */
  expression?: Expression | undefined
  /** Plays an aura's motion, and an outfit's or accessory's (SMIL, no stylesheet needed). Leave it off where motion is reduced. Default false: a still frame. */
  animate?: boolean | undefined
}

let counter = 0

/**
 * An SVG string for a trait set.
 *   size     pixels; under 32 the drawing simplifies (no lines, blush or mouth, bigger eyes, thicker strokes) and from 80
 *            the body gets its felt texture
 *   theme    'light' or 'dark': picks the disc and checks contrast against the ground
 *   variant  'disc' (default), 'square' (a rounded tile) or 'bare' (no ground)
 *   texture  false turns the felt filter off at every size
 *   layers   a subset of disc, shadow, lines, back, body, face, front (the WebGL renderer draws the body itself)
 *   expression  the face for the moment: happy, cute, mad, sad, thinking, surprised, sleepy (neutral is the seed's own)
 */
export function render(t: Traits, options: RenderOptions = {}): string {
  const { size = 64, theme = 'light', variant = 'disc', texture = true, layers = LAYERS, ground, palette: list = COLOURS } = options
  const id = options.id ? `fl${options.id.replace(/[^A-Za-z0-9_-]/g, '')}` : `fl${t.hash.toString(36)}${(counter++).toString(36)}`
  const tiny = size < 32
  const detail = tiny ? 0 : size < 64 ? 1 : 2
  const felt = texture && size >= 80 && layers.includes('body')
  const G = geometry(t, tiny)
  const K = colours(t, theme, list)
  const { P, A, A2 } = K
  const k = tiny ? 1.14 : 1 // tiny Flungies fill more of the disc
  const upx = 100 / (size * k) // units per pixel
  const sw = (u: number, minPx = tiny ? 0.95 : 0.6) => f(Math.max(u, minPx * upx))
  const has = (l: Layer) => layers.includes(l)
  const mirror = t.side === 'right'
  const groundHex = variant === 'bare' ? ground || (theme === 'dark' ? INK : PAPER) : K.disc
  const defs: string[] = []
  const out: string[] = []

  // Ground.
  const clip = variant === 'bare' ? null : `${id}c`
  if (clip) defs.push(`<clipPath id="${clip}">${variant === 'square' ? '<rect width="100" height="100" rx="22"/>' : '<circle cx="50" cy="50" r="50"/>'}</clipPath>`)
  if (has('disc') && variant !== 'bare') out.push(variant === 'square' ? `<rect width="100" height="100" rx="22" fill="${K.disc}"/>` : `<circle cx="50" cy="50" r="50" fill="${K.disc}"/>`)

  const inner: string[] = []
  // Ground shadow: the Flungie is in the air, so it is soft and a little behind.
  const bottom = toWorld(G, [0, G.hh])
  // An aura, behind everything but the ground: a glow, bubbles, a ring.
  if (has('disc') && t.aura !== 'none') inner.push(aura(t.aura, G.cx, G.cy, id, defs, P.base, detail, options.animate === true))
  if (has('shadow') && !tiny) {
    const sc = theme === 'dark' ? '#000000' : mix(groundHex, '#2A1F45', 0.7)
    defs.push(`<radialGradient id="${id}s"><stop offset="0" stop-color="${sc}" stop-opacity="${theme === 'dark' ? 0.5 : 0.28}"/><stop offset="1" stop-color="${sc}" stop-opacity="0"/></radialGradient>`)
    inner.push(`<ellipse class="fl-shadow" cx="${f(G.cx - 2)}" cy="${f(Math.min(93, bottom[1] + 13))}" rx="${f(G.hw * 0.9)}" ry="${f(3.4)}" fill="url(#${id}s)"/>`)
  }
  // Speed lines, behind the body on the trailing side.
  if (has('lines') && !tiny) {
    const up = toWorld(G, [-G.edgeX(-G.hh * 0.14), -G.hh * 0.14])
    const lo = toWorld(G, [-G.edgeX(G.hh * 0.45), G.hh * 0.45])
    const tipW = toWorld(G, G.tip)
    const w = sw(4.8)
    const uHead = up[0] - 4.2
    const lHead = Math.min(lo[0], tipW[0] + 3) - 4.6
    inner.push(
      `<g class="fl-lines" stroke-linecap="round" stroke-width="${w}">` +
        `<path d="M${f(Math.max(5.5, uHead - 12))} ${f(up[1])}H${f(uHead)}" stroke="${K.pair.top}"/>` +
        `<path d="M${f(Math.max(4.5, lHead - 8))} ${f(lo[1] + 1.5)}H${f(lHead)}" stroke="${K.pair.bottom}"/></g>`,
    )
  }

  // Everything that breathes: accessories, body, face. Drawn in the body frame.
  const expression = options.expression ?? (t.mood !== undefined && t.mood !== 'neutral' ? (t.mood as Expression) : undefined)
  const ctx = { G, P, A, A2, detail, sw, id, defs, t, expression, animate: options.animate === true, eyeR: 0, eyeAt: { x: 0, y: 0, s: 0, eyes: t.eyes } }
  const face = faceParts(ctx)
  // Every accessory worn, one in each slot (a hat, glasses, something held), each in its own colours; head first, so what is
  // held is drawn in front of the rest.
  const worn: Drawn[] = K.worn.map((one) => ACC_DRAW[one.id]?.({ ...ctx, A: one.A, A2: one.A2 } as DrawContext) || {})
  const acc: Drawn = { back: worn.map((one) => one.back ?? '').join(''), front: worn.map((one) => one.front ?? '').join('') }
  const body: string[] = []
  // An outfit goes over pants and under the face, except a ghost's sheet or a mummy's wrappings, which go over the face with
  // eye holes of their own; a cape goes behind the body.
  const dressed = has('face') || has('back') ? outfit(t.outfit ?? 'none', G, id, defs, detail, { x: ctx.eyeAt.x, y: ctx.eyeAt.y, s: ctx.eyeAt.s, r: ctx.eyeR }, options.animate === true) : null
  if (has('back') && dressed?.back) body.push(dressed.back)
  if (has('back') && acc.back) body.push(acc.back)
  if (has('body')) body.push(bodyLayer(ctx, { felt, size, groundHex }))
  // Tattoos are in the skin: a face tattoo goes with the body tattoo, under pants, outfits, the eyes and every accessory, so
  // anything worn sits over it. A piercing goes over the face and under what covers it (a scarf, a ghost's sheet).
  const faceAt = { x: ctx.eyeAt.x, y: ctx.eyeAt.y, s: ctx.eyeAt.s, r: ctx.eyeR }
  // A pattern is the felt itself, under the tattoos. Hair sits on the head over the outfit and under the face, the hats and the
  // glasses; something on the head hides its top.
  const skin = pattern(t.pattern ?? 'none', G, P, faceAt, id, defs, detail) + tattoo(t.tattoo, G, P, detail) + faceTattoo(t.faceTattoo ?? 'none', faceAt, P, detail)
  const head = K.worn.find((one) => one.slot === 'head')?.id
  const hairdo = hair(t.hair ?? 'none', G, P, faceAt, detail, head !== undefined && head !== 'halo')
  if (has('face')) body.push(skin + pants(t.pants, G, id, defs, detail, options.animate === true) + (dressed?.under ?? '') + hairdo + face + piercing(t.piercing ?? 'none', faceAt, detail) + (dressed?.over ?? ''))
  if (has('front') && acc.front) body.push(acc.front)
  inner.push(`<g class="fl-breathe" data-ax="${f(bottom[0])}" data-ay="${f(bottom[1])}"><g transform="translate(${f(G.cx)} ${f(G.cy)}) rotate(${f(G.tilt)})">${body.join('')}</g></g>`)
  // The near side of an aura that goes round the body (the orbit), over the body and what it wears.
  if (has('front') && t.aura !== 'none') inner.push(auraFront(t.aura, G.cx, G.cy, id, defs, detail, options.animate === true))
  // A pet floats beside it, ahead, or behind when a balloon is up ahead.
  if (has('front') && (t.pet ?? 'none') !== 'none') inner.push(pet(t.pet, G, detail, options.animate === true, t.held === 'balloon' || t.accessory === 'balloon' ? -1 : 1))

  let g = inner.join('')
  if (mirror) g = `<g transform="matrix(-1 0 0 1 100 0)">${g}</g>`
  if (k !== 1) g = `<g transform="translate(50 52) scale(${k}) translate(-50 -52)">${g}</g>`
  if (clip) g = `<g clip-path="url(#${clip})">${g}</g>`
  out.push(g)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${describe(t, list)}" data-mirror="${mirror ? 1 : 0}"><defs>${defs.join('')}</defs>${out.join('')}</svg>`
}

/** Brows over both eyes: angry slopes down to the middle, worried up to it, raised arcs high, quizzical lifts the front one. */
function brows(shape: string, back: number, front: number, ey: number, R: number, ink: string, sw: (u: number, minPx?: number) => number): string {
  const y = ey - R * 2
  const w = R * 1.15
  const st = `fill="none" stroke="${ink}" stroke-width="${sw(1.1)}" stroke-linecap="round"`
  const line = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" ${st}/>`
  const arcOver = (x: number, lift: number) => `<path d="M${f(x - w)} ${f(y - lift + 0.6)}Q${f(x)} ${f(y - lift - 1.2)} ${f(x + w)} ${f(y - lift + 0.6)}" ${st}/>`
  let inner = ''
  if (shape === 'angry') inner = line(back - w, y - 1, back + w * 0.8, y + 1.1) + line(front - w * 0.8, y + 1.1, front + w, y - 1)
  if (shape === 'worried') inner = line(back - w, y + 0.9, back + w * 0.8, y - 1) + line(front - w * 0.8, y - 1, front + w, y + 0.9)
  if (shape === 'raised') inner = arcOver(back, 1.4) + arcOver(front, 1.4)
  if (shape === 'quizzical') inner = line(back - w, y + 0.3, back + w, y + 0.3) + arcOver(front, 1.8)
  return `<g class="fl-brows">${inner}</g>`
}

/** The expression's one small extra, in the body's frame: a tear, a flush, sparkles, a thought, or a sleepy z. */
function extra(kind: string, back: number, front: number, ey: number, R: number, G: Geometry, sw: (u: number, minPx?: number) => number): string {
  const top = -G.hh
  switch (kind) {
    case 'tear':
      return `<path class="fl-tear" d="M${f(back - 0.6)} ${f(ey + R + 0.6)}q-1.7 2.6 0 3.6q1.7 -1 0 -3.6Z" fill="#86C0FF"/>`
    case 'flush':
      // Three short marks of heat over the front brow.
      return `<g class="fl-flush" stroke="#FF4A4A" stroke-width="${sw(0.9)}" stroke-linecap="round">${[-1.6, 0, 1.6].map((dx, i) => `<path d="M${f(front + R * 1.6 + dx)} ${f(top + 4 + (i === 1 ? -0.8 : 0))}l0 2.2"/>`).join('')}</g>`
    case 'sparkle': {
      const star = (x: number, y: number, r: number) => `<path d="M${f(x)} ${f(y - r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + r)}Q${f(x)} ${f(y)} ${f(x - r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - r)}Z" fill="#FFD66E"/>`
      return `<g class="fl-sparkle">${star(front + R * 2.4, ey - R * 2.2, 1.8)}${star(back - R * 2.2, ey - R * 1.4, 1.2)}</g>`
    }
    case 'thought':
      return `<g class="fl-thought" fill="#FFFFFF" stroke="#16141C" stroke-width="${sw(0.5)}"><circle cx="${f(front + R * 2.2)}" cy="${f(top + 2.5)}" r="1"/><circle cx="${f(front + R * 3.1)}" cy="${f(top - 0.6)}" r="1.5"/><circle cx="${f(front + R * 4.4)}" cy="${f(top - 4.6)}" r="2.2"/></g>`
    case 'zzz':
      return `<g class="fl-zzz" fill="none" stroke="#86C0FF" stroke-width="${sw(0.8)}" stroke-linecap="round" stroke-linejoin="round"><path d="M${f(front + R * 2)} ${f(top + 1)}h2.2l-2.2 2.4h2.2"/><path d="M${f(front + R * 3.2)} ${f(top - 3)}h1.6l-1.6 1.8h1.6"/></g>`
    default:
      return ''
  }
}

/** The accessible name of a Flungie: "Flungie avatar: Peach classic with crown". */
export function describe(t: Traits, list: readonly Colour[] = COLOURS): string {
  return (
    `Flungie avatar: ${colourOf(t, list).label} ${labelOf(SHAPES, t.shape).toLowerCase()}` +
    (t.accessory !== 'none' ? ` with ${labelOf(ACCESSORIES, t.accessory).toLowerCase()}` : '')
  )
}

export interface FlungieOptions extends RenderOptions, FlungieConfig {
  /** Traits to set instead of the seed's ({ accessory: 'crown' }). */
  overrides?: Overrides | undefined
}

/** The seed in, an SVG string out. Options as render(), plus overrides and the FlungieConfig options. */
export function flungie(seed: unknown, options: FlungieOptions = {}): string {
  return render(traits(seed, options.overrides, options), options)
}

/** An SVG string as a `data:` URI, for an `<img src>` or a CSS `background-image`. */
export function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * An SVG string from render() as an element of doc, to append. Parsed as XML and imported, so a page whose policy forbids
 * assigning innerHTML (Trusted Types, a strict lint) can still show one. Needs a DOM.
 */
export function toSvgElement(svg: string, doc: Document = document): SVGSVGElement {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
  return doc.importNode(parsed, true) as unknown as SVGSVGElement
}

interface BodyContext {
  G: Geometry
  P: Shading
  detail: number
  sw: (u: number, minPx?: number) => number
  id: string
  defs: string[]
  t: Traits
}

function bodyLayer({ G, P, detail, sw, id, defs, t }: BodyContext, { felt, size, groundHex }: { felt: boolean; size: number; groundHex: string }): string {
  const { hw, hh } = G
  const parts: string[] = []
  // A rim, only where the body would melt into its ground (an ink Flungie on a dark page, say). Strokes behind the
  // fills show outside the outline only, so the tail and body still read as one shape.
  if (contrast(P.base, groundHex) < 1.45) {
    const rim = luminance(groundHex) < 0.2 ? mix(P.base, WHITE, 0.4) : mix(P.base, INK, 0.45)
    const w = sw(1.6, 1.1) * 2
    parts.push(`<g fill="none" stroke="${rim}" stroke-width="${f(w)}" stroke-linejoin="round"><path d="${G.tailD}"/><path d="${G.bodyD}"/></g>`)
  }
  const r = Math.hypot(hw, hh) * 1.35
  defs.push(
    `<radialGradient id="${id}b" gradientUnits="userSpaceOnUse" cx="${f(-hw * 0.3)}" cy="${f(-hh * 0.55)}" r="${f(r)}">` +
      `<stop offset="0" stop-color="${P.light}"/><stop offset="0.3" stop-color="${mix(P.light, P.base, 0.7)}"/>` +
      `<stop offset="0.52" stop-color="${P.base}"/><stop offset="0.8" stop-color="${mix(P.base, P.shade, 0.6)}"/>` +
      `<stop offset="1" stop-color="${P.shade}"/></radialGradient>`,
  )
  const fills = `<path d="${G.tailD}"/><path d="${G.bodyD}"/>`
  let filter = ''
  if (felt) {
    // Felt: the edge wanders a little (displacement), an inner shadow rolls the edge away from the light, and fine
    // specks of light and dark give the fibres. Sized in pixels, so it neither blurs small nor vanishes large.
    const bf = f(clamp(size / 270, 0.34, 1.6))
    const ds = f(clamp(140 / size, 0.8, 1.6))
    const gk = luminance(P.base) < 0.1 ? 0.55 : 0.9 // speck strength: gentler on dark bodies, where light specks shout
    defs.push(
      `<filter id="${id}f" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="2" seed="${t.hash % 997}" result="n"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="n" scale="${ds}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feGaussianBlur in="SourceAlpha" stdDeviation="2.4"/><feOffset dx="-1.1" dy="-1.6" result="b"/>` +
        `<feComposite in="SourceAlpha" in2="b" operator="out" result="rim"/>` +
        `<feFlood flood-color="${P.shade}" flood-opacity="0.6"/><feComposite in2="rim" operator="in"/><feComposite in2="d" operator="in" result="rc"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${gk} 0 0 0 ${f(-gk * 0.56)}"/><feComposite in2="d" operator="in" result="hi"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${-gk} 0 0 ${f(gk * 0.44)}"/><feComposite in2="d" operator="in" result="lo"/>` +
        `<feMerge><feMergeNode in="d"/><feMergeNode in="rc"/><feMergeNode in="hi"/><feMergeNode in="lo"/></feMerge></filter>`,
    )
    filter = ` filter="url(#${id}f)"`
  }
  parts.push(`<g fill="url(#${id}b)"${filter}>${fills}</g>`)
  if (detail >= 1) {
    // A soft sheen up and to the left, as on a felt or clay toy.
    defs.push(`<radialGradient id="${id}h"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${luminance(P.base) < 0.1 ? 0.22 : 0.5}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`)
    parts.push(`<ellipse cx="${f(-hw * 0.4)}" cy="${f(-hh * 0.5)}" rx="${f(hw * 0.34)}" ry="${f(hh * 0.22)}" transform="rotate(-18 ${f(-hw * 0.4)} ${f(-hh * 0.5)})" fill="url(#${id}h)"/>`)
  }
  return `<g class="fl-body">${parts.join('')}</g>`
}

interface FaceContext extends BodyContext {
  expression?: Expression | undefined
  eyeR: number
  eyeAt: { x: number; y: number; s: number; eyes: string }
}

function faceParts(ctx: FaceContext): string {
  const { G, P, detail, sw, t } = ctx
  // What is worn changes the face: a hat lowers the eyes, round glasses spread them, sunglasses hide them.
  const on = wornAccessories(t)
  const headAcc = byId(ACCESSORIES, on.find((one) => one.slot === 'head')?.id) ?? (ACCESSORIES[0] as Accessory)
  const wears = (id: string) => on.some((one) => one.id === id)
  const tiny = detail === 0
  const mood = expressionOf(ctx.expression)
  let eyes: string = mood.eyes ?? t.eyes
  const mouth = mood.mouth ?? t.mouth
  if (tiny && eyes === 'wide') eyes = 'dots'
  const R = (eyes === 'wide' ? 3 : 3.1) * (tiny ? 1.55 : 1)
  const E = P.eye
  const ex = G.eye.x
  let ey = G.eye.y
  let s = G.eye.s
  if (headAcc.hat) ey = Math.max(ey, -G.hh + 9 + R * 1.4)
  if (wears('glasses')) s = Math.max(s, R * (eyes === 'wide' ? 1.38 : 1) + 3.4)
  if (tiny) s = Math.max(s, R + 2.6)
  ctx.eyeR = R
  ctx.eyeAt = { x: ex, y: ey, s, eyes }
  const out: string[] = []
  const hl = (x: number, y: number, r: number) => (detail >= 1 && E === INK ? `<circle cx="${f(x - r * 0.36)}" cy="${f(y - r * 0.4)}" r="${f(r * 0.32)}" fill="#FFFFFF"/>` : '')
  const arc = (x: number, y: number) =>
    `<path d="M${f(x - R)} ${f(y + R * 0.3)}Q${f(x)} ${f(y - R * 1.5)} ${f(x + R)} ${f(y + R * 0.3)}" fill="none" stroke="${E}" stroke-width="${sw(R * 0.62, 1.1)}" stroke-linecap="round"/>`
  const blinkable = (x: number, y: number, inner: string) => `<g class="fl-eye" data-x="${f(x)}" data-y="${f(y)}">${inner}</g>`
  const eye = (x: number, y: number, kind: string): string => {
    switch (kind) {
      case 'ovals':
        return blinkable(x, y, `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R * 0.78)}" ry="${f(R * 1.22)}" fill="${E}"/>${hl(x, y - R * 0.3, R * 0.9)}`)
      case 'sleepy':
        return (
          `<path d="M${f(x - R)} ${f(y - 0.3)}A${f(R)} ${f(R)} 0 0 0 ${f(x + R)} ${f(y - 0.3)}Z" fill="${E}"/>` +
          `<path d="M${f(x - R - 0.7)} ${f(y - 0.6)}L${f(x + R + 0.5)} ${f(y - 0.1)}" stroke="${E}" stroke-width="${sw(1.1, 0.9)}" stroke-linecap="round"/>`
        )
      case 'arc':
        return arc(x, y)
      case 'look':
        // Glancing up and to the front, as a Flungie thinking does.
        return blinkable(x, y, `<circle cx="${f(x + R * 0.35)}" cy="${f(y - R * 0.35)}" r="${f(R * 0.92)}" fill="${E}"/>${hl(x + R * 0.35, y - R * 0.35, R * 0.92)}`)
      case 'wide': {
        const rs = R * 1.38
        const ring = E === INK ? ` stroke="${INK}" stroke-width="${sw(0.9)}"` : ''
        return blinkable(
          x,
          y,
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rs)}" fill="#FFFFFF"${ring}/>` +
            `<circle cx="${f(x + R * 0.32)}" cy="${f(y + R * 0.12)}" r="${f(R * 0.74)}" fill="${INK}"/>` +
            (detail >= 1 ? `<circle cx="${f(x + R * 0.08)}" cy="${f(y - R * 0.18)}" r="${f(R * 0.24)}" fill="#FFFFFF"/>` : ''),
        )
      }
      default:
        return blinkable(x, y, `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="${E}"/>${hl(x, y, R)}`)
    }
  }
  const back = ex - s
  const front = ex + s
  if (!wears('sunglasses')) {
    if (eyes === 'wink') out.push(eye(back, ey, 'dots'), eye(front, ey, 'arc'))
    else if (eyes === 'happy') out.push(eye(back, ey, 'arc'), eye(front, ey, 'arc'))
    else out.push(eye(back, ey, eyes), eye(front, ey, eyes))
  }
  if (mood.cheeks === undefined && t.blush && !tiny) {
    // The seed's own blush, drawn exactly as before expressions, so a neutral Flungie keeps its drawing.
    const by = ey + R + 1.9
    out.push(`<g fill="${P.blush}" opacity="${P.blushOpacity}"><ellipse cx="${f(back - 3)}" cy="${f(by)}" rx="2.9" ry="1.6"/><ellipse cx="${f(front + 3)}" cy="${f(by)}" rx="2.9" ry="1.6"/></g>`)
  }
  if (mood.cheeks !== undefined && !tiny) {
    const by = ey + R + 1.9
    const { colour, opacity, size: k } = mood.cheeks
    out.push(`<g class="fl-cheeks" fill="${colour}" opacity="${opacity}"><ellipse cx="${f(back - 3)}" cy="${f(by)}" rx="${f(2.9 * k)}" ry="${f(1.6 * k)}"/><ellipse cx="${f(front + 3)}" cy="${f(by)}" rx="${f(2.9 * k)}" ry="${f(1.6 * k)}"/></g>`)
  }
  if (!tiny && mood.brows !== 'none') out.push(brows(mood.brows, back, front, ey, R, E, sw))
  if (!tiny && mouth !== 'none') {
    const mx = ex + 0.6
    const my = ey + R + 3.3
    const st = `fill="none" stroke="${E}" stroke-width="${sw(1.25)}" stroke-linecap="round" stroke-linejoin="round"`
    if (mouth === 'smile') out.push(`<path d="M${f(mx - 2.4)} ${f(my)}Q${f(mx)} ${f(my + 2.6)} ${f(mx + 2.4)} ${f(my)}" ${st}/>`)
    if (mouth === 'o') out.push(`<ellipse cx="${f(mx)}" cy="${f(my + 0.8)}" rx="1.3" ry="1.6" fill="${E}"/>`)
    if (mouth === 'cat') out.push(`<path d="M${f(mx - 2.8)} ${f(my)}Q${f(mx - 1.4)} ${f(my + 2)} ${f(mx)} ${f(my)}Q${f(mx + 1.4)} ${f(my + 2)} ${f(mx + 2.8)} ${f(my)}" ${st}/>`)
    if (mouth === 'frown') out.push(`<path d="M${f(mx - 2.4)} ${f(my + 1.8)}Q${f(mx)} ${f(my - 0.9)} ${f(mx + 2.4)} ${f(my + 1.8)}" ${st}/>`)
    if (mouth === 'flat') out.push(`<path d="M${f(mx - 1.9)} ${f(my + 0.9)}L${f(mx + 1.5)} ${f(my + 0.4)}" ${st}/>`)
    if (mouth === 'grin')
      out.push(
        `<path d="M${f(mx - 2.9)} ${f(my - 0.4)}H${f(mx + 2.9)}Q${f(mx + 2.9)} ${f(my + 3.4)} ${f(mx)} ${f(my + 3.4)}Q${f(mx - 2.9)} ${f(my + 3.4)} ${f(mx - 2.9)} ${f(my - 0.4)}Z" fill="${E}"/>` +
          (detail >= 1 ? `<ellipse cx="${f(mx + 0.3)}" cy="${f(my + 2.4)}" rx="1.5" ry="0.85" fill="#FF7A8A"/>` : ''),
      )
  }
  if (!tiny && mood.extra !== 'none') out.push(extra(mood.extra, back, front, ey, R, G, sw))
  return `<g class="fl-face">${out.join('')}</g>`
}
