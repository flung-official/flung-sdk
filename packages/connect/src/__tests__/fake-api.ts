import type { Account, ConnectSession, Platform } from '../core/types.js'

/** The approval link the API gives for Farcaster: it opens Warpcast. */
export const WARPCAST_LINK = 'https://client.warpcast.com/deeplinks/signed-key-request?token=0x8f2c41d07a3b9e55'

/**
 * The seven calls a connect token reaches, answered from memory the way the Flung API answers them, recording each
 * request. `finish()` ends the pending session as the platform's callback would.
 */
export function fakeApi(options: { connectable?: Platform[]; variants?: Partial<Record<Platform, string[]>>; omitVariants?: boolean; farcaster?: boolean } = {}) {
  const connectable = options.connectable ?? ['x', 'linkedin', 'mastodon']
  const variants = options.variants ?? {}
  const accounts: Account[] = []
  const sessions = new Map<string, ConnectSession>()
  const requests: { method: string; path: string; body: unknown; token: string }[] = []
  let next = 1

  const account = (platform: Platform, username: string, extra: Partial<Account> = {}): Account => {
    const made: Account = { id: `acct_${next++}`, platform, platformUserId: `${next}`, username, profileId: null, status: 'active', reconnectBy: null, createdAt: '2026-10-29T00:00:00.000Z', ...extra }
    accounts.push(made)
    return made
  }

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    const body = request.method === 'GET' || request.method === 'DELETE' ? undefined : ((await request.json()) as unknown)
    requests.push({ method: request.method, path: url.pathname, body, token: request.headers.get('authorization')?.replace('Bearer ', '') ?? '' })
    const [, , resource, id, action] = url.pathname.split('/')
    if (request.method === 'GET' && resource === 'platforms') {
      // As the API answers since LinkedIn pages: every platform has `variants`, empty unless set up. `omitVariants` is an older API.
      return Response.json({
        data: [
          ...['x', 'linkedin', 'mastodon', 'tiktok'].map((platform) => ({ platform, connectable: connectable.includes(platform as Platform), ...(options.omitVariants === true ? {} : { variants: variants[platform as Platform] ?? [] }) })),
          // Farcaster, set up, is approved in Warpcast: `connectFlow: approval`.
          ...(options.farcaster === true ? [{ platform: 'farcaster', connectable: true, variants: [], connectFlow: 'approval' }] : []),
        ],
      })
    }
    if (request.method === 'GET' && resource === 'accounts') return Response.json({ data: [...accounts].reverse() })
    if (request.method === 'DELETE' && resource === 'accounts') {
      const found = accounts.find((candidate) => candidate.id === id)
      if (found === undefined) return Response.json({ error: { code: 'not_found', message: 'No such account.' } }, { status: 404 })
      found.status = 'disconnected'
      return Response.json(found)
    }
    if (request.method === 'POST' && (resource === 'connect' || action === 'reconnect')) {
      const platform = (resource === 'connect' ? id : accounts.find((candidate) => candidate.id === id)?.platform) as Platform
      const session: ConnectSession = {
        id: `cs_${next++}`,
        platform,
        accountId: resource === 'connect' ? null : (id ?? null),
        status: 'pending',
        authorizationUrl: platform === 'farcaster' ? WARPCAST_LINK : 'https://platform.example/consent',
        expiresAt: '2030-01-01T00:00:00.000Z',
        accountIds: [],
        error: null,
      }
      sessions.set(session.id, session)
      return Response.json(session, { status: 201 })
    }
    if (request.method === 'GET' && resource === 'connect-sessions') {
      const session = sessions.get(id ?? '')
      return session === undefined ? Response.json({ error: { code: 'not_found', message: 'No such session.' } }, { status: 404 }) : Response.json(session)
    }
    return Response.json({ error: { code: 'not_found', message: 'No such route.' } }, { status: 404 })
  }

  /**
   * Ends every pending session: connected with a new account (and `more`, as LinkedIn pages connect one per page, each
   * with its own `platformUserId`), or failed with the platform's reason.
   */
  function finish(outcome: { username: string; platformUserId?: string; more?: { username: string; platformUserId: string }[] } | { error: string } | { expired: true }) {
    for (const session of sessions.values()) {
      if (session.status !== 'pending') continue
      session.authorizationUrl = null
      if ('expired' in outcome) {
        session.status = 'expired'
      } else if ('error' in outcome) {
        session.status = 'failed'
        session.error = { code: 'access_denied', message: outcome.error }
      } else {
        session.status = 'connected'
        const made = [{ username: outcome.username, platformUserId: outcome.platformUserId }, ...(outcome.more ?? [])].map((one) => account(session.platform, one.username, one.platformUserId === undefined ? {} : { platformUserId: one.platformUserId }))
        session.accountIds = made.map((one) => one.id)
      }
    }
  }

  return { fetch, requests, accounts, sessions, account, finish }
}

/** A window as `window.open` gives one: records where it was sent and whether it was closed. */
export function fakePopup() {
  return { location: { href: '' }, closed: false, close() { this.closed = true } }
}
