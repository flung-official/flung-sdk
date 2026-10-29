import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectClient, connectInPopup, FlungConnectError, parsePlatformList, readRedirectResult, tokenPlatforms, withoutRedirectResult } from '../core/index.js'
import { fakeApi, fakePopup } from './fake-api.js'

afterEach(() => {
  vi.restoreAllMocks()
})

/** A token shaped like the API's, naming `platforms`; its signature is not checked here. */
function token(platforms?: string[]): string {
  const body = btoa(JSON.stringify({ w: 'ws_1', o: ['https://app.example'], e: 1, ...(platforms === undefined ? {} : { pl: platforms }) })).replace(/=+$/, '')
  return `flung_ct_${body}.signature`
}

describe('ConnectClient', () => {
  it('sends the token and reads accounts, and throws the API\'s code on a refusal', async () => {
    const api = fakeApi()
    api.account('x', 'flung')
    const client = new ConnectClient({ token: 'flung_ct_a.b', baseUrl: 'https://api.flung.example/', fetch: api.fetch })
    expect((await client.accounts()).map((account) => account.username)).toEqual(['flung'])
    expect(api.requests[0]).toMatchObject({ method: 'GET', path: '/v1/accounts', token: 'flung_ct_a.b' })
    const refused = await client.disconnect('acct_missing').catch((error: unknown) => error)
    expect(refused).toBeInstanceOf(FlungConnectError)
    expect(refused).toMatchObject({ status: 404, code: 'not_found' })
  })

  it('asks a token function again once when the token has expired', async () => {
    const api = fakeApi()
    const tokens = ['flung_ct_old.x', 'flung_ct_new.x']
    const source = vi.fn(async () => tokens.shift() ?? '')
    const expiring: typeof fetch = async (input, init) => {
      const request = new Request(input, init)
      if (request.headers.get('authorization') === 'Bearer flung_ct_old.x') return Response.json({ error: { code: 'unauthorized', message: 'expired' } }, { status: 401 })
      return api.fetch(request)
    }
    const client = new ConnectClient({ token: source, fetch: expiring })
    await expect(client.accounts()).resolves.toEqual([])
    await expect(client.platforms()).resolves.toHaveLength(4)
    expect(source).toHaveBeenCalledTimes(2)
  })

  it('reports a network failure as network_error', async () => {
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: async () => Promise.reject(new TypeError('offline')) })
    await expect(client.accounts()).rejects.toMatchObject({ code: 'network_error', status: 0 })
  })

  it('waits for a session to end, and stops when aborted', async () => {
    const api = fakeApi()
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: api.fetch })
    const session = await client.connect('x')
    const abort = new AbortController()
    const waiting = client.waitForSession(session.id, { intervalMs: 5, signal: abort.signal })
    abort.abort()
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
    setTimeout(() => api.finish({ username: 'flung' }), 20)
    await expect(client.waitForSession(session.id, { intervalMs: 5 })).resolves.toMatchObject({ status: 'connected' })
  })
})

describe('connectInPopup', () => {
  it('opens the window before asking for the session, sends it to the consent page, and closes it when done', async () => {
    const api = fakeApi()
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: api.fetch })
    const popup = fakePopup()
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    const flow = connectInPopup(client, () => client.connect('x'))
    expect(open).toHaveBeenCalledTimes(1)
    expect(api.requests).toHaveLength(0)
    await vi.waitFor(() => expect(popup.location.href).toBe('https://platform.example/consent'))
    api.finish({ username: 'flung' })
    await expect(flow).resolves.toMatchObject({ kind: 'finished', session: { status: 'connected' } })
    expect(popup.closed).toBe(true)
  })

  it('says when the browser blocked the window, with the session to send the person to', async () => {
    const api = fakeApi()
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: api.fetch })
    vi.spyOn(window, 'open').mockReturnValue(null)
    await expect(connectInPopup(client, () => client.connect('x'))).resolves.toMatchObject({ kind: 'blocked', session: { authorizationUrl: 'https://platform.example/consent' } })
  })

  it('closes the window when the API refuses to start', async () => {
    const api = fakeApi()
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: api.fetch })
    const popup = fakePopup()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    await expect(connectInPopup(client, () => client.disconnect('acct_missing').then(() => client.connect('x')))).rejects.toBeInstanceOf(FlungConnectError)
    expect(popup.closed).toBe(true)
  })
})

describe('returning from a redirect', () => {
  it('reads Flung\'s result from the address and takes it off again', () => {
    const address = 'https://app.example/accounts?tab=social&flung_session_id=cs_1&flung_status=connected&flung_account_ids=acct_1,acct_2'
    expect(readRedirectResult(address)).toEqual({ sessionId: 'cs_1', status: 'connected', accountIds: ['acct_1', 'acct_2'], error: null })
    expect(withoutRedirectResult(address)).toBe('https://app.example/accounts?tab=social')
    expect(readRedirectResult('https://app.example/?flung_session_id=cs_1&flung_status=error&flung_error=access_denied&flung_message=No')).toMatchObject({ status: 'error', error: { code: 'access_denied', message: 'No' } })
    expect(readRedirectResult('https://app.example/accounts')).toBeNull()
  })
})

describe('platform lists', () => {
  it('parse a list attribute and the platforms a token names', () => {
    expect(parsePlatformList(' X, linkedin,myspace,x ')).toEqual(['x', 'linkedin'])
    expect(parsePlatformList('')).toBeNull()
    expect(tokenPlatforms(token(['x', 'bluesky']))).toEqual(['x', 'bluesky'])
    expect(tokenPlatforms(token())).toBeNull()
    expect(tokenPlatforms('flung_sk_live')).toBeNull()
  })
})
