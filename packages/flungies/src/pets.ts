/**
 * How each pet (PETS) is drawn: a small friend floating beside the Flungie, up and ahead of it on its leading side, bobbing when
 * it moves. It is drawn in the 100 unit square (not the body's frame, so it does not breathe with the body), inside the disc,
 * and sits on the trailing side instead when the Flungie holds a balloon there. A seed never picks one, so a new one is an
 * entry in PETS and one here, and no one's drawing changes. Drawn from 32 px.
 */
import type { Geometry } from './geometry.js'
import { f } from './random.js'

/** Dot eyes and a smile, for every pet: `x`, `y` is between the eyes. */
const face = (x: number, y: number, gap: number, ink = '#16141C', smile = true) =>
  `<circle cx="${f(x - gap)}" cy="${f(y)}" r="0.75" fill="${ink}"/><circle cx="${f(x + gap)}" cy="${f(y)}" r="0.75" fill="${ink}"/>` +
  `<circle cx="${f(x - gap - 0.25)}" cy="${f(y - 0.25)}" r="0.25" fill="#FFFFFF"/><circle cx="${f(x + gap - 0.25)}" cy="${f(y - 0.25)}" r="0.25" fill="#FFFFFF"/>` +
  (smile
    ? `<path d="M${f(x - 0.7)} ${f(y + 1.1)}Q${f(x)} ${f(y + 1.8)} ${f(x + 0.7)} ${f(y + 1.1)}" fill="none" stroke="${ink}" stroke-width="0.45" stroke-linecap="round"/>`
    : '')

const cheeks = (x: number, y: number, gap: number) =>
  `<ellipse cx="${f(x - gap - 0.9)}" cy="${f(y + 1)}" rx="0.8" ry="0.45" fill="#FF7A9C" opacity="0.6"/><ellipse cx="${f(x + gap + 0.9)}" cy="${f(y + 1)}" rx="0.8" ry="0.45" fill="#FF7A9C" opacity="0.6"/>`

