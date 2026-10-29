import { ConnectClient, FlungConnectError } from '../core/client.js'
import type { TokenSource } from '../core/client.js'
import { connectInPopup, readRedirectResult, withoutRedirectResult } from '../core/flows.js'
import { HANDLE_PROMPT, parsePlatformList, PLATFORM_NAMES, tokenPlatforms } from '../core/platforms.js'
import type { Account, ConnectSession, Platform } from '../core/types.js'
import { DEFAULT_LABELS, format } from './copy.js'
import type { ConnectLabels } from './copy.js'
import { button, displayName, html } from './dom.js'
import type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from './events.js'
import { STYLES } from './styles.js'

/** What one platform's row is doing besides listing its accounts. */
type RowState =
  | { kind: 'idle' }
  | { kind: 'handle' }
  | { kind: 'waiting'; abort: AbortController; blockedUrl: string | null }
  | { kind: 'confirm'; account: Account }

/** How soon a reconnect deadline is worth showing. */
const SOON_MS = 14 * 86_400_000

/** `<flung-connect>` as a page sees it. */
export interface FlungConnectElement extends HTMLElement {
  /** A connect token, or a function that fetches a fresh one from your server. The `token` attribute sets a string. */
  token: TokenSource | null
  get labels(): ConnectLabels
  set labels(value: Partial<ConnectLabels> | undefined)
  /** Reads the accounts again, as after a connect. */
  refresh(): Promise<void>
}

