/**
 * The sets the demo API answers from: what `GET /v1/platforms` and `GET /v1/accounts` return, and how a connect ends.
 * Every name and id is made up. The shapes are `@flung.dev/connect`'s own types, so a set cannot drift from the panel.
 */
import { PLATFORMS } from '../../packages/connect/src/core/types'
import type { Account, Platform } from '../../packages/connect/src/core/types'

/** The moment every shot is taken at, so "Reconnect by" dates read the same each time. */
export const DEMO_NOW = Date.parse('2026-10-29T09:00:00.000Z')

export interface FixtureSet {
  description: string
  /** Platforms this Flung can connect; the rest are listed as not connectable. */
  connectable: readonly Platform[]
  accounts: readonly Account[]
  /** Answer every call with this error instead, as an API that refuses the token. */
  refuse?: { status: number; code: string; message: string }
}

const account = (id: number, platform: Platform, username: string | null, extra: Partial<Account> = {}): Account => ({
  id: `acct_demo${String(id).padStart(4, '0')}`,
  platform,
  platformUserId: String(9_000_000 + id),
  username,
  profileId: null,
  status: 'active',
  reconnectBy: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  ...extra,
})

const everything = PLATFORMS.filter((platform) => platform !== 'farcaster')

export const FIXTURE_SETS: Readonly<Record<string, FixtureSet>> = {
  demo: {
    description: 'Every platform but Farcaster connectable; X, LinkedIn, Instagram, Bluesky and Mastodon connected, one needing a reconnect and one due soon',
    connectable: everything,
    accounts: [
      account(1, 'x', 'acmestudio'),
      account(2, 'linkedin', 'Acme Studio', { reconnectBy: '2026-11-08T00:00:00.000Z' }),
      account(3, 'instagram', 'acme.studio', { status: 'needs_reconnect' }),
      account(4, 'bluesky', 'acme.bsky.social'),
      account(5, 'mastodon', '@acme@mastodon.social'),
      account(6, 'x', 'acme_support'),
    ],
  },
  empty: { description: 'Every platform but Farcaster connectable, nothing connected yet', connectable: everything, accounts: [] },
  few: { description: 'Three platforms, as a page that passes platforms="x,linkedin,bluesky"; X connected, LinkedIn due for a reconnect', connectable: ['x', 'linkedin', 'bluesky'], accounts: [account(1, 'x', 'acmestudio'), account(2, 'linkedin', 'Acme Studio', { reconnectBy: '2026-11-08T00:00:00.000Z' })] },
  refused: { description: 'The API refuses the token', connectable: everything, accounts: [], refuse: { status: 403, code: 'forbidden', message: 'This connect token is not valid for this page.' } },
}
