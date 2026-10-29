import { Flung, FlungError } from '@flung.dev/sdk'

/**
 * `POST /api/connect-token`: a short-lived connect token for this app's own page. The API key stays here on the server;
 * the token it makes can only list, connect, reconnect and disconnect accounts, from `APP_ORIGIN`, for fifteen minutes.
 *
 * In a real app, check who is signed in first, and pass their profile as `profileId` so each person sees only theirs.
 */
export async function POST(): Promise<Response> {
  const apiKey = process.env.FLUNG_API_KEY
  if (apiKey === undefined || apiKey === '') return Response.json({ error: 'Set FLUNG_API_KEY in .env.local.' }, { status: 500 })
  const flung = new Flung({ apiKey, ...(process.env.FLUNG_BASE_URL ? { baseUrl: process.env.FLUNG_BASE_URL } : {}) })
  try {
    const { token, expiresAt } = await flung.connectTokens.create({ origins: [process.env.APP_ORIGIN || 'http://localhost:3000'], expiresIn: 900 })
    return Response.json({ token, expiresAt }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const status = error instanceof FlungError ? (error.status ?? 502) : 502
    return Response.json({ error: error instanceof Error ? error.message : 'Could not make a connect token.' }, { status })
  }
}
