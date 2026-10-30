// The body's signed distance field, for the shader: the outline is rasterised on a canvas, then two exact Euclidean
// distance transforms (Felzenszwalb and Huttenlocher) give the distance outside and inside.

import type { Geometry } from '../geometry.js'

const INF = 1e20

function edt1d(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint16Array, z: Float64Array): void {
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  f[0] = grid[offset] as number
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride] as number
    const q2 = q * q
    do {
      const r = v[k] as number
      s = ((f[q] as number) - (f[r] as number) + q2 - r * r) / (q - r) / 2
    } while (s <= (z[k] as number) && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  for (let q = 0, k = 0; q < length; q++) {
    while ((z[k + 1] as number) < q) k++
    const r = v[k] as number
    const qr = q - r
    grid[offset + q * stride] = (f[r] as number) + qr * qr
  }
}

function edt(grid: Float64Array, w: number, h: number): void {
  const n = Math.max(w, h)
  const f = new Float64Array(n)
  const v = new Uint16Array(n)
  const z = new Float64Array(n + 1)
  for (let x = 0; x < w; x++) edt1d(grid, x, w, h, f, v, z)
  for (let y = 0; y < h; y++) edt1d(grid, y * w, 1, w, f, v, z)
}

export interface Field {
  data: Float32Array
  w: number
  h: number
}

/** The body's distance field, in units, from its outline rasterised at res x res over the 100 unit square. */
export function bodyField(G: Geometry, res = 320): Field {
  const c = document.createElement('canvas')
  c.width = c.height = res
  const x = c.getContext('2d', { willReadFrequently: true })
  if (!x) throw new Error('No 2D canvas for the Flungie body field')
  const ppu = res / 100
  x.setTransform(ppu, 0, 0, ppu, 0, 0)
  x.translate(G.cx, G.cy)
  x.rotate((G.tilt * Math.PI) / 180)
  x.fill(new Path2D(G.tailD))
  x.fill(new Path2D(G.bodyD))
  const rgba = x.getImageData(0, 0, res, res).data
  const N = res * res
  const outer = new Float64Array(N)
  const inner = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const a = (rgba[i * 4 + 3] as number) / 255
    if (a === 0) {
      outer[i] = INF
      inner[i] = 0
    } else if (a === 1) {
      outer[i] = 0
      inner[i] = INF
    } else {
      const d = 0.5 - a
      outer[i] = d > 0 ? d * d : 0
      inner[i] = d < 0 ? d * d : 0
    }
  }
  edt(outer, res, res)
  edt(inner, res, res)
  const out = new Float32Array(N)
  for (let i = 0; i < N; i++) out[i] = Math.max(-16, Math.min(16, (Math.sqrt(outer[i] as number) - Math.sqrt(inner[i] as number)) / ppu))
  return { data: out, w: res, h: res }
}
