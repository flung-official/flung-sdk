import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FlungConnectElement } from '../element/flung-connect.js'
import { FlungConnect, useFlungConnect } from '../react/index.js'
import { fakeApi, fakePopup } from './fake-api.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
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

  it('passes layout and unstyled to the element', async () => {
    vi.stubGlobal('fetch', fakeApi().fetch)
    const container = document.body.appendChild(document.createElement('div'))
    const ref = createRef<FlungConnectElement>()
    await act(async () => {
      createRoot(container).render(<FlungConnect ref={ref} token="flung_ct_a.b" layout="grid" unstyled />)
    })
    expect(ref.current?.getAttribute('layout')).toBe('grid')
    expect(ref.current?.hasAttribute('unstyled')).toBe(true)
    expect(ref.current?.shadowRoot?.querySelector('style')?.textContent).not.toContain('--flung-')
  })

  it('draws a page\'s own platform and account rows into the panel, which keeps the behaviour', async () => {
    const api = fakeApi()
    const gone = api.account('x', 'gone', { displayName: 'Gone Away' })
    vi.stubGlobal('fetch', api.fetch)
    const container = document.body.appendChild(document.createElement('div'))
    const ref = createRef<FlungConnectElement>()
    await act(async () => {
      createRoot(container).render(
        <FlungConnect
          ref={ref}
          token="flung_ct_a.b"
          platforms={['x']}
          renderPlatform={({ platform, actions }) => (
            <button type="button" className="my-connect" onClick={() => actions.connect(platform.platform)}>
              Link {platform.name}
            </button>
          )}
          renderAccount={({ account, actions, labels }) => (
            <span className="my-account">
              {account.displayName}
              <button type="button" onClick={() => actions.requestDisconnect(account.account.id)}>
                {labels.disconnect}
              </button>
            </span>
          )}
        />,
      )
    })
    await vi.waitFor(() => expect(container.querySelector('.my-account')).not.toBeNull())
    const element = ref.current as FlungConnectElement
    const slotted = container.querySelector<HTMLElement>(`[slot="account-${gone.id}"]`)
    expect(slotted?.textContent).toBe('Gone AwayDisconnect')
    expect(element.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="account-${gone.id}"]`)?.assignedElements()).toEqual([slotted])
    expect(container.querySelector('[slot="platform-x"] .my-connect')?.textContent).toBe('Link X')
    await act(async () => {
      slotted?.querySelector('button')?.click()
    })
    expect(element.shadowRoot?.querySelector('[part="confirm"]')?.textContent).toContain('Disconnect gone?')
  })
})

describe('useFlungConnect', () => {
  function Accounts(props: { token: string | (() => Promise<string>); onConnect?: () => void }) {
    const panel = useFlungConnect({ token: props.token, platforms: ['x', 'mastodon'], onConnect: props.onConnect })
    return (
      <div className="mine">
        <p className="status">{panel.message.text}</p>
        {panel.platforms.map((item) => (
          <section key={item.platform} data-platform={item.platform}>
            <h3>{item.name}</h3>
            {item.accounts.map((account) => (
              <p key={account.account.id} className="account">
                {account.displayName}
              </p>
            ))}
            {item.step.kind === 'handle' ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  panel.submitHandle(item.platform, 'mastodon.social')
                }}
              />
            ) : null}
            {item.step.kind === 'waiting' ? <span className="waiting">Waiting</span> : null}
            <button type="button" disabled={item.busy} onClick={() => panel.connect(item.platform)}>
              Add {item.name}
            </button>
          </section>
        ))}
      </div>
    )
  }

  it('gives the state and actions to markup that is all the page\'s own', async () => {
    const api = fakeApi()
    api.account('x', 'flung')
    vi.stubGlobal('fetch', api.fetch)
    const popup = fakePopup()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    const onConnect = vi.fn()
    const container = document.body.appendChild(document.createElement('div'))
    await act(async () => {
      createRoot(container).render(<Accounts token="flung_ct_a.b" onConnect={onConnect} />)
    })
    await vi.waitFor(() => expect([...container.querySelectorAll('section')].map((node) => node.dataset['platform'])).toEqual(['x', 'mastodon']))
    expect(container.querySelector('flung-connect')).toBeNull()
    expect(container.querySelector('[data-platform="x"] .account')?.textContent).toBe('flung')

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-platform="x"] button')?.click()
    })
    expect(container.querySelector('[data-platform="x"] .waiting')).not.toBeNull()
    expect(container.querySelector<HTMLButtonElement>('[data-platform="x"] button')?.disabled).toBe(true)
    await vi.waitFor(() => expect(popup.location.href).toBe('https://platform.example/consent'))
    api.finish({ username: 'second' })
    await vi.waitFor(() => expect(onConnect).toHaveBeenCalledTimes(1), { timeout: 5000 })
    await vi.waitFor(() => expect(container.querySelector('.status')?.textContent).toBe('X is connected.'))
    expect([...container.querySelectorAll('[data-platform="x"] .account')].map((node) => node.textContent)).toEqual(['second', 'flung'])

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-platform="mastodon"] button')?.click()
    })
    await act(async () => {
      container.querySelector('[data-platform="mastodon"] form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await vi.waitFor(() => expect(api.requests.find((request) => request.path === '/v1/connect/mastodon')).toMatchObject({ body: { handle: 'mastodon.social' } }))
  })

  it('asks a token function written inline once, however often the page renders', async () => {
    const api = fakeApi()
    vi.stubGlobal('fetch', api.fetch)
    const source = vi.fn(async () => 'flung_ct_fresh.x')
    const container = document.body.appendChild(document.createElement('div'))
    const root = createRoot(container)
    await act(async () => {
      root.render(<Accounts token={() => source()} />)
    })
    await vi.waitFor(() => expect(container.querySelectorAll('section')).toHaveLength(2))
    await act(async () => {
      root.render(<Accounts token={() => source()} />)
    })
    await act(async () => {
      root.render(<Accounts token={() => source()} />)
    })
    expect(source).toHaveBeenCalledTimes(1)
    expect(api.requests.filter((request) => request.path === '/v1/platforms')).toHaveLength(1)
    expect(api.requests.every((request) => request.token === 'flung_ct_fresh.x')).toBe(true)
  })

  it('renders on a server with the first state and makes no call', async () => {
    const api = fakeApi()
    vi.stubGlobal('fetch', api.fetch)
    const { renderToString } = await import('react-dom/server')
    expect(renderToString(<Accounts token="flung_ct_a.b" />)).toContain('Loading accounts…')
    expect(api.requests).toEqual([])
  })
})
