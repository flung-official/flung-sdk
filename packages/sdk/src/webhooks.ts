import type { Account, Post, WebhookEvent } from './generated/types.gen'

/** How far an event's timestamp may be from now, per the Standard Webhooks replay protection. */
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60
const SECRET_PREFIX = 'whsec_'

type PostEventType = Extract<WebhookEvent, `post.${string}` | `target.${string}`>
type AccountEventType = Extract<WebhookEvent, `account.${string}`>

interface EventBase<T extends WebhookEvent, D> {
  /** Unique per event; the same event redelivered keeps its id, so drop ids you have already handled. */
  id: string
  type: T
  createdAt: string
  data: D
}

/** A verified event. Narrow on `type` to get the matching `data`. */
export type FlungWebhookEvent =
  | EventBase<PostEventType, { post: Post }>
  | EventBase<AccountEventType, {
      account: Account
      /** Why, for `account.token_refresh_failed`. */
      reason?: string
      /** When the account stops working, for `account.reconnect_required_soon`. */
      expiresAt?: string
    }>

export class FlungWebhookError extends Error {
  override readonly name = 'FlungWebhookError'
}

/** Node's `req.headers` or a Fetch `Headers`. */
export type HeaderSource = Headers | Record<string, string | string[] | undefined>

export interface VerifyWebhookInput {
  /** The raw request body, exactly as received. Parsing and re-serialising it changes the bytes and breaks the signature. */
  body: string
  headers: HeaderSource
  /** The endpoint's `whsec_` secret. Pass two while you switch to a rotated secret; either one is accepted. */
  secret: string | readonly string[]
  /** The current time in Unix seconds, for tests. */
  nowSeconds?: number
}

/**
 * Checks a webhook from Flung and returns the parsed event, or throws `FlungWebhookError`. Flung signs to the
 * Standard Webhooks spec, so any Standard Webhooks library verifies its events too.
 */
export async function verifyWebhook(input: VerifyWebhookInput): Promise<FlungWebhookEvent> {
  const id = header(input.headers, 'webhook-id')
  const timestampText = header(input.headers, 'webhook-timestamp')
  const signatures = header(input.headers, 'webhook-signature')
  if (id === undefined || timestampText === undefined || signatures === undefined) {
    throw new FlungWebhookError('The webhook-id, webhook-timestamp and webhook-signature headers are required.')
  }
  const timestamp = Number(timestampText)
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000)
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new FlungWebhookError('The webhook timestamp is too far from now; it may be a replay.')
  }

  const candidates = signatures
    .split(' ')
    .filter((candidate) => candidate.startsWith('v1,'))
    .map((candidate) => candidate.slice(3))
  const signed = `${id}.${timestamp}.${input.body}`
  for (const secret of typeof input.secret === 'string' ? [input.secret] : input.secret) {
    const expected = await hmac(secret, signed)
    if (candidates.some((candidate) => timingSafeEqual(candidate, expected))) return JSON.parse(input.body) as FlungWebhookEvent
  }
  throw new FlungWebhookError('No webhook signature matches the secret.')
}

function header(headers: HeaderSource, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined
  const value = headers[name] ?? Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1]
  return Array.isArray(value) ? value[0] : value
}

async function hmac(secret: string, message: string): Promise<string> {
  const keyBytes = fromBase64(secret.startsWith(SECRET_PREFIX) ? secret.slice(SECRET_PREFIX.length) : secret)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return difference === 0
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}
