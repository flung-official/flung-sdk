/**
 * `pnpm demo:shot [--set <name>] [--themes light,dark] [--viewports desktop,phone] [--click <selector>]... [--name <word>]
 * [--full] [--element] [--probe] [--states]`: screenshots of the demo page in headless Chromium, every request answered by the demo
 * handler through Playwright, so it takes no port. Written to `tools/demo/artifacts/shots/` (ignored), one line a file,
 * with any page error and, with `--probe`, what overflows. `--element` shoots the panel alone, on a clear background, for the docs.
 *
 * `--states` shoots every state worth looking at in one go: the full list, the handle form, a disconnect being confirmed,
 * a connect waiting on its window, nothing connected, and a refused token, each of the whole page.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium, type Page } from 'playwright-core'

import { DEMO_NOW, FIXTURE_SETS } from './fixtures'
import { createDemoHandler, ROOT } from './handler'
import { PROBE, probeLines, type ProbeReport } from './probe'

const VIEWPORTS = { desktop: { width: 1280, height: 860, scale: 1 }, phone: { width: 390, height: 844, scale: 2 } } as const
type Viewport = keyof typeof VIEWPORTS
type Shot = { name: string; set: string; clicks: string[]; query?: string }

/** Every state of the panel: clicks are Playwright selectors, which reach into the panel's open shadow root. */
const STATES: readonly Shot[] = [
  { name: 'accounts', set: 'demo', clicks: [] },
  { name: 'handle', set: 'demo', clicks: ['[data-key="connect-mastodon"]'] },
  { name: 'confirm', set: 'demo', clicks: ['[data-key="disconnect-acct_demo0001"]'] },
  { name: 'waiting', set: 'demo', clicks: ['[data-key="connect-tiktok"]'] },
  { name: 'empty', set: 'empty', clicks: [] },
  { name: 'few', set: 'few', clicks: [] },
  { name: 'refused', set: 'refused', clicks: [] },
  { name: 'pages', set: 'pages', clicks: [] },
  { name: 'choose', set: 'pages', clicks: ['[data-key="connect-linkedin"]'] },
  { name: 'tiles', set: 'pages', clicks: [], query: '?variants=tiles' },
  { name: 'approve', set: 'farcaster', clicks: ['[data-key="connect-farcaster"]'] },
]

const { values } = parseArgs({
  options: {
    set: { type: 'string', default: 'demo' },
    themes: { type: 'string', default: 'light,dark' },
    viewports: { type: 'string', default: 'desktop,phone' },
    click: { type: 'string', multiple: true, default: [] },
    name: { type: 'string' },
    query: { type: 'string' },
    out: { type: 'string' },
    full: { type: 'boolean', default: false },
    probe: { type: 'boolean', default: false },
    states: { type: 'boolean', default: false },
    element: { type: 'boolean', default: false },
  },
})
const themes = values.themes.split(',') as ('light' | 'dark')[]
const viewports = values.viewports.split(',').filter((name): name is Viewport => name in VIEWPORTS)
const shots: readonly Shot[] = values.states ? STATES : [{ name: values.name ?? values.set, set: values.set, clicks: values.click, ...(values.query === undefined ? {} : { query: values.query }) }]
for (const shot of shots) if (FIXTURE_SETS[shot.set] === undefined) throw new Error(`No fixture set named ${shot.set}`)
const out = path.resolve(values.out ?? path.join(ROOT, 'tools/demo/artifacts/shots'))
mkdirSync(out, { recursive: true })

/** A Chromium Playwright has already downloaded, newest first. */
function findChromium(): string {
  const cache = path.join(homedir(), '.cache/ms-playwright')
  const dirs = readdirSync(cache).filter((dir) => dir.startsWith('chromium-')).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
  for (const dir of dirs) for (const file of ['chrome-linux64/chrome', 'chrome-linux/chrome']) if (existsSync(path.join(cache, dir, file))) return path.join(cache, dir, file)
  throw new Error(`No Chromium under ${cache}; run: npx playwright install chromium`)
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.evaluate('document.fonts.ready')
  await page.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))')
}

const began = Date.now()
execFileSync('pnpm', ['--filter', '@flung.dev/connect', 'build'], { cwd: ROOT, stdio: 'ignore' })
const browser = await chromium.launch({ executablePath: findChromium() })
let written = 0
let problems = 0
try {
  for (const viewportName of viewports) {
    const viewport = VIEWPORTS[viewportName]
    for (const theme of themes) {
      for (const shot of shots) {
        const handler = createDemoHandler(FIXTURE_SETS[shot.set] as (typeof FIXTURE_SETS)[string])
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: values.element ? 2 : viewport.scale, colorScheme: theme, reducedMotion: 'reduce', locale: 'en-GB', timezoneId: 'UTC' })
        await context.clock.setFixedTime(DEMO_NOW)
        const refused = new Set<string>()
        await context.route('**/*', async (route) => {
          const url = new URL(route.request().url())
          const answer = url.origin === 'http://demo.localhost' ? handler.handle(route.request().method(), url, route.request().postData() ?? undefined) : null
          if (answer === null) {
            refused.add(url.origin)
            return route.abort('blockedbyclient')
          }
          return route.fulfill(answer)
        })
        const page = await context.newPage()
        const notes: string[] = []
        page.on('pageerror', (error) => notes.push(`page error: ${error.message}`))
        page.on('popup', (popup) => void popup.close())
        await page.goto(`http://demo.localhost/${shot.query ?? ''}`, { waitUntil: 'load' })
        await page.locator('flung-connect .panel').waitFor()
        await settle(page)
        for (const click of shot.clicks) {
          try {
            await page.locator(click).first().click({ timeout: 5_000 })
          } catch (error) {
            notes.push(`could not click ${click}: ${(error instanceof Error ? error.message : String(error)).split('\n')[0]}`)
            break
          }
          await settle(page)
        }
        const file = path.join(out, `${shot.name}.${viewportName}.${theme}.png`)
        if (values.element) await page.locator('flung-connect').screenshot({ path: file, animations: 'disabled', caret: 'hide', omitBackground: true })
        else await page.screenshot({ path: file, fullPage: values.full || values.states, animations: 'disabled', caret: 'hide' })
        written += 1
        if (values.probe) notes.push(...probeLines((await page.evaluate(PROBE)) as ProbeReport))
        if (refused.size > 0) notes.push(`refused, as off the machine: ${[...refused].join(', ')}`)
        problems += notes.length
        process.stdout.write(`${path.relative(process.cwd(), file)}\n${notes.map((note) => `  ${note}\n`).join('')}`)
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
process.stdout.write(`${written} shots in ${((Date.now() - began) / 1000).toFixed(1)} s${problems > 0 ? `, ${problems} notes above` : ''}\n`)
