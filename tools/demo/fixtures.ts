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
  /** The connect variants set up, such as LinkedIn's `pages`; none when left out. */
  variants?: Partial<Record<Platform, readonly string[]>>
  accounts: readonly Account[]
  /** Answer every call with this error instead, as an API that refuses the token. */
  refuse?: { status: number; code: string; message: string }
  /**
   * Let a connect finish, as if the person signed in: the session turns `connected` on the `afterPolls`th read of
   * `GET /v1/connect-sessions/:id` and the account is added. Its name is `usernames[platform]` with `{handle}` filled from
   * what the person typed (a Mastodon server, a Bluesky handle), or `acme`. A LinkedIn connect with `variant: 'pages'` adds
   * one page account for each of `pages` instead. Without it, every connect stays pending.
   */
  finishConnect?: { afterPolls: number; usernames?: Partial<Record<Platform, string>>; pages?: readonly string[] }
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
  connects: {
    description: 'Like few with Mastodon too, and a connect finishes a few seconds after its window opens, adding the account',
    connectable: ['x', 'linkedin', 'bluesky', 'mastodon'],
    accounts: [account(1, 'x', 'acmestudio'), account(2, 'linkedin', 'Acme Studio', { reconnectBy: '2026-11-08T00:00:00.000Z' })],
    finishConnect: { afterPolls: 2, usernames: { mastodon: '@acme@{handle}', bluesky: '{handle}', x: 'acme_news', linkedin: 'Acme Studio Team' } },
  },
  pages: {
    description: 'Like few, with LinkedIn company pages set up: a personal profile and a page connected, and a pages connect adds two pages',
    connectable: ['x', 'linkedin', 'bluesky'],
    variants: { linkedin: ['pages'] },
    accounts: [
      account(1, 'x', 'acmestudio'),
      account(2, 'linkedin', 'Ada Lovelace', { displayName: 'Ada Lovelace' }),
      account(7, 'linkedin', 'Acme Studio', { platformUserId: 'urn:li:organization:1001', displayName: 'Acme Studio' }),
    ],
    finishConnect: { afterPolls: 2, usernames: { x: 'acme_news', linkedin: 'Ada Lovelace', bluesky: '{handle}' }, pages: ['Acme Labs', 'Acme Careers'] },
  },
  refused: { description: 'The API refuses the token', connectable: everything, accounts: [], refuse: { status: 403, code: 'forbidden', message: 'This connect token is not valid for this page.' } },
}
