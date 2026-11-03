/**
 * How each aura (AURAS) is drawn: something behind the Flungie, around the body's centre, in the drawing's frame. With
 * `animate` it moves with SMIL (`<animate>`), which needs no stylesheet, so a page whose policy forbids inline styles still
 * plays it; a page that honours reduced motion renders without `animate`. A seed never picks an aura. Nothing under 32 px.
 */
import { mix } from './colour.js'
import { f } from './random.js'

const RAINBOW = ['#FF7E6E', '#FFA584', '#FFD66E', '#8EDDB5', '#86C0FF', '#BFA4FF']

/** A four-pointed star of radius r at x, y. */
const star = (x: number, y: number, r: number) => {
  const k = r * 0.28
  return `M${f(x)} ${f(y - r)}L${f(x + k)} ${f(y - k)}L${f(x + r)} ${f(y)}L${f(x + k)} ${f(y + k)}L${f(x)} ${f(y + r)}L${f(x - k)} ${f(y + k)}L${f(x - r)} ${f(y)}L${f(x - k)} ${f(y - k)}Z`
}

/** A heart about 2r wide at x, y. */
const heart = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y + r)}C${f(x - r * 1.3)} ${f(y + r * 0.2)} ${f(x - r * 1.3)} ${f(y - r * 0.9)} ${f(x - r * 0.6)} ${f(y - r * 0.9)}C${f(x - r * 0.2)} ${f(y - r * 0.9)} ${f(x)} ${f(y - r * 0.6)} ${f(x)} ${f(y - r * 0.4)}C${f(x)} ${f(y - r * 0.6)} ${f(x + r * 0.2)} ${f(y - r * 0.9)} ${f(x + r * 0.6)} ${f(y - r * 0.9)}C${f(x + r * 1.3)} ${f(y - r * 0.9)} ${f(x + r * 1.3)} ${f(y + r * 0.2)} ${f(x)} ${f(y + r)}Z`

const spin = (cx: number, cy: number, seconds: number, reverse = false) =>
  `<animateTransform attributeName="transform" type="rotate" from="${reverse ? 360 : 0} ${f(cx)} ${f(cy)}" to="${reverse ? 0 : 360} ${f(cx)} ${f(cy)}" dur="${seconds}s" repeatCount="indefinite"/>`

/** An aura centred on cx, cy, or nothing. `body` is the body's colour, which the glow takes after. */
export function aura(kind: string, cx: number, cy: number, id: string, defs: string[], body: string, detail: number, animate: boolean): string {
  if (detail === 0) return ''
  const a = (inner: string) => (animate ? inner : '')
  switch (kind) {
    case 'glow': {
      const tone = mix(body, '#FFFFFF', 0.25)
      defs.push(`<radialGradient id="${id}ag"><stop offset="0.35" stop-color="${tone}" stop-opacity="0.75"/><stop offset="1" stop-color="${tone}" stop-opacity="0"/></radialGradient>`)
      return `<circle class="fl-aura" cx="${f(cx)}" cy="${f(cy)}" r="40" fill="url(#${id}ag)">${a('<animate attributeName="r" values="36;43;36" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.75;1;0.75" dur="3.2s" repeatCount="indefinite"/>')}</circle>`
    }
    case 'bubbles': {
      const spots = [-24, -12, 2, 15, 27, -30]
      return `<g class="fl-aura" fill="#DCEBFF" fill-opacity="0.55" stroke="#5E9CEB" stroke-width="0.9">${spots
        .map((dx, i) => {
          const r = 2.8 + (i % 3) * 1.2
          const y = cy + 18 - ((i * 13) % 40)
          const begin = `${f(i * 0.55)}s`
          return `<circle cx="${f(cx + dx)}" cy="${f(y)}" r="${f(r)}">${a(
            `<animate attributeName="cy" values="${f(cy + 34)};${f(cy - 40)}" dur="3.4s" begin="${begin}" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="3.4s" begin="${begin}" repeatCount="indefinite"/>`,
          )}</circle>`
        })
        .join('')}</g>`
    }
    case 'hearts': {
      const spots = [-32, -20, 22, 33]
      return `<g class="fl-aura" fill="#FF7FA8">${spots
        .map((dx, i) => {
          const begin = `${f(i * 0.8)}s`
          return `<path d="${heart(cx + dx, cy + 8 - i * 9, 3.6 + (i % 2) * 1.1)}" opacity="0.85">${a(
            `<animateTransform attributeName="transform" type="translate" values="0 18;0 -22" dur="3.2s" begin="${begin}" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="3.2s" begin="${begin}" repeatCount="indefinite"/>`,
          )}</path>`
        })
        .join('')}</g>`
    }
    case 'sparkles': {
      const spots: [number, number, number][] = [
        [-31, -20, 5],
        [29, -25, 3.8],
        [35, 6, 4.4],
        [-35, 11, 3.4],
        [-13, -37, 3],
        [16, 31, 3.2],
      ]
      return `<g class="fl-aura" fill="#FFC23D" stroke="#F5A623" stroke-width="0.4">${spots
        .map(([dx, dy, r], i) => `<path d="${star(cx + dx, cy + dy, r)}">${a(`<animate attributeName="opacity" values="0.2;1;0.2" dur="${f(1.6 + (i % 3) * 0.5)}s" begin="${f(i * 0.3)}s" repeatCount="indefinite"/>`)}</path>`)
        .join('')}</g>`
    }
    case 'orbit': {
      const path = `M${f(cx - 40)} ${f(cy)}A40 13 0 1 0 ${f(cx + 40)} ${f(cy)}A40 13 0 1 0 ${f(cx - 40)} ${f(cy)}`
      const dot = (colour: string, begin: string, at: [number, number]) =>
        animate
          ? `<circle r="3.2" fill="${colour}"><animateMotion dur="5s" begin="${begin}" repeatCount="indefinite" path="${path}"/></circle>`
          : `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="3.2" fill="${colour}"/>`
      return `<g class="fl-aura" transform="rotate(-14 ${f(cx)} ${f(cy)})"><path d="${path}" fill="none" stroke="#A891EC" stroke-width="1.3" stroke-dasharray="2.5 2" opacity="0.85"/>${dot('#FFA584', '0s', [cx - 40, cy])}${dot('#86C0FF', '-2.5s', [cx + 40, cy])}</g>`
    }
    case 'halo': {
      defs.push(`<linearGradient id="${id}ah" x1="0" y1="0" x2="1" y2="1">${RAINBOW.map((c, i) => `<stop offset="${f(i / (RAINBOW.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`)
      return `<g class="fl-aura"><circle cx="${f(cx)}" cy="${f(cy)}" r="39" fill="none" stroke="url(#${id}ah)" stroke-width="5" opacity="0.18"/><circle cx="${f(cx)}" cy="${f(cy)}" r="39" fill="none" stroke="url(#${id}ah)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="7 4">${a(spin(cx, cy, 14))}</circle></g>`
    }
    case 'prism': {
      const r = 40
      const count = 12
      const arcs = Array.from({ length: count }, (_, i) => {
        const a0 = (i / count) * Math.PI * 2
        const a1 = ((i + 0.78) / count) * Math.PI * 2
        return `<path d="M${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)}A${r} ${r} 0 0 1 ${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)}" stroke="${RAINBOW[i % RAINBOW.length]}"/>`
      }).join('')
      const inner = Array.from({ length: 6 }, (_, i) => {
        const at = (i / 6) * Math.PI * 2
        return `<path d="${star(cx + Math.cos(at) * 33, cy + Math.sin(at) * 33, 1.6)}" fill="${RAINBOW[(i * 2) % RAINBOW.length]}"/>`
      }).join('')
      return `<g class="fl-aura"><g fill="none" stroke-width="3" stroke-linecap="round" opacity="0.85">${arcs}${a(spin(cx, cy, 10))}</g><g>${inner}${a(spin(cx, cy, 16, true))}</g></g>`
    }
    default:
      return ''
  }
}
