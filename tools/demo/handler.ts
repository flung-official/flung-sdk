/**
 * One function that answers every request of the demo: the page, the built panel from `packages/connect/dist`, and the
 * seven calls a connect token reaches, from a fixture set. A connect stays pending, so the panel shows its waiting state,
 * unless the set has `finishConnect`: then the session turns connected after a few reads and the account is added.
 */
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Account, ConnectSession, Platform } from '../../packages/connect/src/core/types'
import type { FixtureSet } from './fixtures'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const DIST = join(ROOT, 'packages/connect/dist')
const PAGE = join(ROOT, 'tools/demo/page.html')

export interface Answer {
  status: number
  headers: Record<string, string>
  body: string | Buffer
}

const TYPES: Record<string, string> = { '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.map': 'application/json' }
const json = (status: number, value: unknown): Answer => ({ status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) })
const notFound = () => json(404, { error: { code: 'not_found', message: 'No such route.' } })

export function createDemoHandler(set: FixtureSet) {
  let accounts: Account[] = []
  let sessions = new Map<string, ConnectSession>()
  /* How often each session has been read, and the handle each connect was started with. */
  let polls = new Map<string, number>()
  let handles = new Map<string, string>()
  let variants = new Map<string, string>()
  let next = 1
  const reset = () => {
    accounts = set.accounts.map((account) => ({ ...account }))
    sessions = new Map()
    polls = new Map()
    handles = new Map()
    variants = new Map()
    next = 1
  }
  reset()

  /** Finishes a pending session once it has been read `afterPolls` times: the account is added, or made active again. */
  function finish(session: ConnectSession): ConnectSession {
    const rule = set.finishConnect
    const read = (polls.get(session.id) ?? 0) + 1
    polls.set(session.id, read)
    if (rule === undefined || session.status !== 'pending' || read < rule.afterPolls) return session
    let found = accounts.find((account) => account.id === session.accountId)
    const number = Number(session.id.slice('cs_demo'.length))
    if (found === undefined && variants.get(session.id) === 'pages') {
      // LinkedIn pages: one account per page the person administers, posting as the organisation.
      const pages = (rule.pages ?? ['Acme']).map((name, index): Account => ({ id: `acct_demo${String(200 + number * 10 + index).padStart(4, '0')}`, platform: session.platform, platformUserId: `urn:li:organization:${2000 + number * 10 + index}`, username: name, displayName: name, profileId: null, status: 'active', reconnectBy: null, createdAt: '2026-10-29T09:00:00.000Z' }))
      accounts.push(...pages)
      const done: ConnectSession = { ...session, status: 'connected', authorizationUrl: null, accountIds: pages.map((page) => page.id) }
      sessions.set(session.id, done)
      return done
    }
    if (found === undefined) {
      const name = (rule.usernames?.[session.platform] ?? 'acme').replace('{handle}', handles.get(session.id) ?? '')
      found = { id: `acct_demo${String(100 + number).padStart(4, '0')}`, platform: session.platform, platformUserId: String(9_100_000 + number), username: name, profileId: null, status: 'active', reconnectBy: null, createdAt: '2026-10-29T09:00:00.000Z' }
      accounts.push(found)
    } else {
      found.status = 'active'
      found.reconnectBy = null
    }
    const done: ConnectSession = { ...session, status: 'connected', authorizationUrl: null, accountIds: [found.id] }
    sessions.set(session.id, done)
    return done
  }

  function api(method: string, path: string, body: string | undefined): Answer {
    if (set.refuse !== undefined) return json(set.refuse.status, { error: { code: set.refuse.code, message: set.refuse.message } })
    const [, , resource, id, action] = path.split('/')
    if (method === 'GET' && resource === 'platforms') {
      return json(200, { data: ['x', 'instagram', 'facebook', 'threads', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'discord', 'farcaster'].map((platform) => ({ platform, connectable: (set.connectable as string[]).includes(platform), variants: set.variants?.[platform as Platform] ?? [] })) })
    }
    if (method === 'GET' && resource === 'accounts') return json(200, { data: accounts })
    if (method === 'DELETE' && resource === 'accounts') {
      const found = accounts.find((account) => account.id === id)
      if (found === undefined) return notFound()
      found.status = 'disconnected'
      return json(200, found)
    }
    if (method === 'POST' && (resource === 'connect' || action === 'reconnect')) {
      const platform = resource === 'connect' ? id : accounts.find((account) => account.id === id)?.platform
      const session = { id: `cs_demo${next++}`, platform, accountId: resource === 'connect' ? null : (id ?? null), status: 'pending', authorizationUrl: 'about:blank', expiresAt: '2030-01-01T00:00:00.000Z', accountIds: [], error: null } as ConnectSession
      sessions.set(session.id, session)
      const handle = readBody(body, 'handle')
      if (handle !== undefined) handles.set(session.id, handle)
      const variant = readBody(body, 'variant')
      if (variant !== undefined) variants.set(session.id, variant)
      return json(201, session)
    }
    if (method === 'GET' && resource === 'connect-sessions') {
      const session = sessions.get(id ?? '')
      return session === undefined ? notFound() : json(200, finish(session))
    }
    return notFound()
  }

  /** The answer to a request, or null for one the demo does not serve. `body` is the request's, for a connect's handle. */
  function handle(method: string, url: URL, body?: string): Answer | null {
    if (url.pathname.startsWith('/v1/')) return api(method, url.pathname, body)
    if (url.pathname === '/' || url.pathname === '/index.html') return { status: 200, headers: { 'content-type': TYPES['.html'] ?? '' }, body: readFileSync(PAGE) }
    if (url.pathname.startsWith('/connect/')) {
      const file = normalize(join(DIST, url.pathname.slice('/connect/'.length)))
      if (!file.startsWith(DIST) || !existsSync(file)) return notFound()
      return { status: 200, headers: { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }, body: readFileSync(file) }
    }
    return null
  }

  return { handle, reset }
}

/** A field a connect was started with (its `handle` or `variant`), from its JSON body. */
function readBody(body: string | undefined, field: 'handle' | 'variant'): string | undefined {
  if (body === undefined || body === '') return undefined
  try {
    const value = (JSON.parse(body) as Record<string, unknown>)[field]
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}
