import { Flung } from '@flung.dev/sdk'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'

/**
 * `POST /connect-token` on the dev and preview servers: makes a connect token for the page with the key from
 * `.env.local`. The key has no `VITE_` prefix, so Vite never puts it in the bundle. This is for trying the panel out; a
 * deployed app makes tokens on its own server, behind its own sign-in.
 */
function connectTokens(apiKey: string, baseUrl: string | undefined): Plugin {
  const handler: Connect.NextHandleFunction = (request, response, next) => {
    if (request.method !== 'POST' || request.url !== '/connect-token') return next()
    const send = (status: number, body: unknown) => {
      response.statusCode = status
      response.setHeader('content-type', 'application/json')
      response.setHeader('cache-control', 'no-store')
      response.end(JSON.stringify(body))
    }
    if (apiKey === '') return send(500, { error: 'Set FLUNG_API_KEY in .env.local.' })
    const origin = request.headers.origin ?? `http://${request.headers.host ?? 'localhost:5173'}`
    const flung = new Flung({ apiKey, ...(baseUrl ? { baseUrl } : {}) })
    flung.connectTokens.create({ origins: [origin], expiresIn: 900 }).then(
      ({ token }) => send(200, { token }),
      (error: unknown) => send(502, { error: error instanceof Error ? error.message : 'Could not make a connect token.' }),
    )
  }
  return { name: 'flung-connect-tokens', configureServer: (server) => void server.middlewares.use(handler), configurePreviewServer: (server) => void server.middlewares.use(handler) }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [connectTokens(env.FLUNG_API_KEY ?? '', env.FLUNG_BASE_URL || undefined)],
    define: { 'import.meta.env.FLUNG_BASE_URL': JSON.stringify(env.FLUNG_BASE_URL || '') },
    esbuild: { jsx: 'automatic' },
  }
})
