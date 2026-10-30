// Flungies in WebGL2, for hero sizes (160 px and up). The body is shaded by a fragment shader (shader.ts) from a
// distance field of the same outline the SVG draws (field.ts). The face and accessories stay SVG, layered over and
// under the canvas, so they are pixel-identical to the SVG renderer. It idles: a slow breathing squash, and a blink
// every few seconds.
//
//   import { mountFlungieGL } from '@flung.dev/flungies/gl'
//   const hero = mountFlungieGL(el, 'usr_8f3k2', { size: 320, theme: 'dark' })
//   hero.setTheme('light'); hero.setSize(240); hero.dispose()
//
// It animates only while it is on screen and the page is visible. Under prefers-reduced-motion it draws one still
// frame. Without WebGL2, or if the context is lost, it shows the SVG Flungie instead.

import { colours, type FlungieConfig, type Overrides, palette, type Theme, type Traits, traits } from '../traits.js'
import { geometry } from '../geometry.js'
import { render, toSvgElement, type Variant } from '../render.js'
import { PAPER } from '../data.js'
import { bodyField, type Field } from './field.js'
import { FRAG, VERT } from './shader.js'

export interface FlungieGLOptions extends FlungieConfig {
  /** Pixels. Default 320. */
  size?: number | undefined
  theme?: Theme | undefined
  variant?: Variant | undefined
  /** With a seed: traits to set instead of the seed's. */
  overrides?: Overrides | undefined
}

export interface FlungieGL {
  /** false when it fell back to the SVG Flungie. */
  readonly webgl: boolean
  setTheme(theme: Theme): void
  setSize(size: number): void
  /** Shows another seed or trait set. */
  update(who: string | Traits, options?: FlungieGLOptions): void
  /** Stops the loop, releases the GL context and empties the host. */
  dispose(): void
}

const vec3 = (hex: string): [number, number, number] => {
  const n = Number(`0x${hex.slice(1)}`)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const UNIFORMS = ['uRes', 'uSdf', 'uMirror', 'uAnchor', 'uBreath', 'uBase', 'uLight', 'uShade', 'uSeed', 'uDarkBody'] as const

function program(gl: WebGL2RenderingContext): WebGLProgram {
  const prog = gl.createProgram()
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const s = gl.createShader(type)
    if (!s) throw new Error('Could not create a shader')
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'Shader did not compile')
    gl.attachShader(prog, s)
  }
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'Shader did not link')
  return prog
}

