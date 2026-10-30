// Coordinates: a 100 unit square, y down. The body is drawn in its own frame (centre 0,0, travelling toward +x), turned
// by the seeded tilt and placed at CX, CY. A Flungie whose tail is on the right is the same drawing, mirrored.

import { byId, type Shape, SHAPES } from './data.js'
import { clamp, f } from './random.js'
import type { Traits } from './traits.js'

export type Point = [number, number]

export const CX = 53.5
export const CY = 50

export interface Geometry {
  S: Shape
  hw: number
  hh: number
  n: number
  /** Degrees, counter-clockwise on screen. */
  tilt: number
  cx: number
  cy: number
  /** The body outline and the tail, as SVG path data in the body frame. */
  bodyD: string
  tailD: string
  tip: Point
  /** Half width of the body at height y, and the top of the body at x. */
  edgeX: (y: number) => number
  topY: (x: number) => number
  /** Distance from the centre to the outline at angle a, in radians. */
  radius: (a: number) => number
  eye: { x: number; y: number; s: number }
}

/** The body's outline and the points the face and accessories hang from, in the body's own frame. */
export function geometry(t: Traits, tiny = false): Geometry {
  const S = byId(SHAPES, t.shape) ?? (SHAPES[0] as Shape)
  const J = t.jitter
  const hw = S.hw * (0.95 + J.w * 0.1)
  const hh = S.hh * (0.95 + J.h * 0.1)
  const n = S.n
  const tilt = -(3 + J.tilt * 10) // leaning into the throw
  const cx = tiny ? 50 : CX
  const cy = CY
  const wob = (a: number) => {
    let w = S.wobble * (0.55 * Math.sin(2 * a + J.wob[0] * 6.283) + 0.3 * Math.sin(3 * a + J.wob[1] * 6.283) + 0.25 * Math.sin(5 * a + J.wob[2] * 6.283))
    if (S.lobes) w += (S.puff as number) * (Math.sqrt(Math.abs(Math.sin((S.lobes * a) / 2 + J.wob[3] * 3.1416))) - 0.62)
    return w
  }
  const radius = (a: number) => {
    const c = Math.abs(Math.cos(a)) / hw
    const s = Math.abs(Math.sin(a)) / hh
    return (c ** n + s ** n) ** (-1 / n) + wob(a)
  }
  const N = 72
  const pts: Point[] = []
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const r = radius(a)
    pts.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  const bodyD = smoothClosed(pts)
  const edgeX = (y: number) => hw * Math.max(0, 1 - Math.abs(y / hh) ** n) ** (1 / n)
  const topY = (x: number) => -hh * Math.max(0, 1 - Math.abs(x / hw) ** n) ** (1 / n)

  // Tail: a wedge from inside the body's lower edge to a rounded tip, its two sides bent a little.
  const T = J.tail
  const yb = hh * 0.5
  const bR = -hw * (0.06 + T[0] * 0.24)
  const bL = Math.max(-edgeX(yb) * 0.86, bR - hw * (0.38 + T[1] * 0.14))
  const tip: Point = [bL + hw * (-0.22 + T[2] * 0.34), hh + 8 + T[3] * 4]
  const bend = (T[4] - 0.5) * 4
  const tailD = tailPath([bR, yb], tip, [bL, yb], bend)

  const E = J.eye
  return {
    S, hw, hh, n, tilt, cx, cy, bodyD, tailD, tip, edgeX, topY, radius,
    eye: { x: hw * 0.15, y: -hh * 0.1 + (E[0] - 0.5) * 2.4, s: clamp(hw * 0.31, 6.8, 9.6) * (0.92 + E[1] * 0.16) },
  }
}

/** A closed Catmull-Rom spline through the points, as cubic Beziers. */
function smoothClosed(p: readonly Point[]): string {
  const n = p.length
  const at = (i: number) => p[(i + n) % n] as Point
  let d = `M${f(at(0)[0])} ${f(at(0)[1])}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

function tailPath(a: Point, tip: Point, b: Point, bend: number): string {
  // a and b are the base corners, inside the body; the tip is rounded with a quadratic through it.
  const toward = (p: Point, q: Point, d: number): Point => {
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const l = Math.hypot(dx, dy)
    return [p[0] + (dx / l) * d, p[1] + (dy / l) * d]
  }
  const ta = toward(tip, a, 2.6)
  const tb = toward(tip, b, 2.6)
  const mid = (p: Point, q: Point): Point => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  const ma = mid(a, ta)
  const mb = mid(b, tb)
  const na: Point = [-(ta[1] - a[1]), ta[0] - a[0]]
  const la = Math.hypot(...na)
  const nb: Point = [-(tb[1] - b[1]), tb[0] - b[0]]
  const lb = Math.hypot(...nb)
  const ca: Point = [ma[0] + (na[0] / la) * bend, ma[1] + (na[1] / la) * bend]
  const cb: Point = [mb[0] - (nb[0] / lb) * bend * 0.6, mb[1] - (nb[1] / lb) * bend * 0.6]
  return `M${f(a[0])} ${f(a[1] - 3)}L${f(a[0])} ${f(a[1])}Q${f(ca[0])} ${f(ca[1])} ${f(ta[0])} ${f(ta[1])}Q${f(tip[0])} ${f(tip[1])} ${f(tb[0])} ${f(tb[1])}Q${f(cb[0])} ${f(cb[1])} ${f(b[0])} ${f(b[1])}L${f(b[0])} ${f(b[1] - 3)}Z`
}

const rot = ([x, y]: Point, deg: number): Point => {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c * x - s * y, s * x + c * y]
}

/** A body-frame point in the drawing's frame (before any mirroring). */
export const toWorld = (G: Geometry, p: Point): Point => {
  const q = rot(p, G.tilt)
  return [q[0] + G.cx, q[1] + G.cy]
}
