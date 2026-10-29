import type { Account, ConnectSession, Platform, PlatformInfo } from './types.js'

export const DEFAULT_BASE_URL = 'https://api.flung.dev'
const POLL_MS = 2_000

/** A connect token (`flung_ct_...`), or a function that fetches a fresh one from your server. */
export type TokenSource = string | (() => Promise<string>)

export interface ConnectClientOptions {
  token: TokenSource
  /** Where the API lives. Defaults to production; `https://api-preview.flung.dev` for preview. */
  baseUrl?: string | undefined
  /** A `fetch` to use instead of the global one. */
  fetch?: typeof fetch | undefined
}

/** A refused call: the API's stable `code` (`forbidden`, `not_configured`, ...) and its message. */
export class FlungConnectError extends Error {
  override readonly name = 'FlungConnectError'
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown = undefined,
  ) {
    super(message)
  }
}

/**
 * The calls a connect token may make, over `fetch`. A token source that is a function is asked again when the API says
 * the token has expired, once per call, so a long-open page keeps working.
 */
export class ConnectClient {
  readonly #baseUrl: string
  readonly #fetch: typeof fetch
  readonly #source: TokenSource
  #token: string | null

  constructor(options: ConnectClientOptions) {
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.#fetch = options.fetch ?? ((input, init) => fetch(input, init))
    this.#source = options.token
    this.#token = typeof options.token === 'string' ? options.token : null
  }

  /** Every platform, and whether this Flung can connect it. */
  async platforms(): Promise<PlatformInfo[]> {
    return (await this.#call<{ data: PlatformInfo[] }>('GET', '/v1/platforms')).data
  }

  /** The connected accounts the token may see: its profile's, or the whole workspace's. */
  async accounts(): Promise<Account[]> {
    return (await this.#call<{ data: Account[] }>('GET', '/v1/accounts')).data
  }

  /** Starts connecting a new account. `handle` is the Bluesky handle, or the Mastodon instance (required there). */
  async connect(platform: Platform, options: { handle?: string | undefined; redirectUrl?: string | undefined } = {}): Promise<ConnectSession> {
    return this.#call<ConnectSession>('POST', `/v1/connect/${encodeURIComponent(platform)}`, compact({ handle: options.handle, redirectUrl: options.redirectUrl }))
  }

  /** Starts reconnecting an account that needs it; the person must sign in as the same platform user. */
  async reconnect(accountId: string, options: { redirectUrl?: string | undefined } = {}): Promise<ConnectSession> {
    return this.#call<ConnectSession>('POST', `/v1/accounts/${encodeURIComponent(accountId)}/reconnect`, compact({ redirectUrl: options.redirectUrl }))
  }

  /** Deletes the account's stored tokens. It stays listed as `disconnected`. */
  async disconnect(accountId: string): Promise<Account> {
    return this.#call<Account>('DELETE', `/v1/accounts/${encodeURIComponent(accountId)}`)
  }

  /** A connect session's state: pending, connected, failed or expired. */
  async session(id: string): Promise<ConnectSession> {
    return this.#call<ConnectSession>('GET', `/v1/connect-sessions/${encodeURIComponent(id)}`)
  }

  /** Resolves once the session is no longer `pending`. Rejects with an `AbortError` when `signal` aborts. */
  async waitForSession(id: string, options: { signal?: AbortSignal | undefined; intervalMs?: number | undefined } = {}): Promise<ConnectSession> {
    for (;;) {
      options.signal?.throwIfAborted()
      const session = await this.session(id)
      if (session.status !== 'pending') return session
      await delay(options.intervalMs ?? POLL_MS, options.signal)
    }
  }

  async #call<T>(method: string, path: string, body?: Record<string, string>): Promise<T> {
    let response = await this.#send(method, path, body, await this.#currentToken(false))
    if (response.status === 401 && typeof this.#source === 'function') response = await this.#send(method, path, body, await this.#currentToken(true))
    const text = await response.text()
    const parsed = parse(text)
    if (!response.ok) {
      const error = (parsed as { error?: { code?: unknown; message?: unknown; details?: unknown } } | null)?.error
      throw new FlungConnectError(response.status, typeof error?.code === 'string' ? error.code : 'http_error', typeof error?.message === 'string' ? error.message : `Flung answered ${response.status}.`, error?.details)
    }
    return parsed as T
  }

  #send(method: string, path: string, body: Record<string, string> | undefined, token: string): Promise<Response> {
    const headers: Record<string, string> = { authorization: `Bearer ${token}` }
    if (body !== undefined) headers['content-type'] = 'application/json'
    return this.#fetch(`${this.#baseUrl}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }).catch((error: unknown) => {
      throw new FlungConnectError(0, 'network_error', `Could not reach Flung: ${String(error)}`)
    })
  }

  async #currentToken(fresh: boolean): Promise<string> {
    if (typeof this.#source === 'string') return this.#source
    if (this.#token === null || fresh) this.#token = await this.#source()
    return this.#token
  }
}

function compact(values: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined))
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function delay(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}
