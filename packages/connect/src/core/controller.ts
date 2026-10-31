import { ConnectClient, FlungConnectError } from './client.js'
import type { TokenSource } from './client.js'
import type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from './events.js'
import { connectInPopup, readRedirectResult, withoutRedirectResult } from './flows.js'
import { DEFAULT_LABELS, formatLabel } from './labels.js'
import type { ConnectLabels } from './labels.js'
import { HANDLE_PROMPT, isConnectVariant, isPageAccount, PLATFORM_NAMES, tokenPlatforms } from './platforms.js'
import type { Account, ConnectFlow, ConnectSession, ConnectVariant, Platform } from './types.js'

/** How soon a reconnect deadline is worth showing. */
const SOON_MS = 14 * 86_400_000
/** How an approval connect reads its session: after two seconds, then half as long again each time, up to every ten. */
const APPROVAL_POLL = { intervalMs: 2_000, maxIntervalMs: 10_000 } as const

/** What one connected account looks like to a panel: the API's account and what to show for it. */
export interface AccountItem {
  /** The account as the API returned it. */
  readonly account: Account
  /** How messages name it: its username, or its platform id when it has none. */
  readonly name: string
  /** The name to show first: the display name, else the username, else the platform id. */
  readonly displayName: string
  /** The handle to show under the display name, without the `@`; null when it would repeat the display name. */
  readonly username: string | null
  /** The profile picture, only when the API gave an `https` address; otherwise null, so a panel shows `initial`. */
  readonly avatarUrl: string | null
  /** One letter for a picture that is missing or does not load. */
  readonly initial: string
  /** True for a company page (a LinkedIn page connected with the `pages` variant), false for a person's own account. */
  readonly page: boolean
  /** Why a reconnect is offered, or null when none is. `deadline` gives the ISO time it must happen by, within two weeks. */
  readonly reconnect: { readonly reason: 'needs_reconnect' } | { readonly reason: 'deadline'; readonly by: string } | null
}

/** What a platform is doing besides listing its accounts. */
export type PlatformStep =
  /** Nothing: its Connect button is ready. */
  | { readonly kind: 'idle' }
  /** Asking for the Mastodon server (required) or Bluesky handle (optional) before a connect: call `submitHandle`. */
  | { readonly kind: 'handle'; readonly required: boolean }
  /**
   * Asking what to connect, when the platform offers its own connect and a variant (LinkedIn: a personal profile or a
   * company page): call `connect(platform, { variant })` with the answer, `null` for the profile, or `cancel`.
   */
  | { readonly kind: 'choose'; readonly variants: readonly ConnectVariant[] }
  /**
   * Waiting on the person to finish signing in. `blockedUrl` is set when the browser refused to open the window: offer it
   * as a link. `variant` is the variant being connected, or null.
   */
  | { readonly kind: 'waiting'; readonly blockedUrl: string | null; readonly accountId: string | null; readonly variant: ConnectVariant | null }
  /**
   * An approval connect (Farcaster, `connectFlow: 'approval'`): no window and no redirect. Show `approvalUrl` as a link
   * and a QR code (`encodeQr`) while the panel reads the session; it is null while the link is being made. `ended` says
   * why it stopped, `expired` or `failed` with the platform's `message`: offer Try again (`connect`, or `reconnect` with
   * `accountId`) and Cancel. A connected approval goes back to `idle` with a `connected` notice, as other connects do.
   */
  | {
      readonly kind: 'approve'
      readonly approvalUrl: string | null
      readonly accountId: string | null
      readonly variant: ConnectVariant | null
      readonly ended: { readonly status: 'expired' | 'failed'; readonly message: string } | null
    }
  /** Asking whether to disconnect `account`: call `confirmDisconnect` or `cancel`. */
  | { readonly kind: 'confirm'; readonly account: AccountItem }

