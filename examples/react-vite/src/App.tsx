import { useCallback, useState } from 'react'

import { FlungConnect } from '@flung.dev/connect/react'

/** Asks the dev server for a connect token; the panel calls it again when a token expires. */
async function connectToken(): Promise<string> {
  const response = await fetch('/connect-token', { method: 'POST' })
  const body = (await response.json()) as { token?: string; error?: string }
  if (!response.ok || body.token === undefined) throw new Error(body.error ?? 'Could not make a connect token.')
  return body.token
}

const baseUrl = import.meta.env.FLUNG_BASE_URL || undefined

export function App() {
  const [events, setEvents] = useState<string[]>([])
  const log = useCallback((line: string) => setEvents((previous) => [line, ...previous].slice(0, 5)), [])
  return (
    <main>
      <h1>Connect your accounts</h1>
      <p>We post to the accounts you connect here. You can disconnect them at any time.</p>
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
    </main>
  )
}
