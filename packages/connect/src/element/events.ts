import type { Account, ConnectSession } from '../core/types.js'

/** `flung-load`: the accounts were read, on first show and after every change. */
export interface LoadDetail {
  accounts: Account[]
}

/** `flung-connect`: a connect or reconnect finished. `accounts` are the ones stored; Facebook stores one per page. */
export interface ConnectDetail {
  session: ConnectSession | null
  accounts: Account[]
}

/** `flung-disconnect`: an account was disconnected. */
export interface DisconnectDetail {
  account: Account
}

/** `flung-error`: a call or a connect failed. `code` is the API's stable code, such as `forbidden` or `access_denied`. */
export interface ErrorDetail {
  code: string
  message: string
}

export interface FlungConnectEventMap {
  'flung-load': CustomEvent<LoadDetail>
  'flung-connect': CustomEvent<ConnectDetail>
  'flung-disconnect': CustomEvent<DisconnectDetail>
  'flung-error': CustomEvent<ErrorDetail>
}
