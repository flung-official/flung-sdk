import type { TokenSource } from '../core/client.js'
import { createConnectController, initialConnectState } from '../core/controller.js'
import type { AccountItem, ConnectController, ConnectOptions, ConnectState, PlatformItem } from '../core/controller.js'
import { DEFAULT_LABELS, formatLabel as format } from '../core/labels.js'
import type { ConnectLabels } from '../core/labels.js'
import { parsePlatformList } from '../core/platforms.js'
import type { ConnectVariant, Platform } from '../core/types.js'
import { avatar, button, html, mark } from './dom.js'
import type { ChangeDetail, ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from './events.js'
import { CHOICE_MARKS, FLUNG_MARK, PLATFORM_MARKS } from './marks.js'
import { BASE_STYLES, STYLES } from './styles.js'

/** How the platforms are laid out: `list` (the default) one under another, `grid` as cards side by side, `compact` tighter. */
export type FlungConnectLayout = 'list' | 'grid' | 'compact'

const LAYOUTS: readonly FlungConnectLayout[] = ['list', 'grid', 'compact']

/**
 * How a platform with a connect variant (LinkedIn: a personal profile or company pages) is offered: `choose` (the
 * default) asks which after Connect, inside the panel; `tiles` shows each as its own platform, such as LinkedIn and
 * LinkedIn Page.
 */
export type FlungConnectVariants = 'choose' | 'tiles'

/** One tile the panel draws for a platform: its own connect (`variant` null), or one of its variants. */
interface Tile {
  readonly variant: ConnectVariant | null
  readonly accounts: readonly AccountItem[]
}

/**
 * Which of a platform's tiles its step shows under: a reconnect or a disconnect under the account's tile, a connect under
 * the tile of the variant it is for, anything else under the first. -1 when none matches.
 */
function stepTile(item: PlatformItem, tiles: readonly Tile[]): number {
  const { step } = item
  const accountId = step.kind === 'confirm' ? step.account.account.id : step.kind === 'waiting' ? step.accountId : null
  if (accountId !== null) return tiles.findIndex((tile) => tile.accounts.some((account) => account.account.id === accountId))
  if (step.kind === 'waiting') return tiles.findIndex((tile) => tile.variant === step.variant)
  return 0
}

/** The key of a tile's Connect button, so focus can come back to it. */
const connectKey = (platform: Platform, variant: ConnectVariant | null) => (variant === null ? `connect-${platform}` : `connect-${platform}-${variant}`)

/** `<flung-connect>` as a page sees it. */
export interface FlungConnectElement extends HTMLElement {
  /** A connect token, or a function that fetches a fresh one from your server. The `token` attribute sets a string. */
  token: TokenSource | null
  /** Every word the panel shows. Setting it fills in the defaults for any left out. */
  get labels(): ConnectLabels
  set labels(value: Partial<ConnectLabels> | undefined)
  /** The panel's current state, the same snapshot `flung-change` carries. */
  readonly state: ConnectState
  /** The headless controller behind the panel, for a page that draws parts of it itself; null until the element is on a page. A new token makes a new one. */
  readonly controller: ConnectController | null
  /**
   * Starts a connect, as the platform's Connect button does. Call it straight from a click: a browser opens a window only
   * during one. `{ variant: 'pages' }` connects LinkedIn company pages without asking, `{ variant: null }` the profile.
   */
  connect(platform: Platform, options?: ConnectOptions): void
  /** Reads the accounts again, as after a connect. */
  refresh(): Promise<void>
}

/** Builds the class on first use, so importing the package on a server, where there is no `HTMLElement`, is safe. */
export function createFlungConnectClass(): new () => FlungConnectElement {
  return class FlungConnect extends HTMLElement implements FlungConnectElement {
    static readonly observedAttributes = ['token', 'base-url', 'platforms', 'branding', 'mode', 'layout', 'unstyled', 'variants']

    readonly #root = this.attachShadow({ mode: 'open' })
    #source: TokenSource | null = null
    #labels: ConnectLabels = DEFAULT_LABELS
    #controller: ConnectController | null = null
    #unsubscribe: (() => void) | null = null
    /** Each platform's step when the panel was last drawn, and the variant it was for, to move focus when one changes. */
    #steps = new Map<Platform, { kind: string; variant: ConnectVariant | null }>()
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
      if (this.#controller === null) this.#render()
      else this.#controller.configure({ labels: this.#labels })
    }

    get state(): ConnectState {
      return this.#controller?.getState() ?? initialConnectState(this.#source !== null)
    }

    get controller(): ConnectController | null {
      return this.#controller
    }

    connect(platform: Platform, options?: ConnectOptions): void {
      this.#controller?.connect(platform, options)
    }

    refresh(): Promise<void> {
      return this.#controller?.refresh() ?? Promise.resolve()
    }

    connectedCallback(): void {
      if (this.#started) return
      this.#started = true
      if (this.#source === null && this.hasAttribute('token')) this.#source = this.getAttribute('token')
      this.#reset()
    }

    attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
      if (previous === next || !this.#started) return
      if (name === 'token') {
        this.#source = next
        this.#reset()
      } else if (name === 'base-url') this.#reset()
      else if (name === 'platforms') this.#controller?.configure({ platforms: parsePlatformList(next) })
      else if (name === 'mode') this.#controller?.configure({ mode: next === 'redirect' ? 'redirect' : 'popup' })
      else this.#render()
    }

    /** A new token or API: a new controller, which reads everything again and reports a redirect that came back. */
    #reset(): void {
      if (!this.#started) return
      this.#unsubscribe?.()
      this.#controller?.destroy()
      this.#steps.clear()
      const controller = createConnectController({
        token: this.#source,
        baseUrl: this.getAttribute('base-url') ?? undefined,
        platforms: parsePlatformList(this.getAttribute('platforms')),
        mode: this.getAttribute('mode') === 'redirect' ? 'redirect' : 'popup',
        labels: this.#labels,
        onLoad: (detail) => this.#emit<LoadDetail>('flung-load', detail),
        onConnect: (detail) => this.#emit<ConnectDetail>('flung-connect', detail),
        onDisconnect: (detail) => this.#emit<DisconnectDetail>('flung-disconnect', detail),
        onError: (detail) => this.#emit<ErrorDetail>('flung-error', detail),
      })
      this.#controller = controller
      this.#unsubscribe = controller.subscribe(() => this.#render())
      this.#render()
    }

    #emit<T>(type: string, detail: T): void {
      this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
    }

    #render(): void {
      const state = this.state
      const labels = state.labels
      const layout = LAYOUTS.find((value) => value === this.getAttribute('layout')) ?? 'list'
      const active = this.#root.activeElement instanceof HTMLElement ? (this.#root.activeElement.dataset['key'] ?? null) : null
      const tiles = this.getAttribute('variants') === 'tiles'
      const list = html('ul', { class: 'list', part: 'list' }, ...state.platforms.flatMap((item) => this.#platformRows(item, labels, tiles)))
      const empty = state.message.text === ''
      const message = html('p', { class: state.message.error ? 'message error' : 'message', part: state.message.error ? 'message message-error' : 'message', role: 'status', 'aria-live': 'polite', hidden: empty }, state.message.text)
      const panel = html('section', { class: 'panel', part: 'panel', 'data-layout': layout, 'aria-label': labels.panel }, list, message, this.#footer(labels))
      this.#root.replaceChildren(html('style', {}, this.hasAttribute('unstyled') ? BASE_STYLES : STYLES), panel)
      this.#placeFocus(state, active)
      this.dispatchEvent(new CustomEvent<ChangeDetail>('flung-change', { detail: { state } }))
    }

    /**
     * Keeps focus where the person is: on the field when a question opens, on the first choice when the platform asks
     * what to connect, on Keep when a disconnect asks to confirm, and back on Connect when a question or a wait closes.
     * Otherwise on whatever had it before the panel was drawn again.
     */
    #placeFocus(state: ConnectState, active: string | null): void {
      let wanted = active
      const fallback: string[] = []
      for (const item of state.platforms) {
        const before = this.#steps.get(item.platform) ?? { kind: 'idle', variant: null }
        const now = item.step.kind
        if (now === before.kind) continue
        if (now === 'handle') wanted = `handle-${item.platform}`
        else if (now === 'choose') wanted = `choose-${item.platform}-personal`
        else if (now === 'confirm') wanted = `keep-${item.platform}`
        // Back to the Connect that started it: a variant's own tile, else the platform's.
        else if (now === 'idle') fallback.push(connectKey(item.platform, before.variant), connectKey(item.platform, null))
      }
      this.#steps = new Map(state.platforms.map((item) => [item.platform, { kind: item.step.kind, variant: item.step.kind === 'waiting' ? item.step.variant : null }]))
      const find = (key: string | null) => (key === null ? undefined : [...this.#root.querySelectorAll<HTMLElement>('[data-key]')].find((node) => node.dataset['key'] === key))
      // Falls back to Connect only when focus was inside the panel, so a wait ending never pulls focus from the page.
      ;(find(wanted) ?? (active !== null ? fallback.map(find).find((node) => node !== undefined) : undefined))?.focus()
    }

    /**
     * A platform's rows: one, or with `variants="tiles"` one per way it connects (LinkedIn, then LinkedIn Page), each with
     * its own accounts. A platform that connects only through a variant is drawn as that variant's tile.
     */
    #platformRows(item: PlatformItem, labels: ConnectLabels, tiles: boolean): HTMLLIElement[] {
      const slot = `platform-${item.platform}`
      if (item.variants.length === 0) return [this.#platformRow(item, { variant: null, accounts: item.accounts }, labels, { chooser: false, extra: true, slot })]
      if (!tiles) {
        const variant = item.connectable ? null : (item.variants[0] ?? null)
        return [this.#platformRow(item, { variant, accounts: item.accounts }, labels, { chooser: item.connectable, extra: true, slot })]
      }
      const own: Tile[] = item.connectable ? [{ variant: null, accounts: item.accounts.filter((account) => !account.page) }] : []
      const split = [...own, ...item.variants.map((variant): Tile => ({ variant, accounts: item.accounts.filter((account) => account.page) }))]
      const at = Math.max(0, stepTile(item, split))
      return split.map((tile, index) => this.#platformRow(item, tile, labels, { chooser: false, extra: index === at, slot: index === 0 ? `platform-${item.platform}` : `platform-${item.platform}-${tile.variant ?? ''}` }))
    }

    /**
     * One tile: mark, name, Connect, and its accounts. `chooser` makes Connect ask what to connect; `extra` puts the
     * platform's question, wait or confirm under it; `slot` names the slot a page's own row goes in.
     */
    #platformRow(item: PlatformItem, tile: Tile, labels: ConnectLabels, options: { chooser: boolean; extra: boolean; slot: string }): HTMLLIElement {
      const { chooser } = options
      const { platform, busy, step } = item
      const { variant } = tile
      const name = variant === null ? item.name : format(labels.pagesName, { platform: item.name })
      const first = tile.accounts.length === 0
      const text = first ? labels.connect : labels.connectAnother
      const choosing = chooser && step.kind === 'choose'
      // With a chooser, Connect opens the question and closes it again; a tile connects its own way straight away.
      const onConnect = () => (choosing ? this.#controller?.cancel(platform) : this.#controller?.connect(platform, chooser ? {} : { variant }))
      const connect = button(text, connectKey(platform, variant), 'connect', onConnect, {
        variant: first ? 'primary' : 'secondary',
        disabled: busy,
        label: `${text} ${name}`,
        ...(chooser ? { expanded: choosing, controls: `choose-${platform}` } : {}),
      })
      const count = first ? labels.notConnected : format(labels.connectedCount, { count: String(tile.accounts.length) })
      const title = html('span', { class: 'title', part: 'title' }, html('span', { class: 'name', part: 'name' }, name), html('span', { class: first ? 'count' : 'count on', part: first ? 'count' : 'count count-connected' }, count))
      const badge = html('span', { class: 'badge', part: 'badge', 'aria-hidden': 'true' }, mark(PLATFORM_MARKS[platform].path))
      const row = html('div', { class: 'row', part: 'row' }, html('slot', { name: options.slot }, badge, title, connect))
      const items = tile.accounts.map((account) => this.#accountRow(account, busy, labels))
      const parts = variant === null ? `platform platform-${platform}` : `platform platform-${platform} platform-${platform}-${variant}`
      return html(
        'li',
        { class: 'platform', part: parts, 'data-platform': platform, 'data-variant': variant ?? undefined },
        row,
        items.length === 0 ? null : html('ul', { class: 'accounts', part: 'accounts' }, ...items),
        options.extra ? this.#rowExtra(item, labels) : null,
      )
    }

    #accountRow(item: AccountItem, busy: boolean, labels: ConnectLabels): HTMLLIElement {
      const { account } = item
      const status = item.reconnect === null ? null : item.reconnect.reason === 'needs_reconnect' ? labels.needsReconnect : format(labels.reconnectBy, { date: new Date(item.reconnect.by).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) })
      const reconnect = status === null ? null : button(labels.reconnect, `reconnect-${account.id}`, 'reconnect', () => this.#controller?.reconnect(account.id), { disabled: busy, label: `${labels.reconnect} ${item.name}` })
      const disconnect = button(labels.disconnect, `disconnect-${account.id}`, 'disconnect', () => this.#controller?.requestDisconnect(account.id), { variant: 'quiet', disabled: busy, label: `${labels.disconnect} ${item.name}` })
      const names = html(
        'span',
        { class: 'names', part: 'account-names' },
        html('span', { class: 'handle', part: 'account-name', title: item.displayName }, item.displayName),
        item.username === null ? null : html('span', { class: 'username', part: 'account-username', title: `@${item.username}` }, `@${item.username}`),
      )
      const tag = item.page ? html('span', { class: 'tag', part: 'tag tag-page' }, labels.pageTag) : null
      const who = html('span', { class: 'who', part: 'account-details' }, names, tag, status === null ? null : html('span', { class: 'status', part: 'status' }, status))
      return html(
        'li',
        { class: 'account', part: 'account', 'data-account': account.id },
        html('slot', { name: `account-${account.id}` }, avatar(item), who, html('span', { class: 'actions', part: 'actions' }, reconnect, disconnect)),
      )
    }

    /** Flung's mark and name, linking to its docs, unless the page set `branding="none"`. */
    #footer(labels: ConnectLabels): HTMLElement | null {
      if (this.getAttribute('branding') === 'none') return null
      const link = html('a', { href: 'https://docs.flung.dev', target: '_blank', rel: 'noopener', part: 'footer-link' }, mark(FLUNG_MARK.path, { viewBox: FLUNG_MARK.viewBox, className: 'flung', part: 'footer-mark', size: 14 }), 'Flung')
      return html('p', { class: 'footer', part: 'footer' }, labels.securedBy, link)
    }

    #rowExtra(item: PlatformItem, labels: ConnectLabels): HTMLElement | null {
      const { platform, name, step } = item
      if (step.kind === 'handle') {
        const id = `handle-${platform}`
        const input = html('input', { id, name: 'handle', part: 'input', 'data-key': id, autocomplete: 'username', spellcheck: 'false', required: step.required })
        const submit = html('button', { type: 'submit', class: 'primary', part: 'button button-primary button-continue', 'data-key': `continue-${platform}` }, labels.continue)
        const form = html(
          'form',
          { class: 'form', part: 'form' },
          html('label', { for: id, part: 'label' }, platform === 'mastodon' ? labels.handleMastodon : labels.handleBluesky),
          input,
          submit,
          button(labels.cancel, `cancel-${platform}`, 'cancel', () => this.#controller?.cancel(platform)),
        )
        form.addEventListener('submit', (event) => {
          event.preventDefault()
          this.#controller?.submitHandle(platform, input.value)
        })
        return form
      }
      if (step.kind === 'choose') return this.#chooser(item, step.variants, labels)
      if (step.kind === 'waiting') {
        const link = step.blockedUrl === null ? null : html('a', { href: step.blockedUrl, target: '_blank', rel: 'noopener', part: 'link' }, format(labels.openSignIn, { platform: name }))
        const text = step.blockedUrl === null ? format(labels.waiting, { platform: name }) : `${format(labels.blocked, { platform: name })} `
        return html(
          'p',
          { class: 'note', part: 'note' },
          html('span', { class: 'spinner', part: 'spinner', 'aria-hidden': 'true' }),
          html('span', { class: 'note-text', part: 'note-text' }, text, link),
          button(labels.cancel, `cancel-${platform}`, 'cancel', () => this.#controller?.cancel(platform)),
        )
      }
      if (step.kind === 'confirm') {
        return html(
          'div',
          { class: 'confirm', part: 'confirm' },
          html('p', { part: 'confirm-text' }, format(labels.confirmDisconnect, { account: step.account.name })),
          button(labels.disconnect, `confirm-${platform}`, 'confirm', () => void this.#controller?.confirmDisconnect(platform), { variant: 'danger' }),
          button(labels.keep, `keep-${platform}`, 'keep', () => this.#controller?.cancel(platform)),
        )
      }
      return null
    }

    /**
     * What to connect, when a platform offers its own connect and a variant: a group of two buttons, each with an icon,
     * a name and a line under it (read as the button's description). Arrow keys move between them, Escape closes the
     * question, and focus starts on the first.
     */
    #chooser(item: PlatformItem, variants: readonly ConnectVariant[], labels: ConnectLabels): HTMLElement {
      const { platform } = item
      const titleId = `choose-title-${platform}`
      const option = (variant: ConnectVariant | null, key: string, icon: string, name: string, description: string) => {
        const nameId = `${key}-name`
        const descriptionId = `${key}-description`
        const element = html(
          'button',
          { type: 'button', class: 'option', part: `button button-option button-option-${variant ?? 'personal'}`, 'data-key': key, 'aria-labelledby': nameId, 'aria-describedby': descriptionId },
          html('span', { class: 'option-icon', part: 'option-icon', 'aria-hidden': 'true' }, mark(icon, { className: 'option-mark', part: 'option-mark', size: 18 })),
          html(
            'span',
            { class: 'option-text', part: 'option-text' },
            html('span', { class: 'option-name', part: 'option-name', id: nameId }, name),
            html('span', { class: 'option-description', part: 'option-description', id: descriptionId }, description),
          ),
        )
        element.addEventListener('click', () => this.#controller?.connect(platform, { variant }))
        return element
      }
      const options = [
        option(null, `choose-${platform}-personal`, CHOICE_MARKS.personal, labels.variantPersonal, labels.variantPersonalDescription),
        ...variants.map((variant) => option(variant, `choose-${platform}-${variant}`, CHOICE_MARKS[variant], labels.variantPages, labels.variantPagesDescription)),
      ]
      const group = html(
        'div',
        { class: 'choose', part: 'choose', id: `choose-${platform}`, role: 'group', 'aria-labelledby': titleId },
        html('p', { class: 'choose-title', part: 'choose-title', id: titleId }, format(labels.chooseVariant, { platform: item.name })),
        html('div', { class: 'options', part: 'choose-options' }, ...options),
        button(labels.cancel, `cancel-${platform}`, 'cancel', () => this.#controller?.cancel(platform)),
      )
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          this.#controller?.cancel(platform)
          return
        }
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
        const at = options.indexOf(event.target as HTMLButtonElement)
        if (step === undefined || at === -1) return
        event.preventDefault()
        options[(at + step + options.length) % options.length]?.focus()
      })
      return group
    }
  }
}
