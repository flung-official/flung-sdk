import { afterEach, describe, expect, it, vi } from 'vitest'

import { createConnectController, initialConnectState } from '../core/index.js'
import type { ConnectController, ConnectControllerOptions } from '../core/index.js'
import { fakeApi, fakePopup } from './fake-api.js'

let made: ConnectController[] = []

afterEach(() => {
  for (const controller of made) controller.destroy()
  made = []
  vi.restoreAllMocks()
  history.replaceState(null, '', '/')
})

function start(api: ReturnType<typeof fakeApi>, options: Partial<ConnectControllerOptions> = {}) {
  const events = { load: [] as unknown[], connect: [] as unknown[], disconnect: [] as unknown[], error: [] as unknown[] }
  const controller = createConnectController({
    token: 'flung_ct_a.b',
    baseUrl: 'https://api.flung.example',
    fetch: api.fetch,
    onLoad: (detail) => events.load.push(detail),
    onConnect: (detail) => events.connect.push(detail),
    onDisconnect: (detail) => events.disconnect.push(detail),
    onError: (detail) => events.error.push(detail),
    ...options,
  })
  made.push(controller)
  return { controller, events }
}

const loaded = async (controller: ConnectController) => vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
const step = (controller: ConnectController, platform: string) => controller.getState().platforms.find((item) => item.platform === platform)?.step

