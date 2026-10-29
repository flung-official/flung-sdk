/**
 * `pnpm demo [--set <name>] [--port <n>]`: the connect panel, built from `packages/connect`, on a page served at
 * http://localhost:3190 with the API answered from a fixture set. No request leaves the machine. Ctrl-C stops it.
 */
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { parseArgs } from 'node:util'

import { FIXTURE_SETS } from './fixtures'
import { createDemoHandler, ROOT } from './handler'

const { values } = parseArgs({ options: { set: { type: 'string', default: 'demo' }, port: { type: 'string', default: '3190' } } })
const set = FIXTURE_SETS[values.set]
if (set === undefined) {
  process.stderr.write(`No fixture set named ${values.set}. Sets: ${Object.keys(FIXTURE_SETS).join(', ')}.\n`)
  process.exit(1)
}

execFileSync('pnpm', ['--filter', '@flung.dev/connect', 'build'], { cwd: ROOT, stdio: 'inherit' })
const handler = createDemoHandler(set)
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  if (url.pathname === '/__demo/reset') {
    handler.reset()
    return void response.writeHead(204).end()
  }
  /* The body says which Mastodon server or Bluesky handle a connect was started with. */
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  const answer = handler.handle(request.method ?? 'GET', url, Buffer.concat(chunks).toString('utf8')) ?? { status: 404, headers: {}, body: '' }
  response.writeHead(answer.status, answer.headers).end(answer.body)
})
server.listen(Number(values.port), '127.0.0.1', () => {
  process.stdout.write(`\nDemo ready, set ${values.set}: ${set.description}\n  http://localhost:${values.port}/\nAccounts start again with: curl http://localhost:${values.port}/__demo/reset\nCtrl-C stops it (PID ${process.pid}).\n`)
})
