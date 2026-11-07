import { describe, expect, it } from 'vitest'

import {
  availability,
  DEFAULT_STORE,
  dress,
  earnedItems,
  HAIRS,
  isTrick,
  meetsEarn,
  PATTERNS,
  PETS,
  playTrick,
  render,
  slotOf,
  type StoreItem,
  TRICK_MOTIONS,
  TRICKS,
  traits,
  wornAccessories,
} from '../index.js'

const item = (id: string) => DEFAULT_STORE.find((one) => one.id === id) as StoreItem
const wallet = { earned: 0, adjustment: 0, spent: 0, owned: [] as string[] }
const SEEDS = ['a', 'usr_8f3k2', 'sacha@flung.dev', 'usr_b7']

describe('accessory slots', () => {
  it('wears a hat, glasses and something held at once, each drawn in its own colour', () => {
    const dressed = dress(traits('usr_8f3k2'), [item('crown:gold'), item('glasses:night'), item('coffee:paper')])
    expect(dressed).toMatchObject({ accessory: 'crown', accColour: 'gold', eyewear: 'glasses', eyewearColour: 'night', held: 'coffee', heldColour: 'paper' })
    expect(wornAccessories(dressed).map((one) => one.slot)).toEqual(['head', 'face', 'hand'])
    const svg = render(dressed, { size: 160 })
    const alone = render(dress(traits('usr_8f3k2'), [item('crown:gold')]), { size: 160 })
    expect(svg.length).toBeGreaterThan(alone.length + 500)
  })

  it('names one slot for each accessory and each other kind', () => {
    expect(slotOf(item('crown:gold'))).toBe('accessory:head')
    expect(slotOf(item('sunglasses:night'))).toBe('accessory:face')
    expect(slotOf(item('balloon:red'))).toBe('accessory:hand')
    expect(slotOf(item('megaphone:coral'))).toBe('accessory:hand')
    expect(slotOf(item('pet:bird'))).toBe('pet')
    expect(slotOf(item('hair:tuft'))).toBe('hair')
  })

  it('takes the seed’s own accessory off when one is put on, and every slot off with null', () => {
    const seed = { ...traits('usr_a'), accessory: 'headphones', accColour: 'night' }
    expect(dress(seed, item('coffee:paper'))).toMatchObject({ accessory: 'none', held: 'coffee' })
    expect(dress(dress(seed, [item('glasses:night'), item('phone:night')]), null)).toMatchObject({ accessory: 'none', eyewear: 'none', held: 'none' })
  })

  it('never seeds a new slot, hair, pattern, pet or mood, so no one’s drawing changes', () => {
    for (const seed of SEEDS) expect(traits(seed)).toMatchObject({ eyewear: 'none', held: 'none', hair: 'none', pattern: 'none', pet: 'none', mood: 'neutral' })
  })
})

describe('hair', () => {
  it('draws every hairdo from 32 px and nothing under it', () => {
    for (const option of HAIRS.filter((one) => one.id !== 'none')) {
      const t = { ...traits('usr_a'), accessory: 'none', hair: option.id }
      expect(render(t, { size: 64 })).toContain('fl-hair')
      expect(render(t, { size: 24 })).not.toContain('fl-hair')
    }
  })

  it('shows only what peeks out under a hat, and takes the seed’s own hat off to show', () => {
    const hatted = { ...traits('usr_a'), accessory: 'beanie', accColour: 'coral' }
    expect(render({ ...hatted, hair: 'mohawk' }, { size: 64 })).not.toContain('fl-hair')
    expect(render({ ...hatted, hair: 'pigtails' }, { size: 64 })).toContain('fl-hair')
    expect(dress(hatted, item('hair:mohawk')).accessory).toBe('none')
    expect(dress(hatted, [item('hair:mohawk'), item('beanie:coral')]).accessory).toBe('beanie')
  })
})

describe('patterns', () => {
  it('print on the body, clipped to it, under the tattoos', () => {
    for (const option of PATTERNS.filter((one) => one.id !== 'none')) {
      const svg = render({ ...traits('usr_a'), pattern: option.id, tattoo: 'heart' }, { size: 64 })
      expect(svg).toContain('fl-pattern')
      expect(svg.indexOf('fl-pattern')).toBeLessThan(svg.indexOf('fl-tattoo'))
    }
  })
})

describe('pets', () => {
  it('float beside the Flungie from 32 px, behind when a balloon is up ahead', () => {
    for (const option of PETS.filter((one) => one.id !== 'none')) {
      const t = { ...traits('usr_a'), pet: option.id }
      expect(render(t, { size: 64 })).toContain('fl-pet')
      expect(render(t, { size: 24 })).not.toContain('fl-pet')
    }
    const ahead = render({ ...traits('usr_a'), pet: 'bird' }, { size: 64 })
    const behind = render({ ...traits('usr_a'), pet: 'bird', held: 'balloon', heldColour: 'red' }, { size: 64 })
    expect(ahead).not.toMatch(/fl-pet" transform="[^"]*scale\(-/)
    expect(behind).toMatch(/fl-pet" transform="[^"]*scale\(-/)
  })
})

describe('moods', () => {
  it('show a mood put on as the Flungie’s own face, and an expression asked for over it', () => {
    const t = { ...traits('usr_a'), mood: 'sad' }
    expect(render(t, { id: 'x' })).toBe(render(traits('usr_a'), { id: 'x', expression: 'sad' }))
    expect(render(t, { id: 'x', expression: 'happy' })).toBe(render(traits('usr_a'), { id: 'x', expression: 'happy' }))
    expect(dress(traits('usr_a'), item('expression:cute')).mood).toBe('cute')
  })
})

describe('earned items', () => {
  it('are never sold: free, from level 1, and earned only', () => {
    const earned = DEFAULT_STORE.filter((one) => one.earn !== undefined)
    expect(earned.map((one) => one.id).sort()).toEqual(['hair:rainbow', 'laurel:gold', 'pattern:galaxy', 'pet:owl', 'starCrown:gold', 'trophy:gold'])
    for (const one of earned) {
      expect(one).toMatchObject({ price: 0, level: 1 })
      expect(availability(one, { ...wallet, earned: 99_999 }, 99)).toBe('earn')
      expect(availability(one, { ...wallet, owned: [one.id] }, 1)).toBe('owned')
    }
  })

  it('lists what a person has earned from their streak, achievements and level', () => {
    expect(earnedItems({ level: 1, achievements: 0 })).toEqual([])
    expect(earnedItems({ level: 30, achievements: 60, streakDays: 120 })).toHaveLength(6)
    expect(
      earnedItems({ level: 16, achievements: 12, streakDays: 31 })
        .map((one) => one.id)
        .sort(),
    ).toEqual(['hair:rainbow', 'laurel:gold', 'trophy:gold'])
    expect(meetsEarn({ kind: 'streak', days: 30 }, { level: 1, achievements: 0 })).toBe(false)
    const off = DEFAULT_STORE.map((one) => (one.id === 'trophy:gold' ? { ...one, enabled: false } : one))
    expect(earnedItems({ level: 1, achievements: 10 }, off)).toEqual([])
  })
})

describe('tricks', () => {
  it('has a motion for every trick, and plays nothing where there is nothing to animate', () => {
    for (const trick of TRICKS) expect(TRICK_MOTIONS[trick].keyframes.length).toBeGreaterThan(1)
    expect(isTrick('spin')).toBe(true)
    expect(isTrick('moonwalk')).toBe(false)
    expect(playTrick(document.createElement('div'), 'spin')).toBeNull()
  })
})
