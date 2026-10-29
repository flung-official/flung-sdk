import { PLATFORMS } from './types.js'
import type { Platform } from './types.js'

export const PLATFORM_NAMES: Readonly<Record<Platform, string>> = {
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  discord: 'Discord',
  farcaster: 'Farcaster',
}

/** What a connect asks the person for first: Mastodon needs their instance; Bluesky takes a handle when they have one. */
export const HANDLE_PROMPT: Readonly<Partial<Record<Platform, { required: boolean }>>> = {
  mastodon: { required: true },
  bluesky: { required: false },
}

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value)
}

/** `x, linkedin` as platforms, dropping anything that is not one. Null for an empty or missing list. */
export function parsePlatformList(value: string | null | undefined): Platform[] | null {
  if (value === null || value === undefined) return null
  const platforms = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(isPlatform)
  return platforms.length === 0 ? null : [...new Set(platforms)]
}

/**
 * The platforms a connect token was made for, read from its payload so the panel offers only those. Only a hint: the
 * API checks the signature and refuses the rest. Null when the token names none or cannot be read.
 */
export function tokenPlatforms(token: string): Platform[] | null {
  const body = /^flung_ct_([\w-]+)\./.exec(token)?.[1]
  if (body === undefined) return null
  try {
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))) as { pl?: unknown }
    return Array.isArray(payload.pl) ? payload.pl.filter((value): value is Platform => typeof value === 'string' && isPlatform(value)) : null
  } catch {
    return null
  }
}
