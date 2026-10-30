/**
 * `@flung.dev/connect/core`: the connect calls, flows and headless controller with no element, for a page that draws
 * its own panel.
 */
export { ConnectClient, DEFAULT_BASE_URL, FlungConnectError } from './client.js'
export type { ConnectClientOptions, TokenSource } from './client.js'
export { createConnectController, initialConnectState } from './controller.js'
export type { AccountItem, ConnectActions, ConnectController, ConnectControllerOptions, ConnectNotice, ConnectOptions, ConnectState, PlatformItem, PlatformStep } from './controller.js'
export type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from './events.js'
export { connectInPopup, readRedirectResult, withoutRedirectResult } from './flows.js'
export type { PopupOutcome, RedirectResult } from './flows.js'
export { DEFAULT_LABELS, formatLabel } from './labels.js'
export type { ConnectLabels } from './labels.js'
export { HANDLE_PROMPT, isConnectVariant, isPageAccount, isPlatform, parsePlatformList, PLATFORM_NAMES, tokenPlatforms } from './platforms.js'
export { CONNECT_VARIANTS, PLATFORMS } from './types.js'
export type { Account, AccountStatus, ConnectSession, ConnectSessionStatus, ConnectVariant, Platform, PlatformInfo } from './types.js'