/** Each pet around 0,0, about 12 units across before PET_SCALE, facing the way the Flungie flies. `flap` is a SMIL child for wings. */
const PET_ART: Readonly<Record<string, (animate: boolean, detail: number) => string>> = {
  bird: (animate, detail) => {
    const flap = animate
      ? `<animateTransform attributeName="transform" type="rotate" values="0 -0.6 -0.4;-28 -0.6 -0.4;0 -0.6 -0.4" dur="0.5s" repeatCount="indefinite"/>`
      : ''
    return (
      `<path d="M-5.2 0.6L-8 -1.4L-7.6 1.6Z" fill="#3F7EDB"/>` +
      `<ellipse cx="0" cy="0" rx="5.2" ry="4.4" fill="#5FA8FF"/><ellipse cx="0.8" cy="1.4" rx="3.4" ry="2.6" fill="#DCEBFF"/>` +
      `<path d="M5 -0.6L7.4 0.2L5 1Z" fill="#FFB547"/>` +
      `<g><path d="M-0.6 -0.4Q-3.6 -4.6 -4.6 -0.6Q-2.6 1 -0.6 -0.4Z" fill="#3F7EDB"/>${flap}</g>` +
      face(2.2, -1.2, 1.1, '#16141C', false) +
      (detail >= 2 ? cheeks(2.2, -1.2, 1.1) : '')
    )
  },
  ghost: (_animate, detail) =>
    `<path d="M-4.6 5.4V-0.6A4.6 4.6 0 0 1 4.6 -0.6V5.4L3.1 4.2L1.5 5.4L0 4.2L-1.5 5.4L-3.1 4.2Z" fill="#FFFFFF" stroke="#C9C3DA" stroke-width="0.5" stroke-linejoin="round"/>` +
    face(0.6, -0.4, 1.3) +
    (detail >= 2 ? cheeks(0.6, -0.4, 1.3) : ''),
  star: (animate, detail) => {
    const twinkle = animate ? `<animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="2.4s" repeatCount="indefinite"/>` : ''
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 6 : 2.9
      const a = ((-90 + i * 36) * Math.PI) / 180
      return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r + 0.4)}`
    }).join('L')
    return `<g><path d="M${pts}Z" fill="#FFD43B" stroke="#E5A00D" stroke-width="0.55" stroke-linejoin="round"/>${face(0, 0.6, 1.2)}${detail >= 2 ? cheeks(0, 0.6, 1.2) : ''}${twinkle}</g>`
  },
  mini: (_animate, detail) =>
    // A tiny Flungie of its own: a speech bubble with a face.
    `<path d="M-2.6 3.4L-3.8 6.6L0 3.8Z" fill="#FF9F80"/><rect x="-5.4" y="-4.4" width="10.8" height="8.4" rx="4" fill="#FFA584"/>` +
    (detail >= 2 ? `<ellipse cx="-2.4" cy="-2.4" rx="2" ry="1" fill="#FFFFFF" opacity="0.4"/>` : '') +
    face(1, -0.4, 1.4),
  bee: (animate, detail) => {
    const buzz = animate ? `<animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.3s" repeatCount="indefinite"/>` : ''
    return (
      `<g opacity="0.9"><ellipse cx="-1.2" cy="-4.4" rx="2.4" ry="3.2" transform="rotate(-20 -1.2 -4.4)" fill="#E8F4FF" stroke="#A9C7E8" stroke-width="0.4"/><ellipse cx="1.4" cy="-4.6" rx="2.2" ry="3" transform="rotate(16 1.4 -4.6)" fill="#E8F4FF" stroke="#A9C7E8" stroke-width="0.4"/>${buzz}</g>` +
      `<ellipse cx="0" cy="0" rx="5.4" ry="4.2" fill="#FFD43B"/>` +
      `<path d="M-2.4 -3.8Q-1.4 0 -2.4 3.8M0.4 -4.1Q1.4 0 0.4 4.1" fill="none" stroke="#2B2834" stroke-width="1.3"/>` +
      `<path d="M-5.4 0L-7 0.4L-5.2 1.2Z" fill="#2B2834"/>` +
      face(3, -0.6, 0.9, '#16141C', false) +
      (detail >= 2
        ? `<path d="M3.2 -3.8Q4 -6 5.2 -6.2M2.2 -4Q2.4 -6.2 3.4 -6.8" fill="none" stroke="#2B2834" stroke-width="0.45" stroke-linecap="round"/>`
        : '')
    )
  },
  cloud: (animate, detail) => {
    const drops =
      detail >= 1
        ? `<g fill="#86C0FF"><path d="M-2.6 5.2q0.6 1.2 0 1.8q-0.6 -0.6 0 -1.8Z"/><path d="M0.6 6q0.6 1.2 0 1.8q-0.6 -0.6 0 -1.8Z"/><path d="M3.4 5.2q0.6 1.2 0 1.8q-0.6 -0.6 0 -1.8Z"/>${animate ? `<animateTransform attributeName="transform" type="translate" values="0 -0.6;0 0.8;0 -0.6" dur="0.9s" repeatCount="indefinite"/>` : ''}</g>`
        : ''
    return (
      drops +
      `<path d="M-5.6 3.6A2.8 2.8 0 0 1 -5 -1.8A3.6 3.6 0 0 1 1.4 -3.4A3.2 3.2 0 0 1 6 0.6A2.6 2.6 0 0 1 5 3.6Z" fill="#F2F4FA" stroke="#B9C2D6" stroke-width="0.5" stroke-linejoin="round"/>` +
      face(0.6, 0.6, 1.3) +
      (detail >= 2 ? cheeks(0.6, 0.6, 1.3) : '')
    )
  },
  owl: (animate, detail) => {
    const blink = animate ? `<animate attributeName="ry" values="1.5;1.5;0.2;1.5" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/>` : ''
    return (
      `<path d="M-4.4 -3.6L-3.4 -6.4L-1.6 -4.2Z M4.4 -3.6L3.4 -6.4L1.6 -4.2Z" fill="#8A5A3B"/>` +
      `<ellipse cx="0" cy="0.4" rx="5" ry="5.6" fill="#A9744F"/><ellipse cx="0" cy="2.2" rx="3.2" ry="3.4" fill="#F2DDB8"/>` +
      `<circle cx="-1.9" cy="-1.4" r="2" fill="#FFFFFF"/><circle cx="1.9" cy="-1.4" r="2" fill="#FFFFFF"/>` +
      `<ellipse cx="-1.7" cy="-1.3" rx="1.1" ry="1.5" fill="#16141C">${blink}</ellipse><ellipse cx="2.1" cy="-1.3" rx="1.1" ry="1.5" fill="#16141C">${blink}</ellipse>` +
      `<path d="M-0.6 0.6L0.6 0.6L0 1.8Z" fill="#FFB547"/>` +
      // A tiny graduation cap: it is wise.
      `<path d="M-3.4 -5.4L0 -6.8L3.4 -5.4L0 -4Z" fill="#2B2834"/>` +
      (detail >= 2 ? `<path d="M3 -5.5V-3.4" stroke="#FFD43B" stroke-width="0.4"/><circle cx="3" cy="-3.2" r="0.45" fill="#FFD43B"/>` : '')
    )
  },
}

/** How much bigger than its art a pet is drawn, so it reads beside a Flungie at shelf size. */
const PET_SCALE = 1.55

/**
 * A pet beside the body, in the 100 unit square, or nothing for 'none', an unknown id, or a Flungie under 32 px (detail 0).
 * `side` 1 is ahead (the leading side), -1 behind.
 */
export function pet(kind: string, G: Geometry, detail: number, animate: boolean, side: 1 | -1 = 1): string {
  const art = PET_ART[kind]
  if (art === undefined || detail === 0) return ''
  // Up and ahead of the body's top corner, pulled in so it stays inside the disc.
  const want = { x: G.cx + side * (G.hw + 11), y: G.cy - G.hh - 2 }
  const dx = want.x - 50
  const dy = want.y - 50
  const reach = Math.hypot(dx, dy)
  const k = reach > 37 ? 37 / reach : 1
  const x = 50 + dx * k
  const y = 50 + dy * k
  const bob = animate
    ? `<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 -1.8;0 0" dur="2.6s" repeatCount="indefinite"/>`
    : ''
  const flip = side === -1 ? ` scale(${-PET_SCALE} ${PET_SCALE})` : ` scale(${PET_SCALE})`
  return `<g class="fl-pet" transform="translate(${f(x)} ${f(y)})${flip}"><g>${art(animate, detail)}${bob}</g></g>`
}