/** One platform the panel offers. */
export interface PlatformItem {
  /** The platform's id. */
  readonly platform: Platform
  /** Its name for people, such as `LinkedIn`. */
  readonly name: string
  /** Its connected accounts, newest first. */
  readonly accounts: readonly AccountItem[]
  /** What it is doing now. */
  readonly step: PlatformStep
  /** True while a connect is under way: its other buttons should be disabled. */
  readonly busy: boolean
  /** Whether a connect asks first for a handle (Bluesky, optional) or a server (Mastodon, required); null when it does not. */
  readonly handlePrompt: { readonly required: boolean } | null
  /**
   * Whether the platform's own connect is set up (on LinkedIn, the person's profile). False when only a variant is, and
   * the platform is offered for that alone.
   */
  readonly connectable: boolean
  /** The other ways it can connect here, such as LinkedIn's `pages`; empty for most platforms. */
  readonly variants: readonly ConnectVariant[]
  /** How its connect ends: `consent` through a sign-in window or redirect, `approval` in the platform's phone app (Farcaster). */
  readonly connectFlow: ConnectFlow
}

/** The last thing that happened, as data. `message` in the state words it. */
export type ConnectNotice =
  /** A connect or reconnect finished. `platform` is null when a redirect came back with no account the panel can see. */
  | { readonly kind: 'connected'; readonly platform: Platform | null; readonly accounts: readonly Account[]; readonly session: ConnectSession | null }
  /** An account was disconnected. */
  | { readonly kind: 'disconnected'; readonly account: Account }
  /** The person took too long to sign in. */
  | { readonly kind: 'expired'; readonly platform: Platform }
  /** A call or a connect failed. `during` says what was being done. */
  | { readonly kind: 'error'; readonly during: 'load' | 'connect' | 'disconnect' | 'redirect'; readonly platform: Platform | null; readonly code: string; readonly message: string }

/** Everything a panel draws, as one immutable snapshot. A new object every time anything changes. */
export interface ConnectState {
  /** False until there is a connect token; no call is made without one. */
  readonly hasToken: boolean
  /** True while the platforms and accounts are being read. */
  readonly loading: boolean
  /** True once they have been read at least once. */
  readonly loaded: boolean
  /** The platforms to offer, in the API's order. */
  readonly platforms: readonly PlatformItem[]
  /** Every connected account shown, newest first. */
  readonly accounts: readonly Account[]
  /** The last thing that happened, or null. */
  readonly notice: ConnectNotice | null
  /** The panel's status line in the labels' words: the notice, or loading, empty and no-token text. `text` is empty when there is nothing to say. */
  readonly message: { readonly text: string; readonly error: boolean }
  /** The words in use, defaults filled in. */
  readonly labels: ConnectLabels
}

/** What `connect` takes. */
export interface ConnectOptions {
  /**
   * Which way to connect, without asking: `pages` for LinkedIn company pages, or `null` for the platform's own connect (a
   * LinkedIn personal profile). Left out, a platform that offers both asks first (the step becomes `choose`), and one
   * that offers only a variant connects that.
   */
  variant?: ConnectVariant | null | undefined
}

/** What a panel can do. Start a connect straight from a click or submit handler: a browser opens a window only during one. */
export interface ConnectActions {
  /**
   * Connects a new account on `platform`. It asks first when it must: for a handle (the step becomes `handle`), or, when
   * the platform offers a variant and `options.variant` is left out, what to connect (the step becomes `choose`).
   */
  connect(platform: Platform, options?: ConnectOptions): void
  /** Sends the Mastodon server or Bluesky handle the step asked for and starts the connect. Blank means none. */
  submitHandle(platform: Platform, handle: string): void
  /** Reconnects an account that needs it. */
  reconnect(accountId: string): void
  /** Asks to disconnect an account: the step becomes `confirm`. Nothing is sent yet. */
  requestDisconnect(accountId: string): void
  /** Disconnects the account the platform's `confirm` step is asking about. */
  confirmDisconnect(platform: Platform): Promise<void>
  /** Stops waiting on a connect, or closes the handle or confirm question. */
  cancel(platform: Platform): void
  /** Clears the notice. */
  dismissNotice(): void
  /** Reads the platforms and accounts again. */
  refresh(): Promise<void>
}

/** The headless panel: state, a way to hear it change, the actions, and the means to change options or stop. */
export interface ConnectController extends ConnectActions {
  /** The current snapshot. The same object until something changes, as `useSyncExternalStore` needs. */
  getState(): ConnectState
  /** Calls `listener` after every change. Returns the function that stops it. */
  subscribe(listener: () => void): () => void
  /** Changes the options a panel may change while it is shown. A new platform list reads the accounts again. */
  configure(options: { platforms?: readonly Platform[] | null | undefined; mode?: 'popup' | 'redirect' | undefined; labels?: Partial<ConnectLabels> | undefined }): void
  /** Stops every wait, drops every listener, and ignores answers still on their way. */
  destroy(): void
}

