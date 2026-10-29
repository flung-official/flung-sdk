#!/usr/bin/env node
/**
 * Writes `packages/connect/src/element/marks.ts`: each platform's mark and colour, and Flung's own mark, as SVG path data,
 * so the panel draws real logos with no runtime dependency and nothing is drawn by hand.
 *
 * - Platforms come from Simple Icons (CC0 1.0). LinkedIn is not in Simple Icons (removed at LinkedIn's request), so its
 *   mark comes from Boxicons (`bxl-linkedin`, MIT) and its colour from LinkedIn's brand guidelines.
 * - Flung's mark is the one assets.flung.dev serves, so a new logo there is one `pnpm sync:icons` away.
 *
 *   pnpm sync:icons          write the file
 *   pnpm sync:icons --check  fail when the file is not what the sources make
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import * as simpleIcons from 'simple-icons'

const require = createRequire(import.meta.url)
const target = join(import.meta.dirname, '..', 'packages', 'connect', 'src', 'element', 'marks.ts')
const FLUNG_MARK = 'https://assets.flung.dev/brand/logo/flung-mark-on-light.svg'

/** The platforms in the order of `PLATFORMS` (`core/types.ts`), with the Simple Icons export of each. */
const FROM_SIMPLE_ICONS = {
  x: 'siX',
  instagram: 'siInstagram',
  facebook: 'siFacebook',
  threads: 'siThreads',
  tiktok: 'siTiktok',
  youtube: 'siYoutube',
  pinterest: 'siPinterest',
  bluesky: 'siBluesky',
  mastodon: 'siMastodon',
  discord: 'siDiscord',
  farcaster: 'siFarcaster',
}
const ORDER = ['x', 'instagram', 'facebook', 'threads', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'discord', 'farcaster']

/** Boxicons' LinkedIn, its circle turned into a path so every mark is one `d`. */
function linkedin() {
  const svg = readFileSync(require.resolve('boxicons/svg/logos/bxl-linkedin.svg'), 'utf8')
  const circle = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\/>/.exec(svg)
  const path = /<path d="([^"]+)"\/>/.exec(svg)
  if (circle === null || path === null) throw new Error('boxicons bxl-linkedin.svg is not the shape this script reads.')
  const [, cx, cy, r] = circle.map(Number)
  const dot = `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`
  return { path: `${dot}${path[1]}`, hex: '0A66C2', source: 'Boxicons bxl-linkedin (MIT)' }
}

async function flungMark() {
  const response = await fetch(FLUNG_MARK)
  if (!response.ok) throw new Error(`${FLUNG_MARK} answered ${response.status}.`)
  const svg = await response.text()
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1])
  if (viewBox === undefined || paths.length === 0) throw new Error(`${FLUNG_MARK} has no viewBox or paths.`)
  return { viewBox, path: paths.join(' ') }
}

const marks = Object.fromEntries(
  ORDER.map((platform) => {
    if (platform === 'linkedin') return [platform, linkedin()]
    const icon = simpleIcons[FROM_SIMPLE_ICONS[platform]]
    if (icon === undefined) throw new Error(`Simple Icons has no ${FROM_SIMPLE_ICONS[platform]}.`)
    return [platform, { path: icon.path, hex: icon.hex, source: `Simple Icons ${icon.slug} (CC0 1.0)` }]
  }),
)
const flung = await flungMark()

const text = `// Written by \`pnpm sync:icons\` (scripts/sync-icons.mjs). Change the script or its sources, never this file.
import type { Platform } from '../core/types.js'

/** A platform's mark on a 24 by 24 grid, and its brand colour as six hex digits. */
export interface PlatformMark {
  readonly path: string
  readonly hex: string
}

export const PLATFORM_MARKS: Readonly<Record<Platform, PlatformMark>> = {
${ORDER.map((platform) => `  // ${marks[platform].source}\n  ${platform}: { hex: '${marks[platform].hex}', path: '${marks[platform].path}' },`).join('\n')}
}

/** Flung's mark, from ${FLUNG_MARK}. */
export const FLUNG_MARK = { viewBox: '${flung.viewBox}', path: '${flung.path}' } as const
`

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf8')
  } catch {
    /* missing: reported below */
  }
  if (current !== text) {
    process.stderr.write('packages/connect/src/element/marks.ts is stale. Run pnpm sync:icons.\n')
    process.exit(1)
  }
  process.stdout.write('marks.ts is up to date.\n')
} else {
  writeFileSync(target, text)
  process.stdout.write(`Wrote marks.ts: ${ORDER.length} platforms and the Flung mark.\n`)
}
