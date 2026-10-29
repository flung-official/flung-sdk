/**
 * The Standard Webhooks signer, as Flung's jobs Worker signs (flung-app `packages/crypto/src/webhook-signature.ts`). Kept
 * equal to it so these tests check the SDK against what Flung really sends.
 */
const SECRET_PREFIX = 'whsec_'

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (character) => character.charCodeAt(0))

export function newWebhookSecret(): string {
  return SECRET_PREFIX + toBase64(crypto.getRandomValues(new Uint8Array(32)))
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', fromBase64(secret.slice(SECRET_PREFIX.length)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))))
}

export async function signWebhook(secrets: string | readonly string[], id: string, timestampSeconds: number, body: string) {
  const signatures: string[] = []
  for (const secret of typeof secrets === 'string' ? [secrets] : secrets) signatures.push(`v1,${await hmac(secret, `${id}.${timestampSeconds}.${body}`)}`)
  return { 'webhook-id': id, 'webhook-timestamp': String(timestampSeconds), 'webhook-signature': signatures.join(' ') }
}
