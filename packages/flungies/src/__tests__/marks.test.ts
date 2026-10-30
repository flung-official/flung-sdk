import { describe, expect, it } from 'vitest'

import { contrast, INK, PAPER } from '../index.js'
import {
  MARK_PAIRS,
  MARK_SWEEP_MIN,
  MARK_TRAITS,
  markCombinations,
  markInitials,
  markPalette,
  markTraits,
  plainMark,
  renderMark,
  workspaceMark,
} from '../marks/index.js'

describe('markInitials', () => {
  it.each([
    ["maya@northwind.studio's workspace", 'M'],
    ['maya@northwind.studio’s Workspace', 'M'],
    ["ada1815@example.com's workspace", 'A'],
    ['Northwind Studio', 'NS'],
    ['john.doe@acme.io', 'JD'],
    ['Kettle & Co', 'KC'],
    ['GitHub', 'GH'],
    ['NASA', 'N'],
    ['brave new coin', 'BN'],
    ['  harbour.design  ', 'HD'],
    ['Ünïcødé Ateliér', 'ÜA'],
    ['42 Studio', 'S'],
    ['42', '4'],
    ['Design workspace', 'D'],
    ['', ''],
  ])('%j gives %j', (name, letters) => {
    expect(markInitials(name)).toBe(letters)
  })

  it('gives one letter when asked', () => {
    expect(markInitials('Northwind Studio', 1)).toBe('N')
    expect(markInitials('GitHub', 1)).toBe('G')
  })
})

describe('markTraits', () => {
  it('is the same for the same seed, whatever its case or padding', () => {
    expect(markTraits(' WS_Northwind ')).toEqual(markTraits('ws_northwind'))
  })

  it('lets an override win without moving the other traits', () => {
    const t = markTraits('ws_northwind')
    const o = markTraits('ws_northwind', { pattern: 'ripples', angle: '8' as unknown as number })
    expect(o.pattern).toBe('ripples')
    expect(o.angle).toBe(8)
    expect({ ...o, pattern: t.pattern, angle: t.angle }).toEqual(t)
  })

  it('salts, and keeps to a palette and a pattern rule', () => {
    expect(markTraits('ws_1', {}, { salt: 'acme' }).hash).not.toBe(markTraits('ws_1').hash)
    const palette = [{ id: 'teal', label: 'Teal into sky', ground: '#2FA4A9', tone: '#3F8ADB' }]
    for (let i = 0; i < 50; i++) {
      expect(markTraits(`ws_${i}`, {}, { palette }).pair).toBe('teal')
      expect(markTraits(`ws_${i}`, {}, { patterns: { exclude: ['tiles', 'lines'] } }).pattern).toBe('ripples')
      expect(['tiles', 'lines']).toContain(markTraits(`ws_${i}`, {}, { patterns: { include: ['tiles', 'lines'] } }).pattern)
    }
    expect(workspaceMark('ws_1', { palette })).toContain('#2FA4A9')
  })

  it('reaches every pattern and pair', () => {
    const seen = { pattern: new Set<string>(), pair: new Set<string>() }
    for (let i = 0; i < 2000; i++) {
      const t = markTraits(`ws_${i}`)
      seen.pattern.add(t.pattern)
      seen.pair.add(t.pair)
    }
    expect(seen.pattern.size).toBe(MARK_TRAITS.pattern.length)
    expect(seen.pair.size).toBe(MARK_PAIRS.length)
  })

  it('counts its discrete trait sets', () => {
    expect(markCombinations().discrete).toBe(25_200)
  })
})

