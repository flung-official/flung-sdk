// @vitest-environment node
// The core runs where there is no DOM: Node, Workers, a server render.

import { expect, it } from 'vitest'

import { flungie, toDataUri } from '../index.js'

it('renders an SVG string without a DOM', () => {
  expect(typeof document).toBe('undefined')
  const svg = flungie('usr_8f3k2', { size: 128, theme: 'dark' })
  expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
  expect(toDataUri(svg).length).toBeGreaterThan(svg.length)
})

it('imports the element entry without registering or touching a DOM', async () => {
  const { FlungieElement, defineFlungie } = await import('../element/index.js')
  expect(typeof FlungieElement).toBe('function')
  expect(() => defineFlungie()).not.toThrow()
})
