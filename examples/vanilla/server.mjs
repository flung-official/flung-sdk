#!/usr/bin/env node
/**
 * The smallest server a connect panel needs, with nothing to install: it keeps the API key, makes a connect token for
 * the page when the page asks, and serves the page and the built package.
 *
 *   pnpm build
 *   FLUNG_API_KEY=flung_sk_... node examples/vanilla/server.mjs
 *
 * Then open http://localhost:5173. FLUNG_BASE_URL=https://api-preview.flung.dev tries it against preview.
 */
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.PORT ?? 5173)
const ORIGIN = `http://localhost:${PORT}`
const BASE_URL = process.env.FLUNG_BASE_URL ?? 'https://api.flung.dev'
const API_KEY = process.env.FLUNG_API_KEY
if (API_KEY === undefined) throw new Error('Set FLUNG_API_KEY to a full-access Flung API key.')

const here = import.meta.dirname
const dist = join(here, '..', '..', 'packages', 'connect', 'dist')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }

/** In your app, check who is signed in here first, and pass their profile as `profileId`. */
async function connectToken() {
  const response = await fetch(`${BASE_URL}/v1/connect-tokens`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ origins: [ORIGIN], expiresIn: 900 }),
  })
  return { status: response.status, body: await response.text() }
}

createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', ORIGIN).pathname
  if (request.method === 'POST' && path === '/connect-token') {
    const made = await connectToken()
    response.writeHead(made.status, { 'content-type': 'application/json' }).end(made.body)
    return
  }
  const file = path === '/' ? join(here, 'index.html') : path.startsWith('/connect/') ? normalize(join(dist, path.slice('/connect/'.length))) : null
  if (file === null || (file !== join(here, 'index.html') && !file.startsWith(dist))) {
    response.writeHead(404).end()
    return
  }
  try {
    const page = file.endsWith('index.html') ? (await readFile(file, 'utf8')).replace('__FLUNG_BASE_URL__', BASE_URL) : await readFile(file)
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(page)
  } catch {
    response.writeHead(404).end()
  }
}).listen(PORT, () => process.stdout.write(`Open ${ORIGIN}\n`))
