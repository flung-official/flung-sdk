import type { ConnectClient } from './client.js'
import type { ConnectSession } from './types.js'

const POPUP_NAME = 'flung-connect'
const POPUP_FEATURES = 'popup,width=520,height=720'

/** How a connect in a window ended: the session, or `blocked` when the browser refused to open the window. */
export type PopupOutcome = { kind: 'finished'; session: ConnectSession } | { kind: 'blocked'; session: ConnectSession }

/**
 * Opens the platform's consent page in a small window and resolves when the person finishes. Call it straight from a
 * click: browsers open a window only during one, so it is opened before the session is asked for, then sent there.
 *
 * It waits on the session, not the window. A platform's sign-in page may cut the link back to this page, after which
 * the window looks closed while the person is still in it, so only the session can say they are done. Abort `signal`
 * to stop waiting (a Cancel button).
 */
export async function connectInPopup(client: ConnectClient, start: () => Promise<ConnectSession>, options: { signal?: AbortSignal | undefined; onStarted?: ((session: ConnectSession) => void) | undefined } = {}): Promise<PopupOutcome> {
  const popup = typeof window === 'undefined' ? null : window.open('', POPUP_NAME, POPUP_FEATURES)
  let session: ConnectSession
  try {
    session = await start()
  } catch (error) {
    popup?.close()
    throw error
  }
  options.onStarted?.(session)
  if (session.authorizationUrl === null) {
    popup?.close()
    return { kind: 'finished', session }
  }
  if (popup === null) return { kind: 'blocked', session }
  popup.location.href = session.authorizationUrl
  try {
    const finished = await client.waitForSession(session.id, { signal: options.signal })
    return { kind: 'finished', session: finished }
  } finally {
    // May do nothing once the platform cut the link; Flung's last page then says the window can be closed.
    popup.close()
  }
}

/** What Flung put on `redirectUrl` when a connect that left the page came back to it. */
export interface RedirectResult {
  sessionId: string
  status: 'connected' | 'error'
  accountIds: string[]
  error: { code: string; message: string } | null
}

const PARAMS = ['flung_session_id', 'flung_status', 'flung_account_ids', 'flung_error', 'flung_message'] as const

/** Reads the result from an address Flung sent the person back to, or null when it carries none. */
export function readRedirectResult(address: string): RedirectResult | null {
  const query = new URL(address).searchParams
  const sessionId = query.get('flung_session_id')
  const status = query.get('flung_status')
  if (sessionId === null || (status !== 'connected' && status !== 'error')) return null
  return {
    sessionId,
    status,
    accountIds: (query.get('flung_account_ids') ?? '').split(',').filter((id) => id !== ''),
    error: status === 'error' ? { code: query.get('flung_error') ?? 'platform_error', message: query.get('flung_message') ?? '' } : null,
  }
}

/** The address without Flung's result, to put back in the address bar once it is read. */
export function withoutRedirectResult(address: string): string {
  const url = new URL(address)
  for (const name of PARAMS) url.searchParams.delete(name)
  return url.toString()
}
