import { describe, expect, it } from 'vitest'

import {
  ACCESSORIES,
  COLOURS,
  colours,
  combinations,
  contrast,
  DISCS,
  distance,
  flungie,
  palette,
  render,
  toDataUri,
  TRAITS,
  traits,
} from '../index.js'

const seeds = Array.from({ length: 300 }, (_, i) => (i % 2 ? `usr_${i.toString(36)}${i * 7919}` : `person${i}@example.com`))

describe('seeding', () => {
  it('gives the same traits and drawing for the same seed, every time', () => {
    for (const seed of seeds.slice(0, 50)) {
      expect(traits(seed)).toEqual(traits(seed))
      expect(render(traits(seed), { id: 'a' })).toBe(render(traits(seed), { id: 'a' }))
    }
  })

  it('trims and lower-cases the seed', () => {
    expect(traits('  Sacha@Flung.DEV ')).toEqual(traits('sacha@flung.dev'))
  })

  it('lets an override change one trait and leaves the others alone', () => {
    const plain = traits('usr_8f3k2')
    const crowned = traits('usr_8f3k2', { accessory: 'halo', colour: 'mint' })
    expect(crowned).toEqual({ ...plain, accessory: 'halo', colour: 'mint' })
    expect(traits('usr_8f3k2', { seed: 'other' } as never).seed).toBe('usr_8f3k2')
  })

  it('counts the discrete trait sets', () => {
    expect(combinations().discrete).toBe(907_200)
    expect(Object.keys(TRAITS)).toEqual(['shape', 'colour', 'eyes', 'mouth', 'blush', 'accessory', 'accColour', 'side', 'lines'])
  })
})

describe('options for other projects', () => {
  it('changes nothing with every option left at its default', () => {
    for (const seed of seeds.slice(0, 30)) {
      expect(traits(seed, {}, {})).toEqual(traits(seed))
      expect(traits(seed, {}, { salt: '', accessories: {} })).toEqual(traits(seed))
      expect(flungie(seed, { id: 'a' })).toBe(render(traits(seed), { id: 'a' }))
    }
  })

  it('gives another Flungie for the same seed under a salt, and keeps it stable', () => {
    const differ = seeds.filter((s) => traits(s, {}, { salt: 'acme' }).hash !== traits(s).hash)
    expect(differ.length).toBe(seeds.length)
    expect(traits('usr_1', {}, { salt: 'acme' })).toEqual(traits('usr_1', {}, { salt: 'acme' }))
    expect(traits('usr_1', {}, { salt: 'acme' }).seed).toBe('usr_1')
  })

  it('picks body colours from a palette of its own', () => {
    const mine = [
      { id: 'teal', label: 'Teal', hex: '#2BB3A3', light: ['#E8FFFB'], dark: ['inkD'] },
      { id: 'tomato', label: 'Tomato', hex: '#F2542D', light: ['skyT'], dark: ['#101820'] },
    ]
    const picked = new Set(seeds.map((s) => traits(s, {}, { palette: mine }).colour))
    expect([...picked].sort()).toEqual(['teal', 'tomato'])
    const t = traits('usr_1', { colour: 'teal' })
    expect(colours(t, 'light', mine).disc).toBe('#E8FFFB')
    expect(colours(t, 'dark', mine).disc).toBe(DISCS.inkD)
    const svg = flungie('usr_1', { palette: mine, overrides: { colour: 'teal' } })
    expect(svg).toContain('aria-label="Flungie avatar: Teal')
  })

  it('keeps to the accessories included, and leaves out those excluded', () => {
    const only = new Set(seeds.map((s) => traits(s, {}, { accessories: { include: ['none', 'crown', 'headphones'] } }).accessory))
    expect([...only].sort()).toEqual(['crown', 'headphones', 'none'])
    const without = new Set(seeds.map((s) => traits(s, {}, { accessories: { exclude: ['none', 'megaphone'] } }).accessory))
    expect(without.has('none') || without.has('megaphone')).toBe(false)
    expect(without.size).toBe(ACCESSORIES.length - 2)
    expect(traits('usr_1', {}, { accessories: { include: ['no-such-thing'] } }).accessory).toBe('none')
  })
})

