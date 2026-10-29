import { describe, expect, it } from 'vitest'

import { newWebhookSecret, signWebhook } from './helpers/sign-webhook'

import { FlungWebhookError, verifyWebhook } from '../index'

const NOW = 1_800_000_000
const BODY = JSON.stringify({ id: 'evt_1', type: 'post.published', createdAt: '2027-01-15T08:00:00.000Z', data: { post: { id: 'post_1' } } })

/** Signed as the jobs Worker signs (helpers/sign-webhook.ts). */
describe('verifyWebhook', () => {
  it('accepts an event Flung signed and returns it parsed', async () => {
    const secret = newWebhookSecret()
    const headers = { ...(await signWebhook(secret, 'evt_1', NOW, BODY)) }
    const event = await verifyWebhook({ body: BODY, headers, secret, nowSeconds: NOW })
    expect(event).toMatchObject({ id: 'evt_1', type: 'post.published' })
  })

  it('reads Fetch Headers and Node-style headers with any casing', async () => {
    const secret = newWebhookSecret()
    const signed = await signWebhook(secret, 'evt_1', NOW, BODY)
    await expect(verifyWebhook({ body: BODY, headers: new Headers({ ...signed }), secret, nowSeconds: NOW })).resolves.toBeDefined()
    const node = { 'Webhook-Id': signed['webhook-id'], 'Webhook-Timestamp': signed['webhook-timestamp'], 'Webhook-Signature': [signed['webhook-signature']] }
    await expect(verifyWebhook({ body: BODY, headers: node, secret, nowSeconds: NOW })).resolves.toBeDefined()
  })

  it('accepts either secret during a rotation, from either side', async () => {
    const [previous, next] = [newWebhookSecret(), newWebhookSecret()]
    // Flung signs with both while the old secret is still live; the receiver may hold either.
    const headers = { ...(await signWebhook([next, previous], 'evt_1', NOW, BODY)) }
    await expect(verifyWebhook({ body: BODY, headers, secret: previous, nowSeconds: NOW })).resolves.toBeDefined()
    await expect(verifyWebhook({ body: BODY, headers, secret: next, nowSeconds: NOW })).resolves.toBeDefined()
    // The receiver holds both while it switches; Flung already signs with the new one only.
    const after = { ...(await signWebhook(next, 'evt_1', NOW, BODY)) }
    await expect(verifyWebhook({ body: BODY, headers: after, secret: [previous, next], nowSeconds: NOW })).resolves.toBeDefined()
  })

  it('refuses a changed body, another secret, a stale timestamp and missing headers', async () => {
    const secret = newWebhookSecret()
    const headers = { ...(await signWebhook(secret, 'evt_1', NOW, BODY)) }
    await expect(verifyWebhook({ body: `${BODY} `, headers, secret, nowSeconds: NOW })).rejects.toBeInstanceOf(FlungWebhookError)
    await expect(verifyWebhook({ body: BODY, headers, secret: newWebhookSecret(), nowSeconds: NOW })).rejects.toThrow('No webhook signature')
    await expect(verifyWebhook({ body: BODY, headers, secret, nowSeconds: NOW + 301 })).rejects.toThrow('replay')
    await expect(verifyWebhook({ body: BODY, headers: {}, secret, nowSeconds: NOW })).rejects.toThrow('headers are required')
  })
})
