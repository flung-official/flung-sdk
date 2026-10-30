import { afterEach, describe, expect, it } from 'vitest'

import { defineFlungie } from '../element/index.js'
import { flungie } from '../index.js'

defineFlungie()

afterEach(() => document.body.replaceChildren())

// As the DOM serialises it, with the per-drawing id taken out.
const idless = (svg: string) => {
  const box = document.createElement('div')
  box.innerHTML = svg
  return box.innerHTML.replace(/fl[0-9a-z]+(?=[cbshf]["\)])/g, 'ID')
}

describe('<flung-ie>', () => {
  it('draws the Flungie for its seed, and redraws when an attribute changes', () => {
    const el = document.createElement('flung-ie')
    el.setAttribute('seed', 'usr_8f3k2')
    el.setAttribute('size', '40')
    document.body.append(el)
    expect(idless(el.innerHTML)).toBe(idless(flungie('usr_8f3k2', { size: 40 })))
    el.setAttribute('theme', 'dark')
    expect(idless(el.innerHTML)).toBe(idless(flungie('usr_8f3k2', { size: 40, theme: 'dark' })))
    el.setAttribute('variant', 'square')
    expect(el.querySelector('svg rect')).not.toBeNull()
  })

  it('registers once, under another name too', () => {
    expect(() => defineFlungie()).not.toThrow()
    defineFlungie('my-avatar')
    expect(customElements.get('my-avatar')).toBeDefined()
  })
})
