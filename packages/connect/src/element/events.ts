import type { ConnectState } from '../core/controller.js'
import type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from '../core/events.js'

export type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from '../core/events.js'

/** `flung-change`: the panel's state changed. Does not bubble; for a page that draws parts of the panel itself. */
export interface ChangeDetail {
  /** The new snapshot. */
  state: ConnectState
}

/** The element's events, for `addEventListener` types. */
export interface FlungConnectEventMap {
  /** The accounts were read. */
  'flung-load': CustomEvent<LoadDetail>
  /** A connect or reconnect finished. */
  'flung-connect': CustomEvent<ConnectDetail>
  /** An account was disconnected. */
  'flung-disconnect': CustomEvent<DisconnectDetail>
  /** A call or a connect failed. */
  'flung-error': CustomEvent<ErrorDetail>
  /** The state changed. */
  'flung-change': CustomEvent<ChangeDetail>
}