/** Builds the class on first use, so importing the package on a server, where there is no `HTMLElement`, is safe. */
export function createFlungConnectClass(): new () => FlungConnectElement {
  return class FlungConnect extends HTMLElement implements FlungConnectElement {
    static readonly observedAttributes = ['token', 'base-url', 'platforms']

    readonly #root = this.attachShadow({ mode: 'open' })
    #source: TokenSource | null = null
    #client: ConnectClient | null = null
    #labels: ConnectLabels = DEFAULT_LABELS
    #platforms: Platform[] = []
    #accounts: Account[] = []
    #rows = new Map<Platform, RowState>()
    #message: { text: string; error: boolean } = { text: '', error: false }
    #focus: string | null = null
    #started = false

    get token(): TokenSource | null {
      return this.#source
    }
    set token(value: TokenSource | null) {
      this.#source = value
      this.#reset()
    }

    get labels(): ConnectLabels {
      return this.#labels
    }
    set labels(value: Partial<ConnectLabels> | undefined) {
      this.#labels = { ...DEFAULT_LABELS, ...value }
      this.#render()
    }

    refresh(): Promise<void> {
      return this.#load()
    }

    connectedCallback(): void {
      if (this.#started) return
      this.#started = true
      if (this.#source === null && this.hasAttribute('token')) this.#source = this.getAttribute('token')
      this.#reset()
    }

    attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
      if (previous === next || !this.#started) return
      if (name === 'token') this.#source = next
      if (name === 'platforms') void this.#load()
      else this.#reset()
    }

    #reset(): void {
      if (!this.#started) return
      for (const row of this.#rows.values()) if (row.kind === 'waiting') row.abort.abort()
      this.#rows.clear()
      this.#client = this.#source === null ? null : new ConnectClient({ token: this.#source, baseUrl: this.getAttribute('base-url') ?? undefined })
      void this.#load().then(() => this.#readReturn())
    }

    async #load(): Promise<void> {
      const client = this.#client
      if (client === null) return this.#say(this.#labels.noToken)
      if (this.#platforms.length === 0) this.#say(this.#labels.loading)
      try {
        const [platforms, accounts] = await Promise.all([client.platforms(), client.accounts()])
        const asked = parsePlatformList(this.getAttribute('platforms'))
        const granted = typeof this.#source === 'string' ? tokenPlatforms(this.#source) : null
        this.#platforms = platforms.map((info) => info.platform).filter((platform) => platforms.find((info) => info.platform === platform)?.connectable === true && (asked ?? [platform]).includes(platform) && (granted ?? [platform]).includes(platform))
        this.#accounts = accounts.filter((account) => account.status !== 'disconnected' && this.#platforms.includes(account.platform))
        if (this.#message.text === this.#labels.loading || this.#message.text === this.#labels.noToken) this.#message = { text: this.#platforms.length === 0 ? this.#labels.empty : '', error: false }
        this.#render()
        this.#emit<LoadDetail>('flung-load', { accounts: this.#accounts })
      } catch (error) {
        this.#fail(error, (message) => format(this.#labels.loadFailed, { message }))
      }
    }

    /** A connect that left the page (`mode="redirect"`) and came back: report it, and take Flung's result off the address. */
    #readReturn(): void {
      if (typeof location === 'undefined') return
      const result = readRedirectResult(location.href)
      if (result === null) return
      history.replaceState(history.state, '', withoutRedirectResult(location.href))
      if (result.status === 'connected') {
        const accounts = this.#accounts.filter((account) => result.accountIds.includes(account.id))
        const platform = accounts[0]?.platform
        this.#say(format(this.#labels.connected, { platform: platform === undefined ? 'The account' : PLATFORM_NAMES[platform] }))
        this.#emit<ConnectDetail>('flung-connect', { session: null, accounts })
      } else {
        this.#say(result.error?.message ?? '', true)
        this.#emit<ErrorDetail>('flung-error', { code: result.error?.code ?? 'platform_error', message: result.error?.message ?? '' })
      }
    }

    /** Called straight from a click or a submit: a window can only be opened during one. */
    #start(platform: Platform, account: Account | null, handle: string | undefined): void {
      const client = this.#client
      if (client === null) return
      const redirect = this.getAttribute('mode') === 'redirect'
      const redirectUrl = redirect ? withoutRedirectResult(location.href) : undefined
      const begin = () => (account === null ? client.connect(platform, { handle, redirectUrl }) : client.reconnect(account.id, { redirectUrl }))
      const abort = new AbortController()
      const row: RowState = { kind: 'waiting', abort, blockedUrl: null }
      this.#rows.set(platform, row)
      this.#say('')
      if (redirect) {
        void begin().then(
          (session) => session.authorizationUrl !== null && location.assign(session.authorizationUrl),
          (error: unknown) => this.#settle(platform, error),
        )
        return
      }
      void connectInPopup(client, begin, { signal: abort.signal })
        .then(async (outcome) => {
          if (outcome.kind === 'finished') return outcome.session
          row.blockedUrl = outcome.session.authorizationUrl
          this.#render()
          return client.waitForSession(outcome.session.id, { signal: abort.signal })
        })
        .then(
          (session) => this.#finish(platform, session),
          (error: unknown) => this.#settle(platform, error),
        )
    }

    async #finish(platform: Platform, session: ConnectSession): Promise<void> {
      this.#rows.set(platform, { kind: 'idle' })
      const name = PLATFORM_NAMES[platform]
      if (session.status === 'connected') {
        await this.#load()
        this.#say(format(this.#labels.connected, { platform: name }))
        this.#emit<ConnectDetail>('flung-connect', { session, accounts: this.#accounts.filter((account) => session.accountIds.includes(account.id)) })
      } else if (session.status === 'expired') {
        this.#say(format(this.#labels.expired, { platform: name }), true)
        this.#emit<ErrorDetail>('flung-error', { code: 'expired', message: this.#message.text })
      } else {
        const message = session.error?.message ?? ''
        this.#say(format(this.#labels.failed, { platform: name, message }), true)
        this.#emit<ErrorDetail>('flung-error', { code: session.error?.code ?? 'platform_error', message })
      }
    }

    /** A connect that stopped early: cancelled by the person, or refused by the API. */
    #settle(platform: Platform, error: unknown): void {
      this.#rows.set(platform, { kind: 'idle' })
      if (error instanceof DOMException && error.name === 'AbortError') return this.#render()
      this.#fail(error, (message) => format(this.#labels.failed, { platform: PLATFORM_NAMES[platform], message }))
    }

    async #disconnect(account: Account): Promise<void> {
      this.#rows.set(account.platform, { kind: 'idle' })
      try {
        const disconnected = await (this.#client as ConnectClient).disconnect(account.id)
        await this.#load()
        this.#say(format(this.#labels.disconnected, { account: displayName(account) }))
        this.#emit<DisconnectDetail>('flung-disconnect', { account: disconnected })
      } catch (error) {
        this.#fail(error, (message) => message)
      }
    }

    #fail(error: unknown, say: (message: string) => string): void {
      const detail = error instanceof FlungConnectError ? { code: error.code, message: error.message } : { code: 'unknown', message: String(error) }
      this.#say(say(detail.message), true)
      this.#emit<ErrorDetail>('flung-error', detail)
    }

    #say(text: string, error = false): void {
      this.#message = { text, error }
      this.#render()
    }

    #emit<T>(type: string, detail: T): void {
      this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
    }

    #render(): void {
      const active = this.#root.activeElement instanceof HTMLElement ? (this.#root.activeElement.dataset['key'] ?? null) : null
      const list = html('ul', { class: 'list', part: 'list' }, ...this.#platforms.map((platform) => this.#platformRow(platform)))
      const message = html('p', { class: this.#message.error ? 'message error' : 'message', part: 'message', role: 'status', 'aria-live': 'polite' }, this.#message.text)
      const panel = html('section', { class: 'panel', part: 'panel', 'aria-label': this.#labels.panel }, list, message)
      this.#root.replaceChildren(html('style', {}, STYLES), panel)
      const key = this.#focus ?? active
      this.#focus = null
      if (key !== null) this.#root.querySelector<HTMLElement>(`[data-key="${key}"]`)?.focus()
    }

    #platformRow(platform: Platform): HTMLLIElement {
      const name = PLATFORM_NAMES[platform]
      const state = this.#rows.get(platform) ?? { kind: 'idle' }
      const busy = state.kind === 'waiting'
      const accounts = this.#accounts.filter((account) => account.platform === platform)
      const connect = button(accounts.length === 0 ? this.#labels.connect : this.#labels.connectAnother, `connect-${platform}`, () => this.#askOrStart(platform), { primary: accounts.length === 0, disabled: busy, label: `${accounts.length === 0 ? this.#labels.connect : this.#labels.connectAnother} ${name}` })
      const row = html('div', { class: 'row' }, html('span', { class: 'badge', part: 'badge', 'aria-hidden': 'true' }, name.slice(0, 2)), html('span', { class: 'name', part: 'name' }, name), connect)
      const items = accounts.map((account) => this.#accountRow(account, busy))
      return html('li', { class: 'platform', part: 'platform', 'data-platform': platform }, row, items.length === 0 ? null : html('ul', { class: 'accounts' }, ...items), this.#rowExtra(platform, state))
    }

    #accountRow(account: Account, busy: boolean): HTMLLIElement {
      const due = account.reconnectBy === null ? null : new Date(account.reconnectBy)
      const status =
        account.status === 'needs_reconnect' ? this.#labels.needsReconnect : due !== null && due.getTime() - Date.now() < SOON_MS ? format(this.#labels.reconnectBy, { date: due.toLocaleDateString() }) : null
      return html(
        'li',
        { class: 'account', part: 'account', 'data-account': account.id },
        html('span', { class: 'who' }, displayName(account)),
        status === null ? null : html('span', { class: 'status', part: 'status' }, status),
        status === null ? null : button(this.#labels.reconnect, `reconnect-${account.id}`, () => this.#start(account.platform, account, undefined), { disabled: busy }),
        button(this.#labels.disconnect, `disconnect-${account.id}`, () => this.#confirm(account), { danger: true, disabled: busy, label: `${this.#labels.disconnect} ${displayName(account)}` }),
      )
    }

    #rowExtra(platform: Platform, state: RowState): HTMLElement | null {
      const name = PLATFORM_NAMES[platform]
      if (state.kind === 'handle') {
        const id = `handle-${platform}`
        const required = HANDLE_PROMPT[platform]?.required === true
        const input = html('input', { id, name: 'handle', 'data-key': id, autocomplete: 'username', spellcheck: 'false', required })
        const form = html('form', { class: 'form', part: 'form' }, html('label', { for: id }, platform === 'mastodon' ? this.#labels.handleMastodon : this.#labels.handleBluesky), input, html('button', { type: 'submit', class: 'primary', 'data-key': `continue-${platform}` }, this.#labels.continue), button(this.#labels.cancel, `cancel-${platform}`, () => this.#idle(platform)))
        form.addEventListener('submit', (event) => {
          event.preventDefault()
          const handle = input.value.trim()
          this.#start(platform, null, handle === '' ? undefined : handle)
        })
        return form
      }
      if (state.kind === 'waiting') {
        const link = state.blockedUrl === null ? null : html('a', { href: state.blockedUrl, target: '_blank', rel: 'noopener' }, format(this.#labels.openSignIn, { platform: name }))
        const text = state.blockedUrl === null ? format(this.#labels.waiting, { platform: name }) : `${format(this.#labels.blocked, { platform: name })} `
        return html('p', { class: 'note', part: 'note' }, text, link, ' ', button(this.#labels.cancel, `cancel-${platform}`, () => (state.abort.abort(), this.#idle(platform))))
      }
      if (state.kind === 'confirm') {
        return html(
          'div',
          { class: 'confirm', part: 'confirm' },
          html('p', {}, format(this.#labels.confirmDisconnect, { account: displayName(state.account) })),
          button(this.#labels.disconnect, `confirm-${platform}`, () => void this.#disconnect(state.account), { danger: true }),
          button(this.#labels.keep, `keep-${platform}`, () => this.#idle(platform)),
        )
      }
      return null
    }

    #askOrStart(platform: Platform): void {
      if (HANDLE_PROMPT[platform] === undefined) return this.#start(platform, null, undefined)
      this.#rows.set(platform, { kind: 'handle' })
      this.#focus = `handle-${platform}`
      this.#render()
    }

    #confirm(account: Account): void {
      this.#rows.set(account.platform, { kind: 'confirm', account })
      this.#focus = `keep-${account.platform}`
      this.#render()
    }

    #idle(platform: Platform): void {
      this.#rows.set(platform, { kind: 'idle' })
      this.#focus = `connect-${platform}`
      this.#render()
    }
  }
}
