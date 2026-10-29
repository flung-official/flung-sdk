import type { Account, ConnectSession } from '../core/types.js'

/** `flung-load`: the accounts were read, on first show and after every change. */
export interface LoadDetail {
  /** The connected accounts the panel shows, newest first. */
  accounts: Account[]
}

/** `flung-connect`: a connect or reconnect finished. `accounts` are the ones stored; Facebook stores one per page. */
export interface ConnectDetail {
  /** The connect session, or null when the person came back from a redirect. */
  session: ConnectSession | null
  /** The accounts stored. */
  accounts: Account[]
}

/** `flung-disconnect`: an account was disconnected. */
export interface DisconnectDetail {
  /** The account, now `disconnected`. */
  account: Account
}

/** `flung-error`: a call or a connect failed. `code` is the API's stable code, such as `forbidden` or `access_denied`. */
export interface ErrorDetail {
  /** The API's stable code, or the platform's, such as `access_denied`. */
  code: string
  /** What went wrong, for a person. */
  message: string
}

export interface FlungConnectEventMap {
  'flung-load': CustomEvent<LoadDetail>
  'flung-connect': CustomEvent<ConnectDetail>
  'flung-disconnect': CustomEvent<DisconnectDetail>
  'flung-error': CustomEvent<ErrorDetail>
}
