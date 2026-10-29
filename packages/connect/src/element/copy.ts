/**
 * Every word the panel shows, in English. Pass `labels` to put it in another language; `{platform}`, `{account}`,
 * `{message}` and `{date}` are filled in where a label has them.
 */
export interface ConnectLabels {
  /** The panel's name for a screen reader. */
  panel: string
  connect: string
  connectAnother: string
  reconnect: string
  disconnect: string
  confirmDisconnect: string
  keep: string
  cancel: string
  continue: string
  handleBluesky: string
  handleMastodon: string
  waiting: string
  blocked: string
  openSignIn: string
  connected: string
  failed: string
  expired: string
  disconnected: string
  needsReconnect: string
  reconnectBy: string
  loading: string
  loadFailed: string
  empty: string
  noToken: string
}

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
  loading: 'Loading accounts…',
  loadFailed: 'Could not load accounts: {message}',
  empty: 'There is nothing to connect here.',
  noToken: 'This panel has no connect token yet.',
}

export function format(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole)
}
