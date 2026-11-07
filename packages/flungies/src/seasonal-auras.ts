/**
 * Auras for the year's events: snow falling, autumn leaves and cherry blossom drifting down, bats flitting round, confetti
 * tumbling and fireworks bursting. Drawn as the other auras are (aura() hands these on), around the body's centre in the
 * drawing's frame, moving with SMIL when `animate` is on and still otherwise.
 */
import { f } from './random.js'

/** One thing that falls: where it starts, how far it drifts sideways, its shape about the origin, and its timing. */
interface Faller {
  x: number
  y: number
  drift: number
  shape: string
  seconds: number
  begin: number
  spin: number
}

/**
 * Things falling through the aura's space from above the Flungie to below it, turning as they go, fading in and out; or, still,
 * scattered where each would be part way down.
 */
function falling(cy: number, items: readonly Faller[], animate: boolean): string {
  return items
    .map((it) => {
      if (!animate) return `<g transform="translate(${f(it.x)} ${f(it.y)}) rotate(${f(it.spin * 0.3)})">${it.shape}</g>`
      const from = `${f(it.x)} ${f(cy - 42)}`
      const to = `${f(it.x + it.drift)} ${f(cy + 40)}`
      const timing = `dur="${f(it.seconds)}s" begin="${f(-it.begin)}s" repeatCount="indefinite"`
      return (
        `<g><animateTransform attributeName="transform" type="translate" values="${from};${to}" ${timing}/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" ${timing}/>` +
        `<g>${it.spin === 0 ? '' : `<animateTransform attributeName="transform" type="rotate" values="0;${f(it.spin)}" ${timing}/>`}${it.shape}</g></g>`
      )
    })
    .join('')
}

/** Spots spread round the Flungie, for things that fall: x offsets, and the depth each sits at when still. */
const SPOTS: readonly [number, number][] = [
  [-34, -26],
  [-22, 14],
  [-8, -36],
  [9, 30],
  [24, -18],
  [35, 10],
  [-38, 2],
  [30, -36],
]

