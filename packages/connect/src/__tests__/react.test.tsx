import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FlungConnectElement } from '../element/flung-connect.js'
import { FlungConnect } from '../react/index.js'
import { fakeApi } from './fake-api.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('<FlungConnect>', () => {
  it('registers the element, hands it the token, and turns its events into callbacks', async () => {
    const api = fakeApi()
    api.account('x', 'flung')
    vi.stubGlobal('fetch', api.fetch)
    const container = document.body.appendChild(document.createElement('div'))
    const onLoad = vi.fn()
    const ref = createRef<FlungConnectElement>()
    await act(async () => {
      createRoot(container).render(<FlungConnect ref={ref} token="flung_ct_a.b" platforms={['x']} theme="dark" onLoad={onLoad} />)
    })
    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledWith({ accounts: [expect.objectContaining({ username: 'flung' })] }))
    expect(ref.current?.tagName).toBe('FLUNG-CONNECT')
    expect(ref.current?.getAttribute('theme')).toBe('dark')
    expect(ref.current?.token).toBe('flung_ct_a.b')
    expect(api.requests.every((request) => request.token === 'flung_ct_a.b')).toBe(true)
  })
})
