import { describe, expect, expectTypeOf, it } from 'vitest'

import { backoffMs, retryingFetch } from '../client'
import { Flung, FlungError } from '../index'
import type { AccountsConnectData, FlungErrorCode, Me, PlatformInfo, Post, PostsCreateData } from '../index'

/** Answers like the API's, from a list, recording every request the client sends. */
function scripted(...answers: (() => Response)[]) {
  const requests: Request[] = []
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    requests.push(request)
    const next = answers.shift()
    if (next === undefined) throw new Error(`unexpected ${request.method} ${request.url}`)
    return next()
  }
  return { fetch, requests }
}

describe('Flung', () => {
  it('sends the key, an Idempotency-Key on every POST, and reads the answer', async () => {
    const api = scripted(() => Response.json({ id: 'post_1', status: 'scheduled' }, { status: 201 }))
    const flung = new Flung({ apiKey: 'flung_sk_test', baseUrl: 'https://api.flung.example/', fetch: api.fetch, maxRetries: 0 })
    const post = await flung.posts.create({ content: 'Hello', accountIds: ['acct_1'] })
    expect(post).toMatchObject({ id: 'post_1' })
    const [request] = api.requests
    expect(request?.url).toBe('https://api.flung.example/v1/posts')
    expect(request?.headers.get('authorization')).toBe('Bearer flung_sk_test')
    expect(request?.headers.get('idempotency-key')).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('throws FlungError with the stable code and details', async () => {
    const api = scripted(() => Response.json({ error: { code: 'unknown_accounts', message: 'No such accounts.', details: { accountIds: ['acct_x'] } } }, { status: 422 }))
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    const error = await flung.posts.create({ content: 'Hello', accountIds: ['acct_x'] }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(FlungError)
    expect(error).toMatchObject({ status: 422, code: 'unknown_accounts', details: { accountIds: ['acct_x'] } })
  })

  it('schedules at a local time in a zone, and reads the time back in UTC and local', async () => {
    expectTypeOf<NonNullable<PostsCreateData['body']>['timeZone']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Post['publishAtLocal']>().toEqualTypeOf<string>()
    expectTypeOf<NonNullable<Post['warnings']>[number]['code']>().toEqualTypeOf<'local_time_skipped' | 'local_time_ambiguous'>()
    expectTypeOf<Me['timeZoneSource']>().toEqualTypeOf<'user' | 'workspace' | 'default'>()
    expectTypeOf<'invalid_time_zone'>().toExtend<FlungErrorCode>()
    const api = scripted(() => Response.json({ id: 'post_1', status: 'scheduled', publishAt: '2026-11-03T07:00:00.000Z', publishAtLocal: '2026-11-03T09:00:00+02:00', timeZone: 'Europe/Athens', targets: [] }, { status: 201 }))
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    const post = await flung.posts.create({ content: 'Kalimera.', accountIds: ['acct_1'], publishAt: '2026-11-03T09:00', timeZone: 'Europe/Athens' })
    expect(await api.requests[0]?.json()).toMatchObject({ publishAt: '2026-11-03T09:00', timeZone: 'Europe/Athens' })
    expect(post).toMatchObject({ publishAt: '2026-11-03T07:00:00.000Z', publishAtLocal: '2026-11-03T09:00:00+02:00', timeZone: 'Europe/Athens' })
  })

  it('makes a connect token for a page', async () => {
    const api = scripted(() => Response.json({ token: 'flung_ct_a.b', expiresAt: '2030-01-01T00:00:00.000Z', origins: ['https://app.example'], profileId: null, platforms: null }, { status: 201 }))
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    const made = await flung.connectTokens.create({ origins: ['https://app.example'] })
    expect(made.token).toBe('flung_ct_a.b')
    expect(await api.requests[0]?.json()).toEqual({ origins: ['https://app.example'] })
  })

  it('connects LinkedIn company pages with variant pages, and reads the variants each platform offers', async () => {
    expectTypeOf<NonNullable<AccountsConnectData['body']>['variant']>().toEqualTypeOf<'pages' | undefined>()
    expectTypeOf<PlatformInfo['variants']>().toEqualTypeOf<string[]>()
    const session = { id: 'cs_1', platform: 'linkedin', accountId: null, status: 'pending', authorizationUrl: 'https://www.linkedin.com/oauth', expiresAt: '2030-01-01T00:00:00.000Z', accountIds: [], error: null, createdAt: '2026-10-30T00:00:00.000Z', completedAt: null }
    const api = scripted(
      () => Response.json(session, { status: 201 }),
      () => Response.json({ data: [{ platform: 'linkedin', connectable: true, variants: ['pages'] }] }),
    )
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    await flung.accounts.connect({ platform: 'linkedin', variant: 'pages' })
    expect(api.requests[0]?.url).toBe('https://api.flung.dev/v1/connect/linkedin')
    expect(await api.requests[0]?.json()).toEqual({ variant: 'pages' })
    const { data } = await flung.platforms.list()
    expect(data[0]?.variants).toEqual(['pages'])
    // @ts-expect-error: the API knows no other variant.
    void (() => flung.accounts.connect({ platform: 'linkedin', variant: 'groups' }))
  })

  it('finds a customer\'s profile by external id and lists its accounts', async () => {
    const api = scripted(
      () => Response.json({ data: [{ id: 'prof_1', name: 'Acme', externalId: 'user_8412', createdAt: '2026-10-29T00:00:00.000Z', updatedAt: '2026-10-29T00:00:00.000Z' }], hasMore: false }),
      () => Response.json({ data: [] }),
    )
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    const { data } = await flung.profiles.list({ externalId: 'user_8412' })
    await flung.accounts.list({ profileId: data[0]?.id })
    expect(new URL(api.requests[0]?.url ?? '').searchParams.get('externalId')).toBe('user_8412')
    expect(new URL(api.requests[1]?.url ?? '').searchParams.get('profileId')).toBe('prof_1')
  })

  it('walks every page with paginate', async () => {
    const api = scripted(
      () => Response.json({ data: [{ id: 'post_2' }, { id: 'post_1' }], hasMore: true }),
      () => Response.json({ data: [{ id: 'post_0' }], hasMore: false }),
    )
    const flung = new Flung({ apiKey: 'flung_sk_test', fetch: api.fetch, maxRetries: 0 })
    const ids: string[] = []
    for await (const post of flung.paginate((page) => flung.posts.list(page), { limit: 2 })) ids.push(post.id)
    expect(ids).toEqual(['post_2', 'post_1', 'post_0'])
    expect(new URL(api.requests[1]?.url ?? '').searchParams.get('startingAfter')).toBe('post_1')
  })

  it('refuses to start without a key or with a base address that is not http', () => {
    expect(() => new Flung({ apiKey: '' })).toThrow(TypeError)
    expect(() => new Flung({ apiKey: 'flung_sk_test', baseUrl: 'api.flung.dev' })).toThrow(TypeError)
  })
})

describe('retryingFetch', () => {
  it('retries 429 and 5xx, then returns the last answer', async () => {
    const statuses = [429, 502, 503]
    let calls = 0
    const inner: typeof fetch = async () => new Response(null, { status: statuses[calls++] ?? 200, headers: { 'retry-after': '0' } })
    const response = await retryingFetch(inner, 2, 1000)('https://api.flung.example/v1/posts')
    expect(calls).toBe(3)
    expect(response.status).toBe(503)
  })

  it('does not retry an answer that will not change, such as 422', async () => {
    let calls = 0
    const inner: typeof fetch = async () => {
      calls += 1
      return new Response(null, { status: 422 })
    }
    expect((await retryingFetch(inner, 3, 1000)('https://api.flung.example/v1/posts')).status).toBe(422)
    expect(calls).toBe(1)
  })

  it('retries a network failure and resends the same body', async () => {
    const bodies: string[] = []
    const inner: typeof fetch = async (input) => {
      bodies.push(await (input as Request).text())
      if (bodies.length === 1) throw new TypeError('fetch failed')
      return new Response('{}', { status: 201 })
    }
    const response = await retryingFetch(inner, 1, 1000)('https://api.flung.example/v1/posts', { method: 'POST', body: '{"content":"Hi"}' })
    expect(response.status).toBe(201)
    expect(bodies).toEqual(['{"content":"Hi"}', '{"content":"Hi"}'])
  })

  it('reports a network failure as FlungError network_error once retries run out', async () => {
    const down = new Flung({ apiKey: 'unused', baseUrl: 'https://api.flung.example', maxRetries: 0, fetch: async () => Promise.reject(new TypeError('fetch failed')) })
    await expect(down.accounts.list()).rejects.toMatchObject({ name: 'FlungError', status: null, code: 'network_error' })
  })
})

describe('backoffMs', () => {
  it('honours Retry-After, capped', () => {
    expect(backoffMs(0, '2')).toBe(2000)
    expect(backoffMs(0, '3600')).toBe(8000)
  })

  it('grows exponentially with jitter when the server gives no Retry-After', () => {
    expect(backoffMs(0, null, () => 1)).toBe(500)
    expect(backoffMs(3, null, () => 1)).toBe(4000)
    expect(backoffMs(10, null, () => 1)).toBe(8000)
    expect(backoffMs(3, null, () => 0)).toBe(0)
  })
})
