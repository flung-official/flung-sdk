/**
 * Every word the panel shows, in English. Pass `labels` to put it in another language or say it your way; `{platform}`, `{account}`,
 * `{message}`, `{date}` and `{count}` are filled in where a label has them.
 */
export interface ConnectLabels {
  /** The panel's name for a screen reader. */
  panel: string
  /** The button on a platform with no accounts yet. */
  connect: string
  /** The button on a platform that already has an account. */
  connectAnother: string
  /** The button beside an account that needs reconnecting. */
  reconnect: string
  /** The button beside each account, and the one that confirms. */
  disconnect: string
  /** The question before a disconnect. `{account}`. */
  confirmDisconnect: string
  /** The button that keeps the account instead. */
  keep: string
  /** Stops waiting, or closes a question. */
  cancel: string
  /** Sends the Mastodon server or Bluesky handle. */
  continue: string
  /** The Bluesky handle field's label. */
  handleBluesky: string
  /** The Mastodon server field's label. */
  handleMastodon: string
  /** While the sign-in window is open. `{platform}`. */
  waiting: string
  /** When the browser refused to open the window. `{platform}`. */
  blocked: string
  /** The link to the consent page when the window was blocked. `{platform}`. */
  openSignIn: string
  /** After a connect. `{platform}`. */
  connected: string
  /** After a connect that failed. `{platform}` and `{message}`. */
  failed: string
  /** After a connect session ran out of time. `{platform}`. */
  expired: string
  /** After a disconnect. `{account}`. */
  disconnected: string
  /** Beside an account that must be reconnected. */
  needsReconnect: string
  /** Beside an account whose connection ends soon. `{date}`. */
  reconnectBy: string
  /** Under a platform's name once it has accounts. `{count}`. */
  connectedCount: string
  /** Under a platform's name before it has any. */
  notConnected: string
  /** Before Flung's name in the panel's footer, which `branding="none"` hides. */
  securedBy: string
  /** While the accounts are read for the first time. */
  loading: string
  /** When the accounts could not be read. `{message}`. */
  loadFailed: string
  /** When there is no platform to offer. */
  empty: string
  /** When the panel has no connect token. */
  noToken: string
  /** The question above the choice between a profile and a page, when a platform offers both. `{platform}`. */
  chooseVariant: string
  /** The choice that connects the person's own profile. */
  variantPersonal: string
  /** The line under it. */
  variantPersonalDescription: string
  /** The choice that connects the company pages the person administers. */
  variantPages: string
  /** The line under it. */
  variantPagesDescription: string
  /** The platform's name on its pages tile, with `variants="tiles"`, or when pages are all it can connect. `{platform}`. */
  pagesName: string
  /** The small tag beside an account that is a company page, not a person. */
  pageTag: string
}

/** The panel's words in English. */
export const DEFAULT_LABELS: ConnectLabels = {
  panel: 'Connected accounts',
  connect: 'Connect',
  connectAnother: 'Add another',
  reconnect: 'Reconnect',
  disconnect: 'Disconnect',
  confirmDisconnect: 'Disconnect {account}? Posts to it will stop.',
  keep: 'Keep it',
  cancel: 'Cancel',
  continue: 'Continue',
  handleBluesky: 'Your Bluesky handle, such as alice.bsky.social (optional)',
  handleMastodon: 'Your Mastodon server, such as mastodon.social',
  waiting: 'Finish signing in to {platform} in the window that opened.',
  blocked: 'Your browser did not open the {platform} window.',
  openSignIn: 'Open {platform} sign-in',
  connected: '{platform} is connected.',
  failed: '{platform} was not connected: {message}',
  expired: 'Signing in to {platform} took too long. Try again.',
  disconnected: '{account} is disconnected.',
  needsReconnect: 'Needs reconnecting',
  reconnectBy: 'Reconnect by {date}',
  connectedCount: '{count} connected',
  notConnected: 'Not connected',
  securedBy: 'Secured by',
  loading: 'Loading accounts…',
  loadFailed: 'Could not load accounts: {message}',
  empty: 'There is nothing to connect here.',
  noToken: 'This panel has no connect token yet.',
  chooseVariant: 'What do you want to connect on {platform}?',
  variantPersonal: 'Personal profile',
  variantPersonalDescription: 'Post as yourself.',
  variantPages: 'Company page',
  variantPagesDescription: 'Post as a page you admin.',
  pagesName: '{platform} Page',
  pageTag: 'Page',
}

/** Fills a label's `{name}` places from `values`, leaving any it has no value for as they are. The result is text, never markup. */
export function formatLabel(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole)
}
