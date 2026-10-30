import { createElement, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'

import type { TokenSource } from '../core/client.js'
import { initialConnectState } from '../core/controller.js'
import type { AccountItem, ConnectActions, ConnectState, PlatformItem } from '../core/controller.js'
import type { ConnectLabels } from '../core/labels.js'
import type { Platform } from '../core/types.js'
import { defineFlungConnect, TAG_NAME } from '../element/define.js'
import type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from '../element/events.js'
import type { FlungConnectElement, FlungConnectLayout, FlungConnectVariants } from '../element/flung-connect.js'

export { useFlungConnect } from './use-flung-connect.js'
export type { UseFlungConnectOptions, UseFlungConnectResult } from './use-flung-connect.js'

/** What `renderPlatform` is given: the platform, the actions, and the words in use. */
export interface PlatformRowProps {
  /** The platform, its accounts and what it is doing. */
  platform: PlatformItem
  /** The panel's actions. Call `connect` straight from a click: a browser opens a window only during one. */
  actions: ConnectActions
  /** The panel's words, defaults filled in. */
  labels: ConnectLabels
}

/** What `renderAccount` is given: the account, its platform, the actions, and the words in use. */
export interface AccountRowProps {
  /** The account and what to show for it. */
  account: AccountItem
  /** The platform it is on. */
  platform: PlatformItem
  /** The panel's actions, such as `reconnect(account.account.id)` and `requestDisconnect(account.account.id)`. */
  actions: ConnectActions
  /** The panel's words, defaults filled in. */
  labels: ConnectLabels
}

/**
 * `<FlungConnect>`: the `<flung-connect>` element for React. It registers the element on first render, passes plain
 * values as attributes, sets `token` and `labels` as properties, and turns the element's events into callbacks. React
 * is a peer dependency; nothing else is imported. The ref is the element itself, with `refresh()`.
 */
export interface FlungConnectProps {
  /** A connect token from your server, or a function that fetches a fresh one. */
  token: TokenSource | null
  /** Where the API lives; production when left out. */
  baseUrl?: string | undefined
  /** Offer only these platforms. */
  platforms?: readonly Platform[] | undefined
  /** `redirect` sends the whole page to the platform and back, for pages that cannot open windows. */
  mode?: 'popup' | 'redirect' | undefined
  /** `light` or `dark`. Follows the page's colour scheme when left out. */
  theme?: 'light' | 'dark' | undefined
  /** `list` (the default), `grid` or `compact`. */
  layout?: FlungConnectLayout | undefined
  /**
   * How a platform with a connect variant is offered. `choose` (the default) asks after Connect whether to connect a
   * LinkedIn personal profile or a company page; `tiles` shows them as two platforms, LinkedIn and LinkedIn Page.
   */
  variants?: FlungConnectVariants | undefined
  /** Drops Flung's stylesheet, so every `::part()` is yours to style. */
  unstyled?: boolean | undefined
  /** `none` hides the small "Secured by Flung" line under the list. */
  branding?: 'none' | undefined
  /** Any of the panel's words, to put it in another language. */
  labels?: Partial<ConnectLabels> | undefined
  /** A class for the element itself. */
  className?: string | undefined
  /** Styles for the element, such as its `--flung-*` custom properties. */
  style?: CSSProperties | undefined
  /**
   * Draws a platform's row (its mark, name and Connect button) yourself, in your page's own DOM and CSS. The panel keeps
   * the accounts, the handle question, the wait and the confirm below it.
   */
  renderPlatform?: ((props: PlatformRowProps) => ReactNode) | undefined
  /** Draws one account's row yourself, in your page's own DOM and CSS. The panel keeps the confirm and the messages. */
  renderAccount?: ((props: AccountRowProps) => ReactNode) | undefined
  /** The accounts were read: on first show and after every change. */
  onLoad?: ((detail: LoadDetail) => void) | undefined
  /** A connect or reconnect finished. */
  onConnect?: ((detail: ConnectDetail) => void) | undefined
  /** An account was disconnected. */
  onDisconnect?: ((detail: DisconnectDetail) => void) | undefined
  /** A call or a connect failed. */
  onError?: ((detail: ErrorDetail) => void) | undefined
}

const EVENTS = { 'flung-load': 'onLoad', 'flung-connect': 'onConnect', 'flung-disconnect': 'onDisconnect', 'flung-error': 'onError' } as const

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function FlungConnectInner(props: FlungConnectProps, ref: Ref<FlungConnectElement | null>): ReactElement {
  const element = useRef<FlungConnectElement | null>(null)
  const latest = useRef(props)
  latest.current = props
  useImperativeHandle(ref, () => element.current as FlungConnectElement, [])

  useClientLayoutEffect(() => {
    defineFlungConnect()
  }, [])

  // Listens before the token is handed over below, so the first `flung-load` is not missed.
  useClientLayoutEffect(() => {
    const node = element.current
    if (node === null) return undefined
    const listeners = Object.entries(EVENTS).map(([type, prop]) => {
      const listener = (event: Event): void => {
        const handler = latest.current[prop] as ((detail: unknown) => void) | undefined
        handler?.((event as CustomEvent).detail)
      }
      node.addEventListener(type, listener)
      return () => node.removeEventListener(type, listener)
    })
    return () => {
      for (const remove of listeners) remove()
    }
  }, [])

  useClientLayoutEffect(() => {
    const node = element.current
    if (node === null) return
    node.labels = props.labels
    if (node.token !== props.token) node.token = props.token
  }, [props.token, props.labels])

  // The element's state, only when a render prop needs it, so a panel without them renders no more often than before.
  const custom = props.renderPlatform !== undefined || props.renderAccount !== undefined
  const subscribe = useCallback(
    (notify: () => void) => {
      const node = element.current
      if (!custom || node === null) return () => undefined
      node.addEventListener('flung-change', notify)
      return () => node.removeEventListener('flung-change', notify)
    },
    [custom],
  )
  const initial = initialConnectState(props.token !== null)
  const state = useSyncExternalStore(subscribe, () => (custom ? ((element.current?.state as ConnectState | undefined) ?? initial) : initial), () => initial)
  const actions = useMemo<ConnectActions>(() => {
    const controller = () => element.current?.controller ?? null
    return {
      connect: (platform, options) => controller()?.connect(platform, options),
      submitHandle: (platform, handle) => controller()?.submitHandle(platform, handle),
      reconnect: (accountId) => controller()?.reconnect(accountId),
      requestDisconnect: (accountId) => controller()?.requestDisconnect(accountId),
      confirmDisconnect: (platform) => controller()?.confirmDisconnect(platform) ?? Promise.resolve(),
      cancel: (platform) => controller()?.cancel(platform),
      dismissNotice: () => controller()?.dismissNotice(),
      refresh: () => controller()?.refresh() ?? Promise.resolve(),
    }
  }, [])

  // Each custom row goes into the light DOM with the element's slot name for it, so your CSS reaches it directly.
  const children = custom
    ? state.platforms.flatMap((platform) => [
        props.renderPlatform === undefined ? null : createElement('div', { key: `platform-${platform.platform}`, slot: `platform-${platform.platform}` }, props.renderPlatform({ platform, actions, labels: state.labels })),
        ...(props.renderAccount === undefined ? [] : platform.accounts.map((account) => createElement('div', { key: `account-${account.account.id}`, slot: `account-${account.account.id}` }, props.renderAccount?.({ account, platform, actions, labels: state.labels })))),
      ])
    : undefined

  return createElement(
    TAG_NAME,
    {
      ref: element,
      'base-url': props.baseUrl,
      platforms: props.platforms?.join(','),
      mode: props.mode,
      theme: props.theme,
      layout: props.layout,
      variants: props.variants,
      unstyled: props.unstyled === true ? '' : undefined,
      branding: props.branding,
      class: props.className,
      style: props.style,
    },
    children,
  )
}

/** The `<flung-connect>` element as a React component. */
export const FlungConnect = forwardRef(FlungConnectInner)
