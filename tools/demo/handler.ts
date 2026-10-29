/**
 * One function that answers every request of the demo: the page, the built panel from `packages/connect/dist`, and the
 * seven calls a connect token reaches, from a fixture set. A connect stays pending, so the panel shows its waiting state.
 */
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Account, ConnectSession } from '../../packages/connect/src/core/types'
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
  let next = 1
  const reset = () => {
    accounts = set.accounts.map((account) => ({ ...account }))
    sessions = new Map()
    next = 1
  }
  reset()

  function api(method: string, path: string): Answer {
    if (set.refuse !== undefined) return json(set.refuse.status, { error: { code: set.refuse.code, message: set.refuse.message } })
    const [, , resource, id, action] = path.split('/')
    if (method === 'GET' && resource === 'platforms') {
      return json(200, { data: ['x', 'instagram', 'facebook', 'threads', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'discord', 'farcaster'].map((platform) => ({ platform, connectable: (set.connectable as string[]).includes(platform) })) })
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
      return json(201, session)
    }
    if (method === 'GET' && resource === 'connect-sessions') {
      const session = sessions.get(id ?? '')
      return session === undefined ? notFound() : json(200, session)
    }
    return notFound()
  }

  function handle(method: string, url: URL): Answer | null {
    if (url.pathname.startsWith('/v1/')) return api(method, url.pathname)
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
