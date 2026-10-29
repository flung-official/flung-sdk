import type { Error as ErrorBody } from './generated/types.gen'

/** The API's stable error codes, plus `network_error` when no answer arrived at all. */
export type FlungErrorCode = ErrorBody['error']['code'] | 'network_error' | 'unexpected_response'

/**
 * What every failed call throws. Branch on `code`, which never changes; `message` is for people and may.
 *
 * ```ts
 * try { await flung.posts.create({ content, accountIds }) }
 * catch (error) { if (error instanceof FlungError && error.code === 'account_needs_reconnect') ... }
 * ```
 */
export class FlungError extends Error {
  override readonly name = 'FlungError'

  constructor(
    /** The HTTP status, or `null` when the request never got an answer. */
    readonly status: number | null,
    readonly code: FlungErrorCode,
    message: string,
    /** Extra detail some codes carry, such as the unknown `accountIds` or the validation issues. */
    readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options)
  }

  /** Builds the error from what the generated client caught: the parsed error body, its text, or a thrown `Error`. */
  static from(error: unknown, response: Response | undefined): FlungError {
    if (error instanceof FlungError) return error
    if (response === undefined) {
      const message = error instanceof Error ? error.message : String(error)
      return new FlungError(null, 'network_error', `The Flung API could not be reached: ${message}`, undefined, { cause: error })
    }
    if (isErrorBody(error)) return new FlungError(response.status, error.error.code, error.error.message, error.error.details)
    return new FlungError(response.status, 'unexpected_response', `The Flung API answered ${response.status} without an error body.`, error)
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const inner: unknown = value.error
  return typeof inner === 'object' && inner !== null && 'code' in inner && typeof inner.code === 'string' && 'message' in inner && typeof inner.message === 'string'
}
