/**
 * The few shapes of the Flung API a connect panel reads, written out here so the package needs nothing else. They are
 * the API's own (`spec/openapi.json`): `PlatformInfo`, `Account` and `ConnectSession`, trimmed to what is used.
 */

export const PLATFORMS = ['x', 'instagram', 'facebook', 'threads', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'discord', 'farcaster'] as const
export type Platform = (typeof PLATFORMS)[number]

export interface PlatformInfo {
  platform: Platform
  /** Whether this Flung has the platform's app credentials, so accounts can be connected. */
  connectable: boolean
}

export type AccountStatus = 'active' | 'needs_reconnect' | 'disconnected'

/** A connected social account, as `GET /v1/accounts` returns it. */
export interface Account {
  /** Flung's id for the account. */
  id: string
  /** The platform it is on. */
  platform: Platform
  /** The platform's own id for the user. */
  platformUserId: string
  /** The handle on the platform, without the `@`, when it has one. */
  username: string | null
  /** The name the person shows on the platform. Optional: an API older than the field leaves it out. */
  displayName?: string | null
  /** The person's profile picture on the platform, an `https` address. Optional: an API older than the field leaves it out. */
  avatarUrl?: string | null
  /** The Flung profile it belongs to, or null for the whole workspace. */
  profileId: string | null
  /** `active`, `needs_reconnect` or `disconnected`. */
  status: AccountStatus
  /** When the person must reconnect by, for platforms whose connections cannot be renewed forever. */
  reconnectBy: string | null
  /** When it was first connected. */
  createdAt: string
}

export type ConnectSessionStatus = 'pending' | 'connected' | 'failed' | 'expired'

export interface ConnectSession {
  id: string
  platform: Platform
  /** The account being reconnected; null for a new connection. */
  accountId: string | null
  status: ConnectSessionStatus
  /** The platform's consent page, while the session is pending. */
  authorizationUrl: string | null
  expiresAt: string
  /** The accounts stored, once connected. Facebook connects one per page. */
  accountIds: string[]
  error: { code: string; message: string } | null
}
