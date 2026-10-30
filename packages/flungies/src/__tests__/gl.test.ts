import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mountFlungieGL } from '../gl/index.js'

// jsdom has neither WebGL nor a 2D canvas. These fakes record what the hero asks of them.
function fakeGL() {
  const lose = vi.fn()
  const gl = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, key) {
      if (key in target) return target[key]
      if (key === 'getExtension') return () => ({ loseContext: lose })
      if (key === 'getShaderParameter' || key === 'getProgramParameter') return () => true
      if (typeof key === 'string' && /^[A-Z_0-9]+$/.test(key)) return 1
      return () => ({})
    },
  })
  return { gl, lose }
}

function fake2d() {
  return {
    setTransform() {},
    translate() {},
    rotate() {},
    fill() {},
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  }
}

let observed: ((entries: { isIntersecting: boolean }[]) => void) | null = null
let reduced = false
let rafs = 0

beforeEach(() => {
  observed = null
  reduced = false
  rafs = 0
  vi.stubGlobal('Path2D', class {})
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observed = cb
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('requestAnimationFrame', () => ++rafs)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const host = () => document.body.appendChild(document.createElement('div'))

describe('mountFlungieGL', () => {
  it('falls back to the SVG Flungie without WebGL2', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const el = host()
    const hero = mountFlungieGL(el, 'usr_8f3k2', { size: 200 })
    expect(hero.webgl).toBe(false)
    expect(el.querySelectorAll('svg')).toHaveLength(1)
    expect(el.querySelector('canvas')).toBeNull()
    expect(el.querySelector('svg')?.getAttribute('width')).toBe('200')
    hero.setTheme('dark')
    hero.setSize(240)
    expect(el.querySelector('svg')?.getAttribute('width')).toBe('240')
    hero.dispose()
    expect(el.childNodes).toHaveLength(0)
  })

  it('draws the body in WebGL between the SVG layers, and animates while on screen', () => {
    const { gl, lose } = fakeGL()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) => (type === 'webgl2' ? gl : fake2d())) as never)
    const el = host()
    const hero = mountFlungieGL(el, 'usr_8f3k2', { size: 240, theme: 'dark' })
    expect(hero.webgl).toBe(true)
    const layers = el.querySelectorAll('.flgl > *')
    expect([...layers].map((n) => n.tagName)).toEqual(['DIV', 'CANVAS', 'DIV'])
    expect(layers[0]?.querySelector('.fl-body')).toBeNull()
    expect(layers[2]?.querySelector('.fl-face')).not.toBeNull()
    expect(rafs).toBe(1)

    observed?.([{ isIntersecting: false }])
    expect(cancelAnimationFrame).toHaveBeenCalled()
    const before = rafs
    observed?.([{ isIntersecting: true }])
    expect(rafs).toBe(before + 1)

    hero.dispose()
    expect(lose).toHaveBeenCalled()
    expect(el.childNodes).toHaveLength(0)
  })

  it('draws one still frame under reduced motion, with no loop', () => {
    reduced = true
    const { gl } = fakeGL()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) => (type === 'webgl2' ? gl : fake2d())) as never)
    const hero = mountFlungieGL(host(), 'usr_8f3k2', { size: 240 })
    expect(hero.webgl).toBe(true)
    expect(rafs).toBe(0)
    hero.dispose()
  })
})