/** What `createConnectController` takes. */
export interface ConnectControllerOptions {
  /** A connect token from your server, or a function that fetches a fresh one. Null makes no call. */
  token: TokenSource | null
  /** Where the API lives; production when left out. The token is sent there and nowhere else. */
  baseUrl?: string | undefined
  /** Offer only these platforms. */
  platforms?: readonly Platform[] | null | undefined
  /** `popup` (the default) opens a small window; `redirect` sends the whole page to the platform and back. */
  mode?: 'popup' | 'redirect' | undefined
  /** A `fetch` to use instead of the global one. */
  fetch?: typeof fetch | undefined
  /** Any of the words, for `message` and the notices. */
  labels?: Partial<ConnectLabels> | undefined
  /** Reads, reports and removes the result Flung put on the address after a redirect. True when left out. */
  readRedirect?: boolean | undefined
  /** The accounts were read. */
  onLoad?: ((detail: LoadDetail) => void) | undefined
  /** A connect or reconnect finished. */
  onConnect?: ((detail: ConnectDetail) => void) | undefined
  /** An account was disconnected. */
  onDisconnect?: ((detail: DisconnectDetail) => void) | undefined
  /** A call or a connect failed. */
  onError?: ((detail: ErrorDetail) => void) | undefined
}

type Step =
  | { kind: 'idle' }
  | { kind: 'handle'; required: boolean }
  | { kind: 'choose'; variants: readonly ConnectVariant[] }
  | { kind: 'waiting'; abort: AbortController; blockedUrl: string | null; accountId: string | null; variant: ConnectVariant | null }
  | { kind: 'approve'; abort: AbortController; approvalUrl: string | null; accountId: string | null; variant: ConnectVariant | null; ended: { status: 'expired' | 'failed'; message: string } | null }
  | { kind: 'confirm'; account: Account }

/** How the API offers a platform: its own connect, and the variants set up beside it. */
interface Offer {
  connectable: boolean
  variants: readonly ConnectVariant[]
  connectFlow: ConnectFlow
}

const IDLE: PlatformStep = Object.freeze({ kind: 'idle' })
const NO_VARIANTS: readonly ConnectVariant[] = Object.freeze([])

/**
 * The connect panel with no markup: it reads the platforms and accounts, runs connects, reconnects and disconnects, and
 * keeps one immutable snapshot of it all. `<flung-connect>` and `useFlungConnect` are drawn from it; a page can draw its
 * own panel from it too. It starts reading as soon as it has a token.
 */
export function createConnectController(options: ConnectControllerOptions): ConnectController {
  return new Controller(options)
}

/** The snapshot a panel with no controller yet shows, the same object every time for each `hasToken`. */
export function initialConnectState(hasToken: boolean): ConnectState {
  return hasToken ? INITIAL_WITH_TOKEN : INITIAL_WITHOUT_TOKEN
}

class Controller implements ConnectController {
  readonly #options: ConnectControllerOptions
  readonly #client: ConnectClient | null
  readonly #listeners = new Set<() => void>()
  #asked: readonly Platform[] | null
  #mode: 'popup' | 'redirect'
  #labels: ConnectLabels
  #platforms: Platform[] = []
  #offers = new Map<Platform, Offer>()
  #accounts: Account[] = []
  #steps = new Map<Platform, Step>()
  #notice: ConnectNotice | null = null
  #loading = false
  #loaded = false
  #destroyed = false
  #state: ConnectState

