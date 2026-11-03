import { describe, expect, it } from 'vitest'

import { EXPRESSION_SPECS, EXPRESSIONS, expressionOf, flungie, render, traits } from '../index.js'

const SEEDS = ['usr_a', 'usr_b', 'flung', 'sacha@flung.dev']

describe('expressions', () => {
  it('leaves a neutral Flungie exactly as it was drawn before', () => {
    for (const seed of SEEDS) for (const size of [24, 64, 128]) expect(flungie(seed, { size, id: 'x', expression: 'neutral' })).toBe(flungie(seed, { size, id: 'x' }))
  })

  it('has a spec for every expression, and neutral for anything unknown', () => {
    for (const id of EXPRESSIONS) expect(EXPRESSION_SPECS[id].id).toBe(id)
    expect(expressionOf('furious').id).toBe('neutral')
    expect(expressionOf(undefined).id).toBe('neutral')
  })

  it('changes the face and only the face', () => {
    const t = traits('usr_a')
    const body = (svg: string) => svg.replace(/<g class="fl-face">[\s\S]*$/, '')
    const neutral = render(t, { size: 128, id: 'x' })
    for (const expression of EXPRESSIONS.filter((id) => id !== 'neutral')) {
      const drawn = render(t, { size: 128, id: 'x', expression })
      expect(drawn, expression).not.toBe(neutral)
      expect(body(drawn), expression).toBe(body(neutral))
    }
  })

  it('draws each expression its own way', () => {
    const t = traits('usr_b', { blush: false })
    const svg = (expression: (typeof EXPRESSIONS)[number]) => render(t, { size: 128, id: 'x', expression })
    expect(svg('mad')).toContain('fl-brows')
    expect(svg('mad')).toContain('fl-flush')
    expect(svg('mad')).toContain('#FF4A4A')
    expect(svg('sad')).toContain('fl-tear')
    expect(svg('cute')).toContain('fl-sparkle')
    expect(svg('thinking')).toContain('fl-thought')
    expect(svg('sleepy')).toContain('fl-zzz')
    expect(svg('happy')).toContain('fl-cheeks')
  })

  it('keeps a tiny Flungie simple: no brows, cheeks or extras under 32 px', () => {
    const tiny = render(traits('usr_a'), { size: 24, id: 'x', expression: 'mad' })
    expect(tiny).not.toContain('fl-brows')
    expect(tiny).not.toContain('fl-flush')
  })
})
