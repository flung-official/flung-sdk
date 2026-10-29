/**
 * `@flung.official/connect/core`: the connect calls and flows with no element, for a page that draws its own panel.
 */
export { ConnectClient, DEFAULT_BASE_URL, FlungConnectError } from './client.js'
export type { ConnectClientOptions, TokenSource } from './client.js'
export { connectInPopup, readRedirectResult, withoutRedirectResult } from './flows.js'
export type { PopupOutcome, RedirectResult } from './flows.js'
export { HANDLE_PROMPT, isPlatform, parsePlatformList, PLATFORM_NAMES, tokenPlatforms } from './platforms.js'
export { PLATFORMS } from './types.js'
export type { Account, AccountStatus, ConnectSession, ConnectSessionStatus, Platform, PlatformInfo } from './types.js'