  constructor(options: ConnectControllerOptions) {
    this.#options = options
    this.#asked = options.platforms ?? null
    this.#mode = options.mode ?? 'popup'
    this.#labels = { ...DEFAULT_LABELS, ...options.labels }
    this.#client = options.token === null ? null : new ConnectClient({ token: options.token, baseUrl: options.baseUrl, fetch: options.fetch })
    this.#loading = this.#client !== null
    this.#state = this.#snapshot()
    if (this.#client !== null) {
      void this.#load().then(() => {
        if (options.readRedirect !== false) this.#readReturn()
      })
    }
  }

  getState = (): ConnectState => this.#state

  subscribe = (listener: () => void): (() => void) => {
    if (this.#destroyed) return () => undefined
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  configure(options: { platforms?: readonly Platform[] | null | undefined; mode?: 'popup' | 'redirect' | undefined; labels?: Partial<ConnectLabels> | undefined }): void {
    if (this.#destroyed) return
    if (options.mode !== undefined) this.#mode = options.mode
    let changed = false
    if ('labels' in options) {
      const labels = { ...DEFAULT_LABELS, ...options.labels }
      if ((Object.keys(labels) as (keyof ConnectLabels)[]).some((key) => labels[key] !== this.#labels[key])) {
        this.#labels = labels
        changed = true
      }
    }
    if ('platforms' in options) {
      const asked = options.platforms ?? null
      if ((asked ?? []).join(',') !== (this.#asked ?? []).join(',')) {
        this.#asked = asked
        void this.#load()
      }
    }
    if (changed) this.#emit()
  }

  destroy(): void {
    if (this.#destroyed) return
    this.#destroyed = true
    for (const step of this.#steps.values()) if (step.kind === 'waiting' || step.kind === 'approve') step.abort.abort()
    this.#listeners.clear()
  }

  refresh = (): Promise<void> => this.#load()

  connect = (platform: Platform, options: ConnectOptions = {}): void => {
    if (!this.#ready(platform)) return
    const offer = this.#offers.get(platform)
    let variant = options.variant ?? null
    if (options.variant === undefined && offer !== undefined && offer.variants.length > 0) {
      // Both ways set up: ask. Only a variant set up: that is the connect.
      if (offer.connectable) return this.#set(platform, { kind: 'choose', variants: offer.variants })
      variant = offer.variants[0] ?? null
    }
    const prompt = HANDLE_PROMPT[platform]
    if (variant === null && prompt !== undefined) return this.#set(platform, { kind: 'handle', required: prompt.required })
    this.#start(platform, null, undefined, variant)
  }

  submitHandle = (platform: Platform, handle: string): void => {
    if (!this.#ready(platform)) return
    const trimmed = handle.trim()
    this.#start(platform, null, trimmed === '' ? undefined : trimmed, null)
  }

  reconnect = (accountId: string): void => {
    const account = this.#accounts.find((candidate) => candidate.id === accountId)
    if (account === undefined || !this.#ready(account.platform)) return
    // The API reconnects through the app the account was connected with, so a page needs no variant here.
    this.#start(account.platform, account, undefined, null)
  }

  requestDisconnect = (accountId: string): void => {
    const account = this.#accounts.find((candidate) => candidate.id === accountId)
    if (account === undefined || !this.#ready(account.platform)) return
    this.#set(account.platform, { kind: 'confirm', account })
  }

  confirmDisconnect = async (platform: Platform): Promise<void> => {
    const step = this.#steps.get(platform)
    const client = this.#client
    if (step?.kind !== 'confirm' || client === null || this.#destroyed) return
    this.#set(platform, { kind: 'idle' })
    try {
      const disconnected = await client.disconnect(step.account.id)
      if (this.#destroyed) return
      await this.#load()
      this.#tell({ kind: 'disconnected', account: step.account })
      this.#options.onDisconnect?.({ account: disconnected })
    } catch (error) {
      this.#fail(error, 'disconnect', platform)
    }
  }

  cancel = (platform: Platform): void => {
    const step = this.#steps.get(platform)
    if (step === undefined || step.kind === 'idle') return
    if (step.kind === 'waiting' || step.kind === 'approve') step.abort.abort()
    this.#set(platform, { kind: 'idle' })
  }

  dismissNotice = (): void => {
    if (this.#notice !== null) this.#tell(null)
  }

  /** A connect may start: there is a token, and the platform is not already waiting on one. An approval that ended may start again. */
  #ready(platform: Platform): boolean {
    return !this.#destroyed && this.#client !== null && !waitingStep(this.#steps.get(platform))
  }

  async #load(): Promise<void> {
    const client = this.#client
    if (client === null || this.#destroyed) return
    if (!this.#loading) {
      this.#loading = true
      this.#emit()
    }
    try {
      const [platforms, accounts] = await Promise.all([client.platforms(), client.accounts()])
      if (this.#destroyed) return
      const asked = this.#asked
      const granted = typeof this.#options.token === 'string' ? tokenPlatforms(this.#options.token) : null
      const offered = platforms
        .map((info) => ({ platform: info.platform, connectable: info.connectable, variants: (info.variants ?? []).filter(isConnectVariant), connectFlow: info.connectFlow === 'approval' ? ('approval' as const) : ('consent' as const) }))
        .filter((info) => (info.connectable || info.variants.length > 0) && (asked ?? [info.platform]).includes(info.platform) && (granted ?? [info.platform]).includes(info.platform))
      this.#platforms = offered.map((info) => info.platform)
      this.#offers = new Map(offered.map((info) => [info.platform, Object.freeze({ connectable: info.connectable, variants: Object.freeze(info.variants), connectFlow: info.connectFlow })]))
      this.#accounts = accounts.filter((account) => account.status !== 'disconnected' && this.#platforms.includes(account.platform))
      this.#loading = false
      this.#loaded = true
      this.#emit()
      this.#options.onLoad?.({ accounts: this.#accounts })
    } catch (error) {
      if (this.#destroyed) return
      this.#loading = false
      this.#fail(error, 'load', null)
    }
  }

  /** A connect that left the page (`mode: 'redirect'`) and came back: report it, and take Flung's result off the address. */
  #readReturn(): void {
    if (this.#destroyed || typeof location === 'undefined' || typeof history === 'undefined') return
    const result = readRedirectResult(location.href)
    if (result === null) return
    history.replaceState(history.state, '', withoutRedirectResult(location.href))
    if (result.status === 'connected') {
      const accounts = this.#accounts.filter((account) => result.accountIds.includes(account.id))
      this.#tell({ kind: 'connected', platform: accounts[0]?.platform ?? null, accounts, session: null })
      this.#options.onConnect?.({ session: null, accounts })
    } else {
      const code = result.error?.code ?? 'platform_error'
      const message = result.error?.message ?? ''
      this.#tell({ kind: 'error', during: 'redirect', platform: null, code, message })
      this.#options.onError?.({ code, message })
    }
  }

  /** Called straight from a click or a submit: a window can only be opened during one. */
  #start(platform: Platform, account: Account | null, handle: string | undefined, variant: ConnectVariant | null): void {
    const client = this.#client as ConnectClient
    const redirect = this.#mode === 'redirect' && typeof location !== 'undefined'
    const redirectUrl = redirect ? withoutRedirectResult(location.href) : undefined
    const begin = () => (account === null ? client.connect(platform, { handle, redirectUrl, variant: variant ?? undefined }) : client.reconnect(account.id, { redirectUrl }))
    if (this.#offers.get(platform)?.connectFlow === 'approval') return this.#approve(platform, account, begin)
    const abort = new AbortController()
    const step: Step = { kind: 'waiting', abort, blockedUrl: null, accountId: account?.id ?? null, variant }
    this.#notice = null
    this.#set(platform, step)
    if (redirect) {
      void begin().then(
        (session) => {
          const url = safeUrl(session.authorizationUrl)
          if (url !== null && !this.#destroyed) location.assign(url)
        },
        (error: unknown) => this.#settle(platform, step, error),
      )
      return
    }
    void connectInPopup(client, begin, { signal: abort.signal })
      .then(async (outcome) => {
        if (outcome.kind === 'finished') return outcome.session
        if (this.#steps.get(platform) === step) this.#set(platform, { ...step, blockedUrl: safeUrl(outcome.session.authorizationUrl) })
        return client.waitForSession(outcome.session.id, { signal: abort.signal })
      })
      .then(
        (session) => this.#finish(platform, session),
        (error: unknown) => this.#settle(platform, step, error),
      )
  }

  /**
   * An approval connect: no window and no redirect. The link to the platform's app is shown in the step while the session
   * is read, backing off; an approval that expires or fails stays in the step, saying why, until Try again or Cancel.
   */
  #approve(platform: Platform, account: Account | null, begin: () => Promise<ConnectSession>): void {
    const client = this.#client as ConnectClient
    const step: Step = { kind: 'approve', abort: new AbortController(), approvalUrl: null, accountId: account?.id ?? null, variant: null, ended: null }
    this.#notice = null
    this.#set(platform, step)
    void begin()
      .then((session) => {
        if (this.#steps.get(platform) !== step) return null
        step.approvalUrl = safeUrl(session.authorizationUrl, ['https:'])
        this.#emit()
        return client.waitForSession(session.id, { signal: step.abort.signal, ...APPROVAL_POLL })
      })
      .then(
        async (session) => {
          if (session === null || this.#destroyed || this.#steps.get(platform) !== step) return
          if (session.status === 'connected') return this.#finish(platform, session)
          const message = session.error?.message ?? ''
          step.ended = { status: session.status === 'expired' ? 'expired' : 'failed', message }
          step.approvalUrl = null
          this.#emit()
          this.#options.onError?.({ code: session.status === 'expired' ? 'expired' : (session.error?.code ?? 'platform_error'), message })
        },
        (error: unknown) => this.#settle(platform, step, error),
      )
  }

  async #finish(platform: Platform, session: ConnectSession): Promise<void> {
    if (this.#destroyed) return
    this.#set(platform, { kind: 'idle' })
    if (session.status === 'connected') {
      await this.#load()
      if (this.#destroyed) return
      const accounts = this.#accounts.filter((account) => session.accountIds.includes(account.id))
      this.#tell({ kind: 'connected', platform, accounts, session })
      this.#options.onConnect?.({ session, accounts })
    } else if (session.status === 'expired') {
      this.#tell({ kind: 'expired', platform })
      this.#options.onError?.({ code: 'expired', message: this.#state.message.text })
    } else {
      const code = session.error?.code ?? 'platform_error'
      const message = session.error?.message ?? ''
      this.#tell({ kind: 'error', during: 'connect', platform, code, message })
      this.#options.onError?.({ code, message })
    }
  }

  /** A connect that stopped early: cancelled by the person, or refused by the API. */
  #settle(platform: Platform, step: Step, error: unknown): void {
    if (this.#destroyed) return
    if (this.#steps.get(platform) === step) this.#set(platform, { kind: 'idle' })
    // By name and by the signal, not `instanceof DOMException`: the reason may come from another realm's DOMException.
    const aborted = ((step.kind === 'waiting' || step.kind === 'approve') && step.abort.signal.aborted) || (typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError')
    if (aborted) return
    this.#fail(error, 'connect', platform)
  }

  #fail(error: unknown, during: 'load' | 'connect' | 'disconnect', platform: Platform | null): void {
    if (this.#destroyed) return
    const detail = error instanceof FlungConnectError ? { code: error.code, message: error.message } : { code: 'unknown', message: String(error) }
    this.#tell({ kind: 'error', during, platform, ...detail })
    this.#options.onError?.(detail)
  }

  #set(platform: Platform, step: Step): void {
    this.#steps.set(platform, step)
    this.#emit()
  }

  #tell(notice: ConnectNotice | null): void {
    this.#notice = notice
    this.#emit()
  }

  #emit(): void {
    if (this.#destroyed) return
    this.#state = this.#snapshot()
    for (const listener of [...this.#listeners]) listener()
  }

  #snapshot(): ConnectState {
    const now = Date.now()
    const items = new Map(this.#accounts.map((account) => [account.id, accountItem(account, now)]))
    const platforms = this.#platforms.map((platform): PlatformItem => {
      const step = publicStep(this.#steps.get(platform), items, now)
      const prompt = HANDLE_PROMPT[platform]
      const offer = this.#offers.get(platform)
      return Object.freeze({
        platform,
        name: PLATFORM_NAMES[platform],
        accounts: Object.freeze(this.#accounts.filter((account) => account.platform === platform).map((account) => items.get(account.id) as AccountItem)),
        step,
        busy: step.kind === 'waiting' || (step.kind === 'approve' && step.ended === null),
        handlePrompt: prompt === undefined ? null : Object.freeze({ required: prompt.required }),
        connectable: offer?.connectable ?? true,
        variants: offer?.variants ?? NO_VARIANTS,
        connectFlow: offer?.connectFlow ?? 'consent',
      })
    })
    return Object.freeze({
      hasToken: this.#client !== null,
      loading: this.#loading,
      loaded: this.#loaded,
      platforms: Object.freeze(platforms),
      accounts: Object.freeze([...this.#accounts]),
      notice: this.#notice,
      message: Object.freeze(statusLine(this.#notice, this.#client !== null, this.#loaded, this.#platforms.length, this.#labels)),
      labels: Object.freeze({ ...this.#labels }),
    })
  }
}

function publicStep(step: Step | undefined, items: ReadonlyMap<string, AccountItem>, now: number): PlatformStep {
  if (step === undefined || step.kind === 'idle') return IDLE
  if (step.kind === 'handle') return Object.freeze({ kind: 'handle', required: step.required })
  if (step.kind === 'choose') return Object.freeze({ kind: 'choose', variants: step.variants })
  if (step.kind === 'waiting') return Object.freeze({ kind: 'waiting', blockedUrl: step.blockedUrl, accountId: step.accountId, variant: step.variant })
  if (step.kind === 'approve') return Object.freeze({ kind: 'approve', approvalUrl: step.approvalUrl, accountId: step.accountId, variant: step.variant, ended: step.ended === null ? null : Object.freeze({ ...step.ended }) })
  return Object.freeze({ kind: 'confirm', account: items.get(step.account.id) ?? accountItem(step.account, now) })
}

/** Whether a step holds the platform: a sign-in window open, or an approval still awaited. */
function waitingStep(step: Step | undefined): boolean {
  return step?.kind === 'waiting' || (step?.kind === 'approve' && step.ended === null)
}

/** What to show for an account. */
function accountItem(account: Account, now: number): AccountItem {
  const name = account.username ?? account.platformUserId
  const shown = nonEmpty(account.displayName) ?? name
  const username = account.username !== null && account.username !== shown ? account.username : null
  const due = account.reconnectBy === null ? null : Date.parse(account.reconnectBy)
  const reconnect = account.status === 'needs_reconnect' ? ({ reason: 'needs_reconnect' } as const) : due !== null && !Number.isNaN(due) && due - now < SOON_MS ? ({ reason: 'deadline', by: account.reconnectBy as string } as const) : null
  return Object.freeze({ account, name, displayName: shown, username, avatarUrl: safeUrl(account.avatarUrl ?? null, ['https:']), initial: initialOf(shown), page: isPageAccount(account), reconnect })
}

function statusLine(notice: ConnectNotice | null, hasToken: boolean, loaded: boolean, offered: number, labels: ConnectLabels): { text: string; error: boolean } {
  if (notice !== null) return { text: noticeText(notice, labels), error: notice.kind === 'error' || notice.kind === 'expired' }
  if (!hasToken) return { text: labels.noToken, error: false }
  if (offered === 0) return { text: loaded ? labels.empty : labels.loading, error: false }
  return { text: '', error: false }
}

function noticeText(notice: ConnectNotice, labels: ConnectLabels): string {
  switch (notice.kind) {
    case 'connected':
      return formatLabel(labels.connected, { platform: notice.platform === null ? 'The account' : PLATFORM_NAMES[notice.platform] })
    case 'disconnected':
      return formatLabel(labels.disconnected, { account: notice.account.username ?? notice.account.platformUserId })
    case 'expired':
      return formatLabel(labels.expired, { platform: PLATFORM_NAMES[notice.platform] })
    case 'error':
      if (notice.during === 'load') return formatLabel(labels.loadFailed, { message: notice.message })
      if (notice.during === 'connect' && notice.platform !== null) return formatLabel(labels.failed, { platform: PLATFORM_NAMES[notice.platform], message: notice.message })
      return notice.message
  }
}

function nonEmpty(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/** The first letter of a name, without a leading `@`, upper-cased; `?` when there is none. */
function initialOf(name: string): string {
  const first = Array.from(name.replace(/^@+/, '').trim())[0]
  return first === undefined ? '?' : first.toLocaleUpperCase()
}

/** `value` when it is an address on one of `protocols`, else null: an address from the API never becomes a `javascript:` link. */
function safeUrl(value: string | null, protocols: readonly string[] = ['https:', 'http:']): string | null {
  if (value === null) return null
  try {
    return protocols.includes(new URL(value).protocol) ? value : null
  } catch {
    return null
  }
}

function frozenInitial(hasToken: boolean): ConnectState {
  return Object.freeze({
    hasToken,
    loading: hasToken,
    loaded: false,
    platforms: Object.freeze([]),
    accounts: Object.freeze([]),
    notice: null,
    message: Object.freeze(statusLine(null, hasToken, false, 0, DEFAULT_LABELS)),
    labels: Object.freeze({ ...DEFAULT_LABELS }),
  })
}

const INITIAL_WITH_TOKEN = frozenInitial(true)
const INITIAL_WITHOUT_TOKEN = frozenInitial(false)
