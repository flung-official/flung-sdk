import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mount = vi.fn()
const dispose = vi.fn()
vi.mock('../gl/index.js', () => ({
  mountFlungieGL: (...args: unknown[]) => {
    mount(...args)
    return { webgl: true, setTheme: vi.fn(), setSize: vi.fn(), update: vi.fn(), dispose }
  },
}))

import { Flungie } from '../react/index.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(() => {
  document.body.replaceChildren()
  mount.mockClear()
  dispose.mockClear()
})

async function show(node: React.ReactNode) {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await act(async () => root.render(node))
  return { container, root }
}

describe('<Flungie>', () => {
  it('renders the SVG Flungie at its size', async () => {
    const { container } = await show(<Flungie seed="usr_8f3k2" size={32} theme="dark" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('32')
    expect(svg?.getAttribute('aria-label')).toMatch(/^Flungie avatar: /)
    expect(mount).not.toHaveBeenCalled()
  })

  it('renders on a server', () => {
    const html = renderToString(<Flungie seed="usr_8f3k2" size={48} />)
    expect(html).toContain('<svg')
    expect(html).toContain('role="img"')
  })

  it('stays SVG below 160 px even when animated', async () => {
    await show(<Flungie seed="usr_8f3k2" size={120} animated />)
    await act(async () => {})
    expect(mount).not.toHaveBeenCalled()
  })

  it('loads the WebGL hero when animated at 160 px and up, and disposes it on unmount', async () => {
    const { container, root } = await show(<Flungie seed="usr_8f3k2" size={240} animated theme="dark" />)
    await vi.waitFor(() => expect(mount).toHaveBeenCalledTimes(1))
    const [host, t, options] = mount.mock.calls[0] as [HTMLElement, { seed: string }, { size: number; theme: string }]
    expect(container.contains(host)).toBe(true)
    expect(t.seed).toBe('usr_8f3k2')
    expect(options).toMatchObject({ size: 240, theme: 'dark' })
    await act(async () => root.unmount())
    expect(dispose).toHaveBeenCalled()
  })
})
