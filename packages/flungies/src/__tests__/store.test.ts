import { describe, expect, it } from 'vitest'

import { ACCESSORIES, AURAS, availability, balance, COLOURS, DEFAULT_STORE, dress, EYES, LINE_PAIRS, MOUTHS, PANTS, pointsEarned, preview, render, SHAPES, STORE_CATEGORIES, storeItems, TATTOOS, traits } from '../index.js'

const wallet = (over: Partial<Parameters<typeof balance>[0]> = {}) => ({ earned: 0, adjustment: 0, spent: 0, owned: [], ...over })

describe('the store', () => {
  it('sells every accessory in every colour and every other option once, each id once', () => {
    const accessories = ACCESSORIES.filter((a) => a.id !== 'none').reduce((sum, a) => sum + a.colours.length, 0)
    const others = EYES.length + (MOUTHS.length - 1) + (TATTOOS.length - 1) + COLOURS.length + LINE_PAIRS.length + SHAPES.length + (PANTS.length - 1) + (AURAS.length - 1)
    expect(DEFAULT_STORE).toHaveLength(accessories + others)
    expect(new Set(DEFAULT_STORE.map((item) => item.id)).size).toBe(accessories + others)
    expect(DEFAULT_STORE.find((item) => item.id === 'crown:gold')).toMatchObject({ category: 'headwear', rarity: 'legendary', level: 20, price: 2000 })
    expect(DEFAULT_STORE.find((item) => item.id === 'tattoo:heart')).toMatchObject({ kind: 'tattoo', category: 'tattoos', value: 'heart', colour: null, label: 'Tattoo, Heart' })
  })

  it('puts every item in a category, in shelf order, and every category has items', () => {
    const order = DEFAULT_STORE.map((item) => STORE_CATEGORIES.indexOf(item.category))
    expect(order.every((at) => at >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    for (const category of STORE_CATEGORIES) expect(DEFAULT_STORE.some((item) => item.category === category)).toBe(true)
  })

  it('lays a service’s overrides over the defaults, and ignores unknown ids', () => {
    const items = storeItems({ 'crown:gold': { price: 10, enabled: false }, 'nothing:here': { price: 1 } })
    expect(items.find((item) => item.id === 'crown:gold')).toMatchObject({ price: 10, enabled: false, level: 20 })
    expect(items).toHaveLength(DEFAULT_STORE.length)
  })

  it('earns points for posts, levels above the first and achievements', () => {
    expect(pointsEarned({ publishedPosts: 10, level: 1, achievements: 0 })).toBe(50)
    expect(pointsEarned({ publishedPosts: 0, level: 3, achievements: 2 })).toBe(150)
    expect(pointsEarned({ publishedPosts: 4, level: 1, achievements: 0 }, { perPost: 1, perLevel: 0, perAchievement: 0 })).toBe(4)
  })

  it('never lets a balance go below nothing', () => {
    expect(balance(wallet({ earned: 100, adjustment: -500 }))).toBe(0)
    expect(balance(wallet({ earned: 100, adjustment: 50, spent: 30 }))).toBe(120)
  })

  it('says what stands between a person and an item', () => {
    const item = storeItems({ 'headphones:night': { level: 3, price: 100 } }).find((one) => one.id === 'headphones:night')
    if (item === undefined) throw new Error('empty store')
    expect(availability(item, wallet({ owned: [item.id] }), 1)).toBe('owned')
    expect(availability(item, wallet({ earned: 500 }), 1)).toBe('level')
    expect(availability(item, wallet({ earned: 50 }), 3)).toBe('points')
    expect(availability(item, wallet({ earned: 500 }), 3)).toBe('available')
    expect(availability({ ...item, enabled: false }, wallet({ earned: 500 }), 3)).toBe('off')
  })

  it('dresses a Flungie in an item and draws it, changing nothing else', () => {
    const t = traits('usr_a')
    const dressed = dress(t, { kind: 'accessory', value: 'crown', colour: 'gold' })
    expect(dressed).toMatchObject({ accessory: 'crown', accColour: 'gold', shape: t.shape, colour: t.colour })
    expect(dress(t, null).accessory).toBe('none')
    expect(preview(t, { kind: 'accessory', value: 'crown', colour: 'gold' }, { id: 'x' })).toBe(render(dressed, { size: 160, variant: 'bare', id: 'x' }))
  })

  it('wears one of each kind at once, and ignores options that do not exist', () => {
    const t = traits('usr_a')
    const outfit = dress(t, [
      { kind: 'tattoo', value: 'star', colour: null },
      { kind: 'colour', value: 'mint', colour: null },
      { kind: 'shape', value: 'puffy', colour: null },
      { kind: 'lines', value: 'sunset', colour: null },
      { kind: 'mouth', value: 'grin', colour: null },
      { kind: 'eyes', value: 'nothing', colour: null },
    ])
    expect(outfit).toMatchObject({ tattoo: 'star', colour: 'mint', shape: 'puffy', lines: 'sunset', mouth: 'grin', eyes: t.eyes, accessory: t.accessory })
  })

  it('takes the seed’s sunglasses off to show eyes put on, unless an accessory is worn too', () => {
    const t = { ...traits('usr_a'), accessory: 'sunglasses' }
    expect(dress(t, { kind: 'eyes', value: 'wide', colour: null }).accessory).toBe('none')
    expect(dress(t, [{ kind: 'eyes', value: 'wide', colour: null }, { kind: 'accessory', value: 'sunglasses', colour: 'gold' }]).accessory).toBe('sunglasses')
  })
})

describe('tattoos', () => {
  it('are never picked by a seed, so no one’s drawing changes', () => {
    for (const seed of ['a', 'usr_8f3k2', 'sacha@flung.dev']) expect(traits(seed).tattoo).toBe('none')
  })

  it('draw each tattoo from 32 px, and nothing under it', () => {
    for (const option of TATTOOS.filter((one) => one.id !== 'none')) {
      const t = { ...traits('usr_a'), tattoo: option.id }
      expect(render(t, { size: 64 })).toContain('fl-tattoo')
      expect(render(t, { size: 24 })).not.toContain('fl-tattoo')
    }
    expect(render(traits('usr_a'), { size: 64 })).not.toContain('fl-tattoo')
  })
})

describe('pants and auras', () => {
  it('are never picked by a seed', () => {
    for (const seed of ['a', 'usr_8f3k2']) expect(traits(seed)).toMatchObject({ pants: 'none', aura: 'none' })
  })

  it('draw every pair of pants over the body and tail from 32 px, and nothing under it', () => {
    for (const option of PANTS.filter((one) => one.id !== 'none')) {
      const t = { ...traits('usr_a'), pants: option.id }
      expect(render(t, { size: 64 })).toContain('fl-pants')
      expect(render(t, { size: 24 })).not.toContain('fl-pants')
    }
  })

  it('draws every aura still by default, and moves it only when asked', () => {
    for (const option of AURAS.filter((one) => one.id !== 'none')) {
      const t = { ...traits('usr_a'), aura: option.id }
      const still = render(t, { size: 96 })
      expect(still).toContain('fl-aura')
      expect(still).not.toMatch(/<animate/)
      expect(render(t, { size: 96, animate: true })).toMatch(/<animate/)
    }
  })

  it('sells the rarest auras and pants as legendary', () => {
    expect(DEFAULT_STORE.find((item) => item.id === 'aura:halo')).toMatchObject({ category: 'auras', rarity: 'legendary', level: 20 })
    expect(DEFAULT_STORE.find((item) => item.id === 'pants:gold')).toMatchObject({ category: 'pants', rarity: 'legendary' })
  })
})