/** An event aura centred on cx, cy, or null when `kind` is not one of these. */
export function seasonalAura(kind: string, cx: number, cy: number, detail: number, animate: boolean): string | null {
  const fall = (shape: (i: number) => string, seconds: number, spin: number, drift: number, count = SPOTS.length) =>
    falling(
      cy,
      SPOTS.slice(0, count).map(([dx, dy], i) => ({ x: cx + dx, y: cy + dy, drift: i % 2 ? drift : -drift, shape: shape(i), seconds: seconds + (i % 3) * 0.9, begin: (i * seconds) / count, spin: i % 2 ? spin : -spin })),
      animate,
    )
  switch (kind) {
    case 'snow': {
      // Flakes: six arms, white with a cool edge so they hold on a pale disc too.
      const flake = (i: number) => {
        const r = 1.8 + (i % 3) * 0.7
        let arms = ''
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3
          arms += `M${f(-Math.cos(a) * r)} ${f(-Math.sin(a) * r)}L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`
        }
        return `<path d="${arms}" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><path d="${arms}" stroke="#9CC7F0" stroke-width="0.4" stroke-linecap="round"/>`
      }
      return `<g class="fl-aura" fill="none">${fall(flake, 5.2, 120, 6)}</g>`
    }
    case 'leaves': {
      const tones = ['#E8833A', '#D9533B', '#F2B53C', '#B9612F']
      const leaf = (i: number) =>
        `<path d="M0 -3.4C2.6 -2.6 3 1.4 0 3.4C-3 1.4 -2.6 -2.6 0 -3.4Z" fill="${tones[i % tones.length]}"/>${detail >= 2 ? `<path d="M0 -2.6V3" stroke="#7A3B1E" stroke-width="0.4" opacity="0.6"/>` : ''}`
      return `<g class="fl-aura">${fall(leaf, 5.6, 300, 10, 6)}</g>`
    }
    case 'blossoms': {
      const petal = (i: number) =>
        i % 3 === 0
          ? `<g fill="#FFC2D6">${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="0" cy="-1.5" rx="1" ry="1.5" transform="rotate(${k * 72})"/>`).join('')}</g><circle r="0.6" fill="#FF8FB1"/>`
          : `<path d="M0 -2.2C1.6 -1.6 1.6 1.2 0 2.2C-1.6 1.2 -1.6 -1.6 0 -2.2Z" fill="${i % 2 ? '#FFD3E1' : '#FFB3CB'}"/>`
      return `<g class="fl-aura">${fall(petal, 6.4, 220, 12)}</g>`
    }
    case 'confetti': {
      const colours = ['#FF7E6E', '#FFD66E', '#8EDDB5', '#86C0FF', '#BFA4FF', '#FF8FB1']
      const bit = (i: number) => (i % 3 === 2 ? `<circle r="1.2" fill="${colours[i % colours.length]}"/>` : `<rect x="-1.4" y="-0.7" width="2.8" height="1.4" rx="0.3" fill="${colours[i % colours.length]}"/>`)
      return `<g class="fl-aura">${fall(bit, 3.4, 540, 5)}</g>`
    }
    case 'bats': {
      // Three bats flitting on loops round the Flungie, wings beating.
      const bat = (i: number) => {
        const flap = animate ? `<animateTransform attributeName="transform" type="scale" values="1 1;1 0.35;1 1" dur="0.32s" begin="${f(i * 0.1)}s" repeatCount="indefinite"/>` : ''
        return `<g>${flap}<path d="M0 -0.6C-1.4 -2.6 -3.4 -2.6 -5.4 -1.4C-4.6 -0.6 -4.4 0.4 -4.6 1.2C-3.4 0.4 -2.4 0.6 -1.6 1.4C-1 0.6 -0.6 0.8 0 1.6C0.6 0.8 1 0.6 1.6 1.4C2.4 0.6 3.4 0.4 4.6 1.2C4.4 0.4 4.6 -0.6 5.4 -1.4C3.4 -2.6 1.4 -2.6 0 -0.6Z" fill="#2B2834"/></g><circle cx="-0.5" cy="-0.6" r="0.35" fill="#FFD66E"/><circle cx="0.5" cy="-0.6" r="0.35" fill="#FFD66E"/>`
      }
      const loops = [
        { rx: 38, ry: 16, tilt: -12, seconds: 6, at: [-30, -22] },
        { rx: 34, ry: 22, tilt: 18, seconds: 7.5, at: [32, -8] },
        { rx: 40, ry: 12, tilt: 4, seconds: 5.2, at: [6, -38] },
      ]
      return `<g class="fl-aura">${loops
        .map((loop, i) => {
          const d = `M${f(cx - loop.rx)} ${f(cy - 6)}A${loop.rx} ${loop.ry} 0 1 1 ${f(cx + loop.rx)} ${f(cy - 6)}A${loop.rx} ${loop.ry} 0 1 1 ${f(cx - loop.rx)} ${f(cy - 6)}`
          const scale = 0.85 + (i % 2) * 0.25
          return animate
            ? `<g transform="rotate(${loop.tilt} ${f(cx)} ${f(cy)})"><g><animateMotion dur="${loop.seconds}s" begin="${f(-i * 1.7)}s" repeatCount="indefinite" path="${d}"/><g transform="scale(${f(scale)})">${bat(i)}</g></g></g>`
            : `<g transform="translate(${f(cx + (loop.at[0] as number))} ${f(cy + (loop.at[1] as number))}) scale(${f(scale)})">${bat(i)}</g>`
        })
        .join('')}</g>`
    }
    case 'fireworks': {
      // Bursts round the Flungie: rays and sparks flying out from a point and fading, one after another.
      const bursts: [number, number, string, number][] = [
        [-30, -26, '#FFD66E', 0],
        [30, -30, '#FF8FB1', 0.7],
        [36, 12, '#86C0FF', 1.4],
        [-36, 10, '#8EDDB5', 2.1],
      ]
      return `<g class="fl-aura" stroke-linecap="round">${bursts
        .map(([dx, dy, colour, begin]) => {
          const x = cx + dx
          const y = cy + dy
          let rays = ''
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4
            rays += `M${f(Math.cos(a) * 2.6)} ${f(Math.sin(a) * 2.6)}L${f(Math.cos(a) * 7)} ${f(Math.sin(a) * 7)}`
          }
          const sparks = Array.from({ length: 8 }, (_, k) => {
            const a = ((k + 0.5) * Math.PI) / 4
            return `<circle cx="${f(Math.cos(a) * 5.4)}" cy="${f(Math.sin(a) * 5.4)}" r="0.7"/>`
          }).join('')
          const timing = `dur="2.8s" begin="${f(begin)}s" repeatCount="indefinite"`
          const motion = animate
            ? `<animateTransform attributeName="transform" type="scale" values="0.1;1;1.15" keyTimes="0;0.35;1" ${timing}/><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.1;0.6;1" ${timing}/>`
            : ''
          return `<g transform="translate(${f(x)} ${f(y)})"><g opacity="${animate ? 0 : 0.9}">${motion}<path d="${rays}" stroke="${colour}" stroke-width="1.2" fill="none"/><g fill="${colour}">${sparks}</g></g></g>`
        })
        .join('')}</g>`
    }
    default:
      return null
  }
}
