import { clamp, lerp } from './random.js'

type Rgb = [number, number, number]

const rgb = (hex: string): Rgb => {
  const n = Number(`0x${hex.slice(1)}`)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: readonly number[]): string =>
  '#' + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()

/** Mixes two `#RRGGBB` colours in sRGB: t = 0 gives a, 1 gives b. */
export const mix = (a: string, b: string, t: number): string => {
  const p = rgb(a)
  const q = rgb(b)
  return toHex(p.map((v, i) => lerp(v, q[i] as number, t)))
}

const lin = (v: number): number => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance. */
export const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map(lin) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export const contrast = (a: string, b: string): number => {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const oklab = (hex: string): Rgb => {
  const [r, g, b] = rgb(hex).map(lin) as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** Perceptual distance in OKLab: about 0.02 is a just-noticeable difference, 0.15 reads as clearly separate. */
export const distance = (a: string, b: string): number => {
  const p = oklab(a)
  const q = oklab(b)
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}
