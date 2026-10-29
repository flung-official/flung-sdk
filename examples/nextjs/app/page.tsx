import { Accounts } from './accounts'

export default function Page() {
  return (
    <main>
      <h1>Connect your accounts</h1>
      <p>We post to the accounts you connect here. You can disconnect them at any time.</p>
      <Accounts baseUrl={process.env.FLUNG_BASE_URL || undefined} />
    </main>
  )
}
