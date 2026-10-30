import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { defineFlungConnect } from '../element/define.js'
import type { FlungConnectElement } from '../element/flung-connect.js'
import { TOOLTIP_DELAY_MS, TOOLTIP_HOLD_MS } from '../element/tooltip.js'
import { fakeApi } from './fake-api.js'

let api: ReturnType<typeof fakeApi>

beforeEach(() => {
  defineFlungConnect()
  api = fakeApi()
  vi.stubGlobal('fetch', api.fetch)
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function mount(attributes: Record<string, string> = { token: 'flung_ct_a.b' }) {
  const element = document.createElement('flung-connect') as FlungConnectElement
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  let loaded = false
  element.addEventListener('flung-load', () => (loaded = true))
  document.body.append(element)
  await vi.waitFor(() => expect(loaded).toBe(true))
  return element
}

const root = (element: FlungConnectElement) => element.shadowRoot as ShadowRoot
const tooltip = (element: FlungConnectElement) => root(element).querySelector<HTMLElement>('[part="tooltip"]')

/** Makes an element read as cut short, which jsdom, laying nothing out, never does by itself. */
function cut(element: HTMLElement) {
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 300 })
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 })
}

const pointer = (type: string, target: Element, pointerType = 'mouse') => {
  const event = new MouseEvent(type, { bubbles: true, composed: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

describe('the panel’s tooltip', () => {
  it('shows a cut-short account name after a rest of the pointer, never as a title, and closes on Escape', async () => {
    api.account('x', 'a_very_long_handle_that_does_not_fit')
    const element = await mount()
    const name = root(element).querySelector<HTMLElement>('[part="account-name"]') as HTMLElement
    expect(name.hasAttribute('title')).toBe(false)
    expect(tooltip(element)?.hidden).toBe(true)

    vi.useFakeTimers()
    pointer('pointerover', name)
    vi.advanceTimersByTime(TOOLTIP_DELAY_MS)
    expect(tooltip(element)?.hidden).toBe(true)
    pointer('pointerout', name)

    cut(name)
    pointer('pointerover', name)
    vi.advanceTimersByTime(TOOLTIP_DELAY_MS - 1)
    expect(tooltip(element)?.hidden).toBe(true)
    vi.advanceTimersByTime(1)
    expect(tooltip(element)?.hidden).toBe(false)
    expect(tooltip(element)?.textContent).toBe('a_very_long_handle_that_does_not_fit')
    expect(tooltip(element)?.getAttribute('aria-hidden')).toBe('true')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(tooltip(element)?.hidden).toBe(true)
  })

  it('opens on a held finger, not on a tap', async () => {
    api.account('x', 'a_very_long_handle_that_does_not_fit')
    const element = await mount()
    const name = root(element).querySelector<HTMLElement>('[part="account-name"]') as HTMLElement
    cut(name)
    vi.useFakeTimers()
    pointer('pointerdown', name, 'touch')
    pointer('pointerup', name, 'touch')
    vi.advanceTimersByTime(TOOLTIP_HOLD_MS)
    expect(tooltip(element)?.hidden).toBe(true)
    pointer('pointerdown', name, 'touch')
    vi.advanceTimersByTime(TOOLTIP_HOLD_MS)
    expect(tooltip(element)?.hidden).toBe(false)
  })

  it('keeps a tooltip that works with unstyled, in the part a page styles', async () => {
    const element = await mount({ token: 'flung_ct_a.b', unstyled: '' })
    expect(tooltip(element)).not.toBeNull()
    expect(root(element).querySelector('style')?.textContent).toContain('.tooltip { position: fixed;')
  })
})

/** The connect package's source, every file but the tests. */
const src = path.resolve(import.meta.dirname, '..')
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

/*
 * The panel ships to other people's pages and draws its own tooltip, so it never asks for the browser's: no `title`
 * attribute set through `html()` or `setAttribute`, no `.title =`, no JSX `title=` and no SVG `<title>`.
 */
describe('native tooltips', () => {
  it('appear nowhere in the connect package’s source', () => {
    const files = sourceFiles(src)
    expect(files.length).toBeGreaterThan(10)
    const forbidden = [/[{,]\s*title\s*:/, /setAttribute\(\s*['"]title['"]/, /\.title\s*=[^=]/, /<title[\s>]/, /createElementNS\([^)]*['"]title['"]/, /<[a-z][\w-]*\s[^>]*\btitle=/]
    const hits = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) => (forbidden.some((pattern) => pattern.test(line)) ? [`${path.relative(src, file)}:${index + 1}: ${line.trim()}`] : [])),
    )
    expect(hits).toEqual([])
  })
})