describe('createConnectController', () => {
  it('reads what to offer into one frozen snapshot, the same object until something changes', async () => {
    const api = fakeApi()
    api.account('x', 'flung')
    api.account('linkedin', 'gone', { status: 'disconnected' })
    const { controller, events } = start(api)
    expect(controller.getState()).toMatchObject({ hasToken: true, loading: true, loaded: false, message: { text: 'Loading accounts…', error: false } })
    const heard = vi.fn()
    controller.subscribe(heard)
    await loaded(controller)
    const state = controller.getState()
    expect(state.platforms.map((item) => item.platform)).toEqual(['x', 'linkedin', 'mastodon'])
    expect(state.platforms[0]?.accounts.map((item) => item.displayName)).toEqual(['flung'])
    expect(state.platforms[2]).toMatchObject({ name: 'Mastodon', handlePrompt: { required: true }, step: { kind: 'idle' }, busy: false })
    expect(state.message).toEqual({ text: '', error: false })
    expect(events.load).toEqual([{ accounts: [expect.objectContaining({ username: 'flung' })] }])
    expect(heard).toHaveBeenCalled()
    expect(controller.getState()).toBe(state)
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.platforms)).toBe(true)
    expect(Object.isFrozen(state.platforms[0]?.accounts[0])).toBe(true)
  })

  it('makes no call without a token, and says so', () => {
    const api = fakeApi()
    const { controller } = start(api, { token: null })
    expect(controller.getState()).toMatchObject({ hasToken: false, loading: false, message: { text: 'This panel has no connect token yet.' } })
    expect(initialConnectState(false)).toBe(initialConnectState(false))
    expect(api.requests).toEqual([])
  })

  it('sends the token to the API address only, and no cookie', async () => {
    const api = fakeApi()
    const seen: { url: string; credentials: RequestCredentials | undefined }[] = []
    const watched: typeof fetch = (input, init) => {
      seen.push({ url: String(input), credentials: init?.credentials })
      return api.fetch(input, init)
    }
    const { controller } = start(api, { fetch: watched })
    await loaded(controller)
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((call) => call.url.startsWith('https://api.flung.example/v1/') && call.credentials === undefined)).toBe(true)
  })

  it('connects in a window, waits, then reports the new account', async () => {
    const api = fakeApi()
    const { controller, events } = start(api)
    await loaded(controller)
    const popup = fakePopup()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    controller.connect('x')
    expect(step(controller, 'x')).toEqual({ kind: 'waiting', blockedUrl: null, accountId: null, variant: null })
    expect(controller.getState().platforms[0]?.busy).toBe(true)
    await vi.waitFor(() => expect(popup.location.href).toBe('https://platform.example/consent'))
    controller.connect('x')
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1)
    api.finish({ username: 'new' })
    await vi.waitFor(() => expect(events.connect).toHaveLength(1), { timeout: 5000 })
    expect(controller.getState().notice).toMatchObject({ kind: 'connected', platform: 'x', accounts: [{ username: 'new' }] })
    expect(controller.getState().message).toEqual({ text: 'X is connected.', error: false })
    expect(step(controller, 'x')).toEqual({ kind: 'idle' })
    expect(controller.getState().platforms[0]?.accounts.map((item) => item.name)).toEqual(['new'])
  })

  it('offers the consent page as a link when the window is blocked, and stops when cancelled', async () => {
    const api = fakeApi()
    const { controller, events } = start(api)
    await loaded(controller)
    vi.spyOn(window, 'open').mockReturnValue(null)
    controller.connect('linkedin')
    await vi.waitFor(() => expect(step(controller, 'linkedin')).toMatchObject({ kind: 'waiting', blockedUrl: 'https://platform.example/consent' }))
    controller.cancel('linkedin')
    expect(step(controller, 'linkedin')).toEqual({ kind: 'idle' })
    api.finish({ username: 'late' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(events.connect).toEqual([])
    expect(events.error).toEqual([])
  })

  it('never offers a consent address that is not http or https', async () => {
    const api = fakeApi()
    const hostile: typeof fetch = async (input, init) => {
      const response = await api.fetch(input, init)
      if (new Request(input, init).method !== 'POST') return response
      return Response.json({ ...((await response.json()) as object), authorizationUrl: 'javascript:alert(1)' }, { status: 201 })
    }
    const { controller } = start(api, { fetch: hostile })
    await loaded(controller)
    vi.spyOn(window, 'open').mockReturnValue(null)
    controller.connect('x')
    await vi.waitFor(() => expect(api.requests.some((request) => request.path.startsWith('/v1/connect-sessions/'))).toBe(true))
    expect(step(controller, 'x')).toMatchObject({ kind: 'waiting', blockedUrl: null })
  })

  it('asks for the Mastodon server as data, then sends it trimmed', async () => {
    const api = fakeApi()
    const { controller } = start(api)
    await loaded(controller)
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.connect('mastodon')
    expect(step(controller, 'mastodon')).toEqual({ kind: 'handle', required: true })
    expect(api.requests.some((request) => request.method === 'POST')).toBe(false)
    controller.submitHandle('mastodon', ' mastodon.social ')
    await vi.waitFor(() => expect(api.requests.find((request) => request.method === 'POST')).toMatchObject({ path: '/v1/connect/mastodon', body: { handle: 'mastodon.social' } }))
  })

  it('asks before disconnecting, and reports it', async () => {
    const api = fakeApi()
    const gone = api.account('x', 'gone')
    const { controller, events } = start(api)
    await loaded(controller)
    controller.requestDisconnect(gone.id)
    expect(step(controller, 'x')).toMatchObject({ kind: 'confirm', account: { name: 'gone' } })
    expect(api.requests.some((request) => request.method === 'DELETE')).toBe(false)
    controller.cancel('x')
    expect(step(controller, 'x')).toEqual({ kind: 'idle' })
    controller.requestDisconnect(gone.id)
    await controller.confirmDisconnect('x')
    expect(events.disconnect).toEqual([{ account: expect.objectContaining({ id: gone.id, status: 'disconnected' }) }])
    expect(controller.getState().accounts).toEqual([])
    expect(controller.getState().message.text).toBe('gone is disconnected.')
  })

  it('offers a reconnect where one is needed or due soon', async () => {
    const api = fakeApi()
    const needs = api.account('x', 'needs', { status: 'needs_reconnect' })
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString()
    api.account('x', 'soon', { reconnectBy: soon })
    api.account('x', 'later', { reconnectBy: new Date(Date.now() + 60 * 86_400_000).toISOString() })
    const { controller } = start(api)
    await loaded(controller)
    const reasons = Object.fromEntries((controller.getState().platforms[0]?.accounts ?? []).map((item) => [item.name, item.reconnect]))
    expect(reasons).toEqual({ needs: { reason: 'needs_reconnect' }, soon: { reason: 'deadline', by: soon }, later: null })
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.reconnect(needs.id)
    expect(step(controller, 'x')).toMatchObject({ kind: 'waiting', accountId: needs.id })
    await vi.waitFor(() => expect(api.requests.find((request) => request.method === 'POST')?.path).toBe(`/v1/accounts/${needs.id}/reconnect`))
  })

  it('shows the display name, the handle under it, and only an https picture', async () => {
    const api = fakeApi()
    api.account('x', 'ada', { displayName: 'Ada Lovelace', avatarUrl: 'https://pbs.example/ada.jpg' })
    api.account('x', 'plain', { avatarUrl: 'http://pbs.example/plain.jpg' })
    api.account('x', 'sneaky', { displayName: '  ', avatarUrl: 'javascript:alert(1)' })
    const { controller } = start(api)
    await loaded(controller)
    const items = controller.getState().platforms[0]?.accounts ?? []
    expect(items.map(({ displayName, username, avatarUrl, initial }) => ({ displayName, username, avatarUrl, initial }))).toEqual([
      { displayName: 'sneaky', username: null, avatarUrl: null, initial: 'S' },
      { displayName: 'plain', username: null, avatarUrl: null, initial: 'P' },
      { displayName: 'Ada Lovelace', username: 'ada', avatarUrl: 'https://pbs.example/ada.jpg', initial: 'A' },
    ])
  })

  it('reports a failed read as a notice, worded by the labels', async () => {
    const api = fakeApi()
    const { controller, events } = start(api, { fetch: async () => Response.json({ error: { code: 'forbidden', message: 'Not from this origin.' } }, { status: 403 }), labels: { loadFailed: 'Oops: {message}' } })
    await vi.waitFor(() => expect(controller.getState().notice).not.toBeNull())
    expect(controller.getState().notice).toEqual({ kind: 'error', during: 'load', platform: null, code: 'forbidden', message: 'Not from this origin.' })
    expect(controller.getState().message).toEqual({ text: 'Oops: Not from this origin.', error: true })
    expect(events.error).toEqual([{ code: 'forbidden', message: 'Not from this origin.' }])
    controller.dismissNotice()
    expect(controller.getState().notice).toBeNull()
  })

  it('narrows the platforms and rewords itself when configured, without telling anyone when nothing changed', async () => {
    const api = fakeApi()
    const { controller } = start(api)
    await loaded(controller)
    const heard = vi.fn()
    controller.subscribe(heard)
    controller.configure({ labels: {} })
    expect(heard).not.toHaveBeenCalled()
    controller.configure({ platforms: ['linkedin'] })
    await vi.waitFor(() => expect(controller.getState().platforms.map((item) => item.platform)).toEqual(['linkedin']))
    controller.configure({ labels: { panel: 'Comptes' } })
    expect(controller.getState().labels.panel).toBe('Comptes')
  })

  it('reads a redirect that came back, and takes it off the address', async () => {
    const api = fakeApi()
    const back = api.account('x', 'flung')
    history.replaceState(null, '', `/accounts?tab=1&flung_session_id=cs_1&flung_status=connected&flung_account_ids=${back.id}`)
    const { controller, events } = start(api, { mode: 'redirect' })
    await vi.waitFor(() => expect(events.connect).toEqual([{ session: null, accounts: [expect.objectContaining({ id: back.id })] }]))
    expect(location.search).toBe('?tab=1')
    expect(controller.getState().message.text).toBe('X is connected.')
  })

  it('stops listening, waiting and reporting once destroyed', async () => {
    const api = fakeApi()
    const { controller, events } = start(api)
    await loaded(controller)
    const popup = fakePopup()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    controller.connect('x')
    await vi.waitFor(() => expect(popup.location.href).not.toBe(''))
    const heard = vi.fn()
    controller.subscribe(heard)
    const before = controller.getState()
    controller.destroy()
    api.finish({ username: 'late' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(heard).not.toHaveBeenCalled()
    expect(events.connect).toEqual([])
    expect(controller.getState()).toBe(before)
    controller.connect('linkedin')
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1)
  })
})
