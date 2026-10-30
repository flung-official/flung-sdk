import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import { createConnectController, initialConnectState } from '../core/controller.js'
import type { ConnectActions, ConnectController, ConnectControllerOptions, ConnectState } from '../core/controller.js'

/** What `useFlungConnect` takes: the controller's options. Callbacks and a token function may be new on every render. */
export type UseFlungConnectOptions = ConnectControllerOptions

/** What `useFlungConnect` returns: the state to draw, and the actions to call from your own buttons and forms. */
export type UseFlungConnectResult = ConnectState & ConnectActions

const noSubscribe = (): (() => void) => () => undefined

/**
 * The connect panel with none of Flung's markup, for drawing every piece with your own components and CSS. It runs a
 * `createConnectController` for as long as the component is mounted, and a new one when the token string, `baseUrl`
 * or whether there is a `fetch` changes. A token function, `fetch` and the callbacks are read fresh on every call, so
 * they need no `useCallback`. Call `connect`, `submitHandle` and `reconnect` straight from a click or submit handler: a
 * browser opens a window only during one.
 */
export function useFlungConnect(options: UseFlungConnectOptions): UseFlungConnectResult {
  const latest = useRef(options)
  latest.current = options
  const current = useRef<ConnectController | null>(null)
  const [controller, setController] = useState<ConnectController | null>(null)
  const { token, baseUrl } = options
  const tokenKey = token === null ? null : typeof token === 'string' ? `token:${token}` : 'function'
  const hasFetch = options.fetch !== undefined

  useEffect(() => {
    const source = latest.current.token
    const made = createConnectController({
      token:
        typeof source === 'function'
          ? () => {
              const now = latest.current.token
              return typeof now === 'function' ? now() : Promise.resolve(now ?? '')
            }
          : source,
      baseUrl,
      platforms: latest.current.platforms,
      mode: latest.current.mode,
      labels: latest.current.labels,
      readRedirect: latest.current.readRedirect,
      fetch: hasFetch ? (input, init) => (latest.current.fetch ?? fetch)(input, init) : undefined,
      onLoad: (detail) => latest.current.onLoad?.(detail),
      onConnect: (detail) => latest.current.onConnect?.(detail),
      onDisconnect: (detail) => latest.current.onDisconnect?.(detail),
      onError: (detail) => latest.current.onError?.(detail),
    })
    current.current = made
    setController(made)
    return () => {
      made.destroy()
      if (current.current === made) current.current = null
    }
  }, [tokenKey, baseUrl, hasFetch])

  const platformsKey = options.platforms?.join(',') ?? ''
  const labelsKey = JSON.stringify(options.labels ?? {})
  useEffect(() => {
    controller?.configure({ platforms: latest.current.platforms ?? null, mode: latest.current.mode ?? 'popup', labels: latest.current.labels })
  }, [controller, platformsKey, options.mode, labelsKey])

  const initial = initialConnectState(token !== null)
  const state = useSyncExternalStore(controller?.subscribe ?? noSubscribe, controller?.getState ?? (() => initial), () => initial)

  const actions = useMemo<ConnectActions>(
    () => ({
      connect: (platform, options) => current.current?.connect(platform, options),
      submitHandle: (platform, handle) => current.current?.submitHandle(platform, handle),
      reconnect: (accountId) => current.current?.reconnect(accountId),
      requestDisconnect: (accountId) => current.current?.requestDisconnect(accountId),
      confirmDisconnect: (platform) => current.current?.confirmDisconnect(platform) ?? Promise.resolve(),
      cancel: (platform) => current.current?.cancel(platform),
      dismissNotice: () => current.current?.dismissNotice(),
      refresh: () => current.current?.refresh() ?? Promise.resolve(),
    }),
    [],
  )

  return { ...state, ...actions }
}
