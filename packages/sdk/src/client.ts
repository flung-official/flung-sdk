import { createClient, createConfig } from './generated/client'
import type { Client } from './generated/client'
import { FlungApi } from './generated/sdk.gen'
import type { ConnectSession, Media } from './generated/types.gen'
import { FlungError } from './errors'

const DEFAULT_MAX_RETRIES = 2
const DEFAULT_TIMEOUT_MS = 60_000
const FIRST_RETRY_MS = 500
const MAX_RETRY_MS = 8_000
/** Answers worth trying again: the request may never have run, or the server asked for a pause. */
const RETRYABLE_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504])
export const DEFAULT_BASE_URL = 'https://api.flung.dev'
const IDEMPOTENCY_HEADER = 'idempotency-key'
const CONNECT_POLL_MS = 2_000
/** A little over a session's ten minutes, so the last poll sees it expire. */
const CONNECT_WAIT_MS = 11 * 60_000

export interface FlungOptions {
  /**
   * The credential: an API key (`flung_sk_...`), or an OAuth access token an app received through "Connect with Flung"
   * (see Authentication in the docs). Keep either on a server; never ship it to a browser.
   */
  apiKey: string
  /** Where the API lives. Defaults to production; pass `https://api-preview.flung.dev` to test against preview. */
  baseUrl?: string
  /** Attempts after the first for network failures, timeouts, 429 and 5xx answers. Default 2. */
  maxRetries?: number
  /** How long one attempt may take before it is abandoned (and retried). Default 60 seconds. */
  timeoutMs?: number
  /** A `fetch` to use instead of the global one, such as a test double. */
  fetch?: typeof fetch
}

/**
 * The Flung API client. Every resource of the API is a property: `flung.posts.create({ content, accountIds })`.
 *
 * Failed calls throw `FlungError`. Network failures, timeouts, 429 and 5xx answers are retried with backoff, honouring
 * `Retry-After`. Every POST carries an `Idempotency-Key` (generated unless you pass one), so a retry never schedules a
 * post twice.
 */
export class Flung extends FlungApi {
  constructor(options: FlungOptions) {
    if (typeof options.apiKey !== 'string' || options.apiKey.length === 0) throw new TypeError('Flung needs an apiKey: an API key or an OAuth access token.')
    if (options.baseUrl !== undefined && !/^https?:\/\//.test(options.baseUrl)) throw new TypeError('Flung needs an http(s) baseUrl, such as https://api.flung.dev.')
    super({ client: buildClient(options) })
  }

  /**
   * Uploads a file in one call and resolves with it `ready`, for `mediaIds`: reserves it, then sends the bytes, in
   * parts when it is over 100 MB. Flung reads the real type from the file itself; `contentType` is what you expect.
   *
   * ```ts
   * const image = await flung.uploadMedia(await readFile('launch.png'), { contentType: 'image/png', filename: 'launch.png' })
   * await flung.posts.create({ content: 'Launching today.', accountIds, mediaIds: [image.id] })
   * ```
   */
  async uploadMedia(data: Blob | Uint8Array | ArrayBuffer, options: { contentType: string; filename?: string }): Promise<Media> {
    const body = data instanceof Blob ? data : new Blob([data instanceof Uint8Array ? new Uint8Array(data) : data], { type: options.contentType })
    const reserved = await this.media.create({
      contentType: options.contentType as Media['contentType'],
      bytes: body.size,
      ...(options.filename === undefined ? {} : { filename: options.filename }),
    })
    if (reserved.multipart === null) {
      // Stated explicitly: the API needs the length up front to stream the file into storage.
      return this.media.upload({ id: reserved.id, body }, { headers: { 'content-length': String(body.size) } })
    }
    // Over 100 MB: exact parts, one at a time, so only a part is ever in flight. Slicing a Blob reads nothing.
    const { partSize, partCount } = reserved.multipart
    for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
      const part = body.slice((partNumber - 1) * partSize, Math.min(partNumber * partSize, body.size))
      await this.media.uploadPart({ id: reserved.id, partNumber, body: part }, { headers: { 'content-length': String(part.size) } })
    }
    return this.media.complete({ id: reserved.id })
  }

  /**
   * Waits until the person finishes a connect or reconnect: resolves with the session once it is `connected`, `failed`
   * or `expired`. Sessions last ten minutes, so this never waits longer than that unless `timeoutMs` says so.
   *
   * ```ts
   * const session = await flung.accounts.connect({ platform: 'linkedin' })
   * console.warn(`Open ${session.authorizationUrl}`)
   * const done = await flung.waitForConnection(session.id)
   * ```
   */
  async waitForConnection(sessionId: string, options: { intervalMs?: number; timeoutMs?: number } = {}): Promise<ConnectSession> {
    const deadline = Date.now() + (options.timeoutMs ?? CONNECT_WAIT_MS)
    for (;;) {
      const session = await this.connectSessions.get({ id: sessionId })
      if (session.status !== 'pending') return session
      if (Date.now() >= deadline) return session
      await sleep(options.intervalMs ?? CONNECT_POLL_MS)
    }
  }

  /**
   * Walks every page of a list: `for await (const post of flung.paginate((page) => flung.posts.list(page)))`.
   * Pass the first page's parameters (such as `limit`) as the second argument.
   */
  async *paginate<T extends { id: string }, P extends object>(
    list: (params: P & { startingAfter?: string }) => Promise<{ data: T[]; hasMore: boolean }>,
    params = {} as P,
  ): AsyncGenerator<T, void, undefined> {
    let page = await list(params)
    for (;;) {
      yield* page.data
      const last = page.data.at(-1)
      if (!page.hasMore || last === undefined) return
      page = await list({ ...params, startingAfter: last.id })
    }
  }
}

function buildClient(options: FlungOptions): Client {
  const client = createClient(
    createConfig({
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
      throwOnError: true,
      auth: options.apiKey,
      fetch: retryingFetch(options.fetch ?? ((input, init) => fetch(input, init)), options.maxRetries ?? DEFAULT_MAX_RETRIES, options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    }),
  )
  client.interceptors.request.use((request) => {
    if (request.method === 'POST' && !request.headers.has(IDEMPOTENCY_HEADER)) request.headers.set(IDEMPOTENCY_HEADER, crypto.randomUUID())
    return request
  })
  client.interceptors.error.use((error, response) => FlungError.from(error, response))
  return client
}

/**
 * Wraps `fetch` with timeouts and retries. Each attempt sends a fresh clone of the request, since a body can be read
 * only once.
 */
export function retryingFetch(inner: typeof fetch, maxRetries: number, timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const original = new Request(input, init)
    for (let attempt = 0; ; attempt += 1) {
      const last = attempt >= maxRetries
      let response: Response
      try {
        response = await inner(original.clone(), { signal: AbortSignal.any([original.signal, AbortSignal.timeout(timeoutMs)]) })
      } catch (error) {
        // The caller's own abort is final; anything else (a reset, a DNS failure, our timeout) is worth another try.
        if (last || original.signal.aborted) throw error
        await sleep(backoffMs(attempt, null))
        continue
      }
      if (last || !RETRYABLE_STATUSES.has(response.status)) return response
      await response.body?.cancel()
      await sleep(backoffMs(attempt, response.headers.get('retry-after')))
    }
  }
}

/** Exponential backoff with full jitter, or the server's `Retry-After` (seconds) when it gives one, capped either way. */
export function backoffMs(attempt: number, retryAfter: string | null, random = Math.random): number {
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_MS)
  return Math.round(random() * Math.min(FIRST_RETRY_MS * 2 ** attempt, MAX_RETRY_MS))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
