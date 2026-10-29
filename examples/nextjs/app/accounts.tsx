'use client'

import { useCallback, useState } from 'react'

import { FlungConnect } from '@flung.dev/connect/react'

/** Asks this app's server for a connect token; the panel calls it again when a token expires. */
async function connectToken(): Promise<string> {
  const response = await fetch('/api/connect-token', { method: 'POST' })
  const body = (await response.json()) as { token?: string; error?: string }
  if (!response.ok || body.token === undefined) throw new Error(body.error ?? 'Could not make a connect token.')
  return body.token
}

export function Accounts({ baseUrl }: { baseUrl: string | undefined }) {
  const [events, setEvents] = useState<string[]>([])
  const log = useCallback((line: string) => setEvents((previous) => [line, ...previous].slice(0, 5)), [])
  return (
    <>
      <FlungConnect
        token={connectToken}
        baseUrl={baseUrl}
        onConnect={({ accounts }) => log(`Connected ${accounts.map((account) => account.username ?? account.id).join(', ')}`)}
        onDisconnect={({ account }) => log(`Disconnected ${account.username ?? account.id}`)}
        onError={({ code, message }) => log(`${code}: ${message}`)}
      />
      {events.length > 0 && (
        <ul className="events" aria-label="What happened">
          {events.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      )}
    </>
  )
}