describe('renderMark', () => {
  const count = (svg: string, text: string) => svg.split(text).length - 1

  it('is a squircle, never a circle', () => {
    const svg = workspaceMark('ws_1', { size: 64 })
    expect(svg).toContain('rx="22"')
    expect(svg).not.toContain('<circle')
  })

  it('shows two letters from 24 px and one below', () => {
    expect(workspaceMark('ws_1', { size: 24, name: 'Northwind Studio' })).toContain('>NS</text>')
    expect(workspaceMark('ws_1', { size: 20, name: 'Northwind Studio' })).toContain('>N</text>')
    expect(workspaceMark('ws_1', { size: 64, initials: 'zq' })).toContain('>ZQ</text>')
    expect(workspaceMark('ws_1', { size: 64, initials: false })).not.toContain('<text')
  })

  it('escapes the name', () => {
    const svg = workspaceMark('ws_1', { size: 64, initials: '<&' })
    expect(svg).toContain('&lt;&amp;</text>')
    expect(svg).not.toContain('<&')
  })

  it('adds the signature and the grain from 64 px only', () => {
    const t = markTraits('ws_1', { signature: 'topRight' })
    expect(renderMark(t, { size: 48 })).not.toContain('wm-sig')
    expect(renderMark(t, { size: 64 })).toContain('wm-sig')
    expect(renderMark(t, { size: 48 })).not.toContain('feTurbulence')
    expect(renderMark(t, { size: 64 })).toContain('feTurbulence')
    expect(renderMark(t, { size: 64, grain: false })).not.toContain('feTurbulence')
  })

  it('sweeps only when animated and large enough, and never under reduced motion', () => {
    const t = markTraits('ws_1')
    expect(renderMark(t, { size: MARK_SWEEP_MIN - 1, animate: true })).not.toContain('animateTransform')
    const svg = renderMark(t, { size: MARK_SWEEP_MIN, animate: true })
    expect(svg).toContain('animateTransform')
    expect(svg).toContain('prefers-reduced-motion: reduce')
    expect(renderMark(t, { size: 256 })).not.toContain('animateTransform')
  })

  it('rims a tile that would melt into the page', () => {
    const ink = markTraits('ws_1', { pair: 'ink' })
    expect(count(renderMark(ink, { size: 64, theme: 'dark' }), '<rect x=')).toBe(count(renderMark(ink, { size: 64, theme: 'light' }), '<rect x=') + 1)
  })

  it('uses the id prefix, so a server and a browser agree', () => {
    const t = markTraits('ws_1')
    expect(renderMark(t, { id: 'a:1' })).toBe(renderMark(t, { id: 'a:1' }))
    expect(renderMark(t, { id: 'a:1' })).toContain('id="wma1c"')
  })

  it('names itself for a screen reader', () => {
    expect(workspaceMark('ws_1', { name: 'Northwind Studio', overrides: { pair: 'peach', pattern: 'tiles' } })).toContain('aria-label="Workspace mark NS: Peach into coral tiles"')
  })
})

describe('colour', () => {
  // The mark is decorative (the name sits beside it in words), so its letters hold 4:1, as a Flungie's eyes do.
  it.each(MARK_PAIRS.map((p) => [p.id, p] as const))('%s carries its letters', (_, pair) => {
    const P = markPalette(pair)
    expect(contrast(P.letter, P.mid)).toBeGreaterThanOrEqual(4)
  })

  it.each(MARK_PAIRS.map((p) => p.id))('the plain mark for %s holds 4.5:1 in both themes', (pair) => {
    for (const theme of ['light', 'dark'] as const) {
      const svg = plainMark('ws_1', { theme, name: 'Northwind Studio', overrides: { pair } })
      const [bg, fg] = [...svg.matchAll(/fill="(#[0-9A-F]{6})"/g)].map((m) => m[1] as string)
      expect(contrast(bg as string, fg as string)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps the pale pairs patterned: their walls stand off the ground', () => {
    for (const id of ['sand', 'cloud']) {
      const P = markPalette(MARK_PAIRS.find((p) => p.id === id)!)
      expect(contrast(P.lo, P.ground)).toBeGreaterThan(1.6)
      expect([INK, PAPER]).toContain(P.letter)
    }
  })
})
