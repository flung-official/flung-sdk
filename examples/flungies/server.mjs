#!/usr/bin/env node
/**
 * Serves the Flungies example page and the built package, with nothing to install.
 *
 *   pnpm --filter @flung.dev/flungies build
 *   node examples/flungies/server.mjs
 *
 * Then open http://localhost:5175. PORT=... picks another port.
 */
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.PORT ?? 5175)
const ORIGIN = `http://localhost:${PORT}`
const here = import.meta.dirname
const dist = join(here, '..', '..', 'packages', 'flungies', 'dist')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }

createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', ORIGIN).pathname
  const file = path === '/' ? join(here, 'index.html') : path.startsWith('/flungies/') ? normalize(join(dist, path.slice('/flungies/'.length))) : null
  if (file === null || (file !== join(here, 'index.html') && !file.startsWith(dist))) {
    response.writeHead(404).end()
    return
  }
  try {
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file))
  } catch {
    response.writeHead(404).end()
  }
}).listen(PORT, () => process.stdout.write(`Open ${ORIGIN}\n`))
