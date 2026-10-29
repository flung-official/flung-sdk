import { createElement, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactElement, Ref } from 'react'

import type { TokenSource } from '../core/client.js'
import type { Platform } from '../core/types.js'
import type { ConnectLabels } from '../element/copy.js'
import { defineFlungConnect, TAG_NAME } from '../element/define.js'
import type { ConnectDetail, DisconnectDetail, ErrorDetail, LoadDetail } from '../element/events.js'
import type { FlungConnectElement } from '../element/flung-connect.js'

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
  theme?: 'light' | 'dark' | undefined
  labels?: Partial<ConnectLabels> | undefined
  className?: string | undefined
  style?: CSSProperties | undefined
  onLoad?: ((detail: LoadDetail) => void) | undefined
  onConnect?: ((detail: ConnectDetail) => void) | undefined
  onDisconnect?: ((detail: DisconnectDetail) => void) | undefined
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

  return createElement(TAG_NAME, {
    ref: element,
    'base-url': props.baseUrl,
    platforms: props.platforms?.join(','),
    mode: props.mode,
    theme: props.theme,
    class: props.className,
    style: props.style,
  })
}

export const FlungConnect = forwardRef(FlungConnectInner)
