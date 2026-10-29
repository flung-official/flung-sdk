import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { defineFlungConnect } from '../element/define.js'
import type { FlungConnectElement } from '../element/flung-connect.js'
import { fakeApi, fakePopup } from './fake-api.js'

let api: ReturnType<typeof fakeApi>

beforeEach(() => {
  defineFlungConnect()
  api = fakeApi()
  vi.stubGlobal('fetch', api.fetch)
})

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function mount(attributes: Record<string, string> = { token: 'flung_ct_a.b' }) {
  const element = document.createElement('flung-connect') as FlungConnectElement
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  const loads: unknown[] = []
  element.addEventListener('flung-load', (event) => loads.push((event as CustomEvent).detail))
  document.body.append(element)
  await vi.waitFor(() => expect(loads.length).toBeGreaterThan(0))
  return { element, loads }
}

const root = (element: FlungConnectElement) => element.shadowRoot as ShadowRoot
const platformsShown = (element: FlungConnectElement) => [...root(element).querySelectorAll<HTMLElement>('[data-platform]')].map((row) => row.dataset['platform'])
const press = (element: FlungConnectElement, key: string) => root(element).querySelector<HTMLButtonElement>(`[data-key="${key}"]`)?.click()
const message = (element: FlungConnectElement) => root(element).querySelector('[part="message"]')?.textContent

describe('<flung-connect>', () => {
  it('offers only platforms this Flung can connect, narrowed by the platforms attribute, with their accounts', async () => {
    api.account('x', 'flung')
    api.account('linkedin', 'gone', { status: 'disconnected' })
    const { element, loads } = await mount()
    expect(platformsShown(element)).toEqual(['x', 'linkedin', 'mastodon'])
    expect(root(element).querySelector('[data-platform="x"] .who')?.textContent).toBe('flung')
    expect(root(element).querySelector('[data-platform="linkedin"] .accounts')).toBeNull()
    expect(loads[0]).toMatchObject({ accounts: [{ username: 'flung' }] })

    element.setAttribute('platforms', 'linkedin, tiktok')
    await vi.waitFor(() => expect(platformsShown(element)).toEqual(['linkedin']))
  })

  it('says it has no token rather than calling the API', async () => {
    const element = document.createElement('flung-connect')
    document.body.append(element)
    expect(message(element as FlungConnectElement)).toBe('This panel has no connect token yet.')
    expect(api.requests).toEqual([])
  })

  it('connects in a window and reports the new account', async () => {
    const { element } = await mount()
    const popup = fakePopup()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    const connected: unknown[] = []
    element.addEventListener('flung-connect', (event) => connected.push((event as CustomEvent).detail))
    press(element, 'connect-x')
    await vi.waitFor(() => expect(popup.location.href).toBe('https://platform.example/consent'))
    expect(message(element)).toBe('')
    expect(root(element).querySelector('[part="note"]')?.textContent).toContain('Finish signing in to X')
    api.finish({ username: 'flung' })
    await vi.waitFor(() => expect(connected).toHaveLength(1), { timeout: 5000 })
    expect(connected[0]).toMatchObject({ session: { status: 'connected' }, accounts: [{ platform: 'x', username: 'flung' }] })
    expect(message(element)).toBe('X is connected.')
    expect(popup.closed).toBe(true)
  })

  it('shows a link when the browser blocks the window, and says why a connect failed', async () => {
    const { element } = await mount()
    vi.spyOn(window, 'open').mockReturnValue(null)
    const errors: unknown[] = []
    element.addEventListener('flung-error', (event) => errors.push((event as CustomEvent).detail))
    press(element, 'connect-linkedin')
    await vi.waitFor(() => expect(root(element).querySelector('[part="note"] a')?.getAttribute('href')).toBe('https://platform.example/consent'))
    api.finish({ error: 'The person said no.' })
    await vi.waitFor(() => expect(errors).toEqual([{ code: 'access_denied', message: 'The person said no.' }]), { timeout: 5000 })
    expect(message(element)).toBe('LinkedIn was not connected: The person said no.')
  })

  it('stops waiting when the person cancels', async () => {
    const { element } = await mount()
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    press(element, 'connect-x')
    await vi.waitFor(() => expect(root(element).querySelector('[data-key="cancel-x"]')).not.toBeNull())
    press(element, 'cancel-x')
    await vi.waitFor(() => expect(root(element).querySelector<HTMLButtonElement>('[data-key="connect-x"]')?.disabled).toBe(false))
    expect(root(element).querySelector('[part="note"]')).toBeNull()
  })

  it('asks Mastodon users for their server first, and sends it', async () => {
    const { element } = await mount()
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    press(element, 'connect-mastodon')
    const input = root(element).querySelector<HTMLInputElement>('input[name="handle"]')
    expect(input?.required).toBe(true)
    expect(root(element).activeElement).toBe(input)
    if (input !== null) input.value = ' mastodon.social '
    root(element).querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
    await vi.waitFor(() => expect(api.requests.find((request) => request.method === 'POST')).toMatchObject({ path: '/v1/connect/mastodon', body: { handle: 'mastodon.social' } }))
  })

  it('disconnects after the person confirms, and offers a reconnect where one is needed', async () => {
    const kept = api.account('x', 'kept', { status: 'needs_reconnect' })
    const gone = api.account('x', 'gone')
    const { element } = await mount()
    expect(root(element).querySelector(`[data-account="${kept.id}"] [part="status"]`)?.textContent).toBe('Needs reconnecting')
    expect(root(element).querySelector(`[data-key="reconnect-${gone.id}"]`)).toBeNull()

    const disconnected: unknown[] = []
    element.addEventListener('flung-disconnect', (event) => disconnected.push((event as CustomEvent).detail))
    press(element, `disconnect-${gone.id}`)
    expect(root(element).querySelector('[part="confirm"]')?.textContent).toContain('Disconnect gone?')
    expect(api.requests.some((request) => request.method === 'DELETE')).toBe(false)
    press(element, 'confirm-x')
    await vi.waitFor(() => expect(disconnected).toEqual([{ account: expect.objectContaining({ id: gone.id, status: 'disconnected' }) }]))
    expect(root(element).querySelector(`[data-account="${gone.id}"]`)).toBeNull()
    expect(message(element)).toBe('gone is disconnected.')
  })

  it('reports a connect that came back to the page, and takes Flung\'s result off the address', async () => {
    const made = api.account('x', 'flung')
    history.replaceState(null, '', `/accounts?flung_session_id=cs_1&flung_status=connected&flung_account_ids=${made.id}`)
    const connected: unknown[] = []
    document.addEventListener('flung-connect', (event) => connected.push((event as CustomEvent).detail), { once: true })
    const { element } = await mount({ token: 'flung_ct_a.b', mode: 'redirect' })
    await vi.waitFor(() => expect(connected).toEqual([{ session: null, accounts: [expect.objectContaining({ id: made.id })] }]))
    expect(location.search).toBe('')
    expect(message(element)).toBe('X is connected.')
  })

  it('never turns an account name into markup', async () => {
    api.account('x', '<img src=x onerror=alert(1)>')
    const { element } = await mount()
    expect(root(element).querySelector('img')).toBeNull()
    expect(root(element).querySelector('.who')?.textContent).toBe('<img src=x onerror=alert(1)>')
  })
})