describe('size tiers', () => {
  const t = traits('usr_8f3k2', { accessory: 'beanie', mouth: 'smile', blush: true })
  it('adds the felt filter from 80 px only, unless texture is off', () => {
    expect(render(t, { size: 79 })).not.toContain('<filter')
    expect(render(t, { size: 80 })).toContain('<filter')
    expect(render(t, { size: 256, texture: false })).not.toContain('<filter')
  })

  it('simplifies under 32 px: no lines, shadow, blush, mouth or highlights, and bigger eyes', () => {
    const tiny = render(t, { size: 24 })
    const small = render(t, { size: 32 })
    expect(tiny).not.toContain('fl-lines')
    expect(tiny).not.toContain('fl-shadow')
    expect(tiny).not.toContain(palette(colours(t).body).blush)
    expect(tiny).toContain('scale(1.14)')
    expect(small).toContain('fl-lines')
    expect(small).toContain('fl-shadow')
    expect(small).toContain('Q')
  })

  it('adds fine accessory detail from 64 px', () => {
    const count = (s: string) => s.split('<path').length
    expect(count(render(t, { size: 64 }))).toBeGreaterThan(count(render(t, { size: 63 })))
  })
})

describe('palette contrast', () => {
  it('sets every body clear of each disc it may sit on, in both themes', () => {
    for (const c of COLOURS)
      for (const theme of ['light', 'dark'] as const)
        for (const key of c[theme]) {
          expect(DISCS[key], `${c.id} names a disc ${key}`).toBeDefined()
          expect(distance(c.hex, DISCS[key] as string), `${c.id} on ${key}`).toBeGreaterThanOrEqual(0.12)
        }
  })

  it('gives every body eyes with at least 4:1 contrast', () => {
    for (const c of COLOURS) expect(contrast(palette(c.hex).eye, c.hex), c.id).toBeGreaterThanOrEqual(4)
  })

  it('picks accessory colours that stand clear of the body', () => {
    let clear = 0
    let worn = 0
    for (let i = 0; i < 2000; i++) {
      const K = colours(traits(`s${i}`))
      if (!K.A) continue
      worn++
      if (distance(K.A.base, K.body) >= 0.16) clear++
    }
    expect(clear / worn).toBeGreaterThan(0.97)
  })
})

describe('SVG', () => {
  it('parses, and every url(#id) it uses is defined in it', () => {
    const parser = new DOMParser()
    for (const seed of seeds.slice(0, 120))
      for (const size of [16, 40, 96])
        for (const variant of ['disc', 'square', 'bare'] as const) {
          const svg = flungie(seed, { size, variant, theme: size === 40 ? 'dark' : 'light' })
          const doc = parser.parseFromString(svg, 'image/svg+xml')
          expect(doc.querySelector('parsererror'), `${seed} ${size} ${variant}`).toBeNull()
          expect(doc.documentElement.getAttribute('role')).toBe('img')
          const ids = new Set([...doc.querySelectorAll('[id]')].map((el) => el.id))
          for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids.has(ref as string), ref).toBe(true)
        }
  })

  it('never repeats an id across two drawings of the same seed', () => {
    const id = (s: string) => s.match(/id="([^"]+?)[a-z]"/)?.[1]
    expect(id(flungie('usr_1'))).not.toBe(id(flungie('usr_1')))
  })

  it('makes a data URI for an img', () => {
    const uri = toDataUri(flungie('usr_1', { size: 24 }))
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,%3Csvg')).toBe(true)
    expect(decodeURIComponent(uri.split(',')[1] as string)).toContain('</svg>')
  })
})
