import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectClient, createConnectController } from '../core/index.js'
import type { ConnectController, ConnectControllerOptions } from '../core/index.js'
import { defineFlungConnect } from '../element/define.js'
import type { FlungConnectElement } from '../element/flung-connect.js'
import { fakeApi, WARPCAST_LINK } from './fake-api.js'

let made: ConnectController[] = []

afterEach(() => {
  for (const controller of made) controller.destroy()
  made = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

function start(api: ReturnType<typeof fakeApi>, options: Partial<ConnectControllerOptions> = {}) {
  const events = { connect: [] as unknown[], error: [] as unknown[] }
  const controller = createConnectController({
    token: 'flung_ct_a.b',
    baseUrl: 'https://api.flung.example',
    fetch: api.fetch,
    onConnect: (detail) => events.connect.push(detail),
    onError: (detail) => events.error.push(detail),
    ...options,
  })
  made.push(controller)
  return { controller, events }
}

const loaded = async (controller: ConnectController) => vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
const farcaster = (controller: ConnectController) => controller.getState().platforms.find((item) => item.platform === 'farcaster')
const reads = (api: ReturnType<typeof fakeApi>) => api.requests.filter((request) => request.path.startsWith('/v1/connect-sessions/')).length

describe('an approval connect (Farcaster)', () => {
  it('opens no window and leaves no page, shows the Warpcast link, and reports the account once approved', async () => {
    const api = fakeApi({ farcaster: true })
    const { controller, events } = start(api)
    await loaded(controller)
    expect(farcaster(controller)).toMatchObject({ connectFlow: 'approval', busy: false })
    expect(controller.getState().platforms.find((item) => item.platform === 'x')?.connectFlow).toBe('consent')
    const open = vi.spyOn(window, 'open')
    controller.connect('farcaster')
    expect(farcaster(controller)?.step).toEqual({ kind: 'approve', approvalUrl: null, accountId: null, variant: null, ended: null })
    expect(farcaster(controller)?.busy).toBe(true)
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ kind: 'approve', approvalUrl: WARPCAST_LINK }))
    expect(open).not.toHaveBeenCalled()
    controller.connect('farcaster')
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1)
    api.finish({ username: 'caster' })
    await vi.waitFor(() => expect(events.connect).toHaveLength(1), { timeout: 5000 })
    expect(farcaster(controller)?.step).toEqual({ kind: 'idle' })
    expect(controller.getState().message.text).toBe('Farcaster is connected.')
    expect(farcaster(controller)?.accounts.map((item) => item.name)).toEqual(['caster'])
  })

  it('does not redirect either, in redirect mode', async () => {
    const api = fakeApi({ farcaster: true })
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, href: 'https://shop.example/settings', assign } as Location)
    const { controller } = start(api, { mode: 'redirect' })
    await loaded(controller)
    controller.connect('farcaster')
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ kind: 'approve', approvalUrl: WARPCAST_LINK }))
    expect(assign).not.toHaveBeenCalled()
  })

  it('says the link expired, and Try again starts a new one', async () => {
    const api = fakeApi({ farcaster: true })
    const { controller, events } = start(api)
    await loaded(controller)
    controller.connect('farcaster')
    await vi.waitFor(() => expect(reads(api)).toBeGreaterThan(0))
    api.finish({ expired: true })
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ kind: 'approve', approvalUrl: null, ended: { status: 'expired' } }), { timeout: 5000 })
    expect(farcaster(controller)?.busy).toBe(false)
    expect(events.error).toEqual([{ code: 'expired', message: '' }])
    controller.connect('farcaster')
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ kind: 'approve', approvalUrl: WARPCAST_LINK, ended: null }))
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(2)
  })

  it('says why a declined approval failed, and Cancel closes it', async () => {
    const api = fakeApi({ farcaster: true })
    const { controller } = start(api)
    await loaded(controller)
    controller.connect('farcaster')
    await vi.waitFor(() => expect(reads(api)).toBeGreaterThan(0))
    api.finish({ error: 'The signer was declined or revoked in Warpcast.' })
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ ended: { status: 'failed', message: 'The signer was declined or revoked in Warpcast.' } }), { timeout: 5000 })
    controller.cancel('farcaster')
    expect(farcaster(controller)?.step).toEqual({ kind: 'idle' })
  })

  it('reconnects an account by approval too', async () => {
    const api = fakeApi({ farcaster: true })
    const account = api.account('farcaster', 'caster', { status: 'needs_reconnect' })
    const { controller } = start(api)
    await loaded(controller)
    controller.reconnect(account.id)
    await vi.waitFor(() => expect(farcaster(controller)?.step).toMatchObject({ kind: 'approve', approvalUrl: WARPCAST_LINK, accountId: account.id }))
  })
})

describe('waitForSession', () => {
  it('backs off by half again after each read, up to the most it is given', async () => {
    vi.useFakeTimers()
    const answers = ['pending', 'pending', 'pending', 'pending', 'connected']
    const at: number[] = []
    const fetch: typeof globalThis.fetch = async () => {
      at.push(Date.now())
      return Response.json({ id: 'cs_1', status: answers.shift(), accountIds: [], authorizationUrl: null, error: null })
    }
    const client = new ConnectClient({ token: 'flung_ct_a.b', baseUrl: 'https://api.flung.example', fetch })
    const done = client.waitForSession('cs_1', { intervalMs: 2_000, maxIntervalMs: 5_000 })
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(done).resolves.toMatchObject({ status: 'connected' })
    expect(at.slice(1).map((time, i) => time - (at[i] as number))).toEqual([2_000, 3_000, 4_500, 5_000])
  })
})

describe('<flung-connect> waiting on an approval', () => {
  it('shows Open Warpcast and a QR code of the link, then Try again once it expired', async () => {
    defineFlungConnect()
    const api = fakeApi({ farcaster: true })
    vi.stubGlobal('fetch', api.fetch)
    const element = document.createElement('flung-connect') as FlungConnectElement
    element.setAttribute('base-url', 'https://api.flung.example')
    element.token = 'flung_ct_a.b'
    document.body.append(element)
    const root = element.shadowRoot as ShadowRoot
    await vi.waitFor(() => expect(root.querySelector('[data-platform="farcaster"]')).not.toBeNull())
    ;(root.querySelector('[data-key="connect-farcaster"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(root.querySelector('a.approve-open')).not.toBeNull())
    const link = root.querySelector('a.approve-open') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(WARPCAST_LINK)
    expect(link.textContent).toBe('Open Warpcast')
    expect(root.activeElement).toBe(link)
    const qr = root.querySelector('svg.qr') as SVGSVGElement
    expect(qr.getAttribute('role')).toBe('img')
    expect(qr.getAttribute('aria-label')).toBe('QR code that opens Warpcast to approve Farcaster')
    expect(root.querySelector('.approve [role="status"]')?.textContent).toContain('Waiting for approval')
    expect((root.querySelector('[data-key="connect-farcaster"]') as HTMLButtonElement).disabled).toBe(true)

    api.finish({ expired: true })
    await vi.waitFor(() => expect(root.querySelector('.approve.ended')).not.toBeNull(), { timeout: 5000 })
    expect(root.querySelector('.approve.ended [role="alert"]')?.textContent).toBe('The Farcaster approval link ran out before it was approved.')
    const retry = root.querySelector('[data-key="approve-retry-farcaster"]') as HTMLButtonElement
    expect(root.activeElement).toBe(retry)
    retry.click()
    await vi.waitFor(() => expect(root.querySelector('a.approve-open')).not.toBeNull())
  })
})