/** Mounts an animated Flungie in host, replacing its children. */
export function mountFlungieGL(host: HTMLElement, who: string | Traits, options: FlungieGLOptions = {}): FlungieGL {
  const resolve = (w: string | Traits, o: FlungieGLOptions) => (typeof w === 'string' ? traits(w, o.overrides, o) : w)
  const state = {
    t: resolve(who, options),
    size: options.size ?? 320,
    theme: options.theme ?? ('light' as Theme),
    variant: options.variant ?? ('disc' as Variant),
    palette: options.palette,
  }

  const wrap = document.createElement('div')
  wrap.className = 'flgl'
  const under = document.createElement('div')
  const over = document.createElement('div')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  for (const el of [under, canvas, over]) el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
  over.setAttribute('aria-hidden', 'true')
  wrap.append(under, canvas, over)
  host.replaceChildren(wrap)

  const svgOptions = () => ({ size: state.size, theme: state.theme, variant: state.variant, palette: state.palette })
  const place = () => {
    wrap.style.cssText = `position:relative;width:${state.size}px;height:${state.size}px;`
    wrap.style.clipPath = state.variant === 'disc' ? 'circle(50%)' : state.variant === 'square' ? 'inset(0 round 22%)' : 'none'
  }
  place()

  let disposed = false
  let gl: WebGL2RenderingContext | null = null
  let prog: WebGLProgram | null = null
  try {
    gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true })
    if (gl) prog = program(gl)
  } catch {
    gl = null
  }

  // The SVG fallback: no WebGL2, a shader that did not compile, or a lost context.
  let webgl = Boolean(gl && prog)
  const showSvg = () => {
    stop()
    webgl = false
    canvas.remove()
    over.replaceChildren()
    under.replaceChildren(toSvgElement(render(state.t, svgOptions())))
  }

  let raf = 0
  const stop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  let still = media?.matches ?? false
  let onScreen = true
  const pageVisible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  const running = () => webgl && !disposed && !still && onScreen && pageVisible()

  let anchor: [number, number] = [50, 70]
  let eyes: { el: Element; x: number; y: number }[] = []
  let breathers: Element[] = []
  type Locations = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  let loc: Locations | null = null
  let tex: WebGLTexture | null = null
  let vao: WebGLVertexArrayObject | null = null
  let field: { t: Traits; field: Field } | null = null

  const build = () => {
    if (!gl || !prog) return
    const { t } = state
    const G = geometry(t)
    const K = colours(t, state.theme, state.palette)
    const P = palette(K.body)
    if (field?.t !== t) field = { t, field: bodyField(G) }
    const dpr = Math.min(2, (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1)
    canvas.width = canvas.height = Math.round(state.size * dpr)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, field.field.w, field.field.h, 0, gl.RED, gl.FLOAT, field.field.data)
    under.replaceChildren(toSvgElement(render(t, { ...svgOptions(), layers: ['disc', 'shadow', 'lines', 'back'] })))
    over.replaceChildren(toSvgElement(render(t, { ...svgOptions(), layers: ['face', 'front'] })))
    const b = under.querySelector<SVGGElement>('.fl-breathe')
    anchor = [Number(b?.dataset['ax'] ?? 50), Number(b?.dataset['ay'] ?? 70)]
    breathers = [...wrap.querySelectorAll('.fl-breathe')]
    eyes = [...over.querySelectorAll<SVGGElement>('.fl-eye')].map((el) => ({ el, x: Number(el.dataset['x']), y: Number(el.dataset['y']) }))
    if (!loc) return
    gl.useProgram(prog)
    gl.uniform2f(loc.uRes, canvas.width, canvas.height)
    gl.uniform1i(loc.uSdf, 0)
    gl.uniform1f(loc.uMirror, t.side === 'right' ? 1 : 0)
    gl.uniform2f(loc.uAnchor, anchor[0], anchor[1])
    gl.uniform3fv(loc.uBase, vec3(P.base))
    gl.uniform3fv(loc.uLight, vec3(P.light))
    gl.uniform3fv(loc.uShade, vec3(P.shade))
    gl.uniform1f(loc.uSeed, (t.hash % 1000) / 37)
    gl.uniform1f(loc.uDarkBody, P.eye === PAPER ? 1 : 0)
  }

  let start = -1
  let nextBlink = 1.6
  let blinkAt = -1
  let double = false
  const draw = (ms: number) => {
    if (!gl || !prog || !webgl) return
    if (start < 0) start = ms
    const s = still ? 0 : (ms - start) / 1000
    const b = Math.sin((s * Math.PI * 2) / 3.6)
    const sx = 1 - 0.016 * b
    const sy = 1 + 0.028 * b
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(prog)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform2f(loc?.uBreath ?? null, sx, sy)
    gl.bindVertexArray(vao)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    const tf = `translate(${anchor[0]} ${anchor[1]}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-anchor[0]} ${-anchor[1]})`
    for (const el of breathers) el.setAttribute('transform', tf)
    // Blink: a quick close and open every 2.5 to 5.5 seconds, sometimes twice.
    let k = 1
    if (!still) {
      if (blinkAt < 0 && s >= nextBlink) blinkAt = s
      if (blinkAt >= 0) {
        const u = (s - blinkAt) / 0.17
        if (u >= 1) {
          if (double) {
            double = false
            blinkAt = s + 0.08
          } else {
            blinkAt = -1
            double = Math.random() < 0.25
            nextBlink = s + 2.5 + Math.random() * 3
          }
        } else if (u >= 0) k = 1 - Math.sin(u * Math.PI) * 0.9
      }
    }
    for (const e of eyes) e.el.setAttribute('transform', `translate(${e.x} ${e.y}) scale(1 ${k.toFixed(3)}) translate(${-e.x} ${-e.y})`)
  }

  const frame = (ms: number) => {
    raf = 0
    draw(ms)
    if (running()) raf = requestAnimationFrame(frame)
  }
  const resume = () => {
    if (running() && !raf) raf = requestAnimationFrame(frame)
  }
  const drawStill = () => {
    stop()
    draw(performance.now())
  }

  const observer =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          onScreen = entries.some((e) => e.isIntersecting)
          if (onScreen) resume()
          else stop()
        })
      : null
  const onVisibility = () => (pageVisible() ? resume() : stop())
  const onMotion = (e: MediaQueryListEvent) => {
    still = e.matches
    if (still) drawStill()
    else resume()
  }
  const onLost = (e: Event) => {
    if (disposed) return
    e.preventDefault()
    showSvg()
  }

  if (gl && prog) {
    loc = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Locations
    vao = gl.createVertexArray()
    tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    for (const [k, v] of [
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    ] as const)
      gl.texParameteri(gl.TEXTURE_2D, k, v)
    canvas.addEventListener('webglcontextlost', onLost)
    build()
    drawStill()
    observer?.observe(wrap)
    document.addEventListener('visibilitychange', onVisibility)
    media?.addEventListener?.('change', onMotion)
    resume()
  } else showSvg()

  const refresh = () => {
    if (disposed) return
    place()
    if (!webgl) {
      under.replaceChildren(toSvgElement(render(state.t, svgOptions())))
      return
    }
    build()
    if (still || !raf) drawStill()
    resume()
  }

  return {
    get webgl() {
      return webgl
    },
    setTheme(theme) {
      state.theme = theme
      refresh()
    },
    setSize(size) {
      state.size = size
      refresh()
    },
    update(next, o = {}) {
      state.t = resolve(next, o)
      if (o.size !== undefined) state.size = o.size
      if (o.theme !== undefined) state.theme = o.theme
      if (o.variant !== undefined) state.variant = o.variant
      if (o.palette !== undefined) state.palette = o.palette
      refresh()
    },
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      media?.removeEventListener?.('change', onMotion)
      canvas.removeEventListener('webglcontextlost', onLost)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      host.replaceChildren()
    },
  }
}
