/**
 * Building the element's own nodes with `createElement`, never from a string of HTML, so nothing the API or a page
 * supplies (an account name, an error message) can become markup. Attributes go through `setAttribute`, text through
 * `textContent`.
 */

import type { AccountItem } from '../core/controller.js'
import { encodeQr } from '../core/qr.js'
import type { Account } from '../core/types.js'

type Attributes = Readonly<Record<string, string | number | boolean | undefined>>

/** An HTML element of the element's own. `true` sets an empty attribute; `false` and `undefined` set none. */
export function html<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Attributes = {}, ...children: (Node | string | null)[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue
    element.setAttribute(name, value === true ? '' : String(value))
  }
  for (const child of children) if (child !== null) element.append(child)
  return element
}

/** How an account is named in the panel's messages: its username, or its platform id when it has none. */
export function displayName(account: Account): string {
  return account.username ?? account.platformUserId
}

/** A button's look: `primary` for the first Connect, `secondary` for the rest, `quiet` for Disconnect, `danger` to confirm one. */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'

/**
 * A button that calls `onClick`, with a `data-key` so focus can be put back on it after the panel is drawn again. Its
 * `part` is `button`, `button-<variant>` and `button-<role>`, so a page can style every button, a kind, or one of them.
 */
export function button(text: string, key: string, role: string, onClick: () => void, options: { variant?: ButtonVariant; disabled?: boolean; label?: string; expanded?: boolean; controls?: string } = {}): HTMLButtonElement {
  const variant = options.variant ?? 'secondary'
  const element = html(
    'button',
    {
      type: 'button',
      class: variant,
      part: `button button-${variant} button-${role}`,
      'data-key': key,
      disabled: options.disabled === true,
      'aria-label': options.label,
      // A button that opens a question inside the panel says whether it is open, and which question.
      'aria-expanded': options.expanded === undefined ? undefined : String(options.expanded),
      'aria-controls': options.controls,
    },
    text,
  )
  element.addEventListener('click', onClick)
  return element
}

/** An icon drawn from one path, for the platform marks and Flung's own. Hidden from screen readers: the name beside it says what it is. */
export function mark(path: string, options: { viewBox?: string; className?: string; part?: string; size?: number } = {}): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', options.viewBox ?? '0 0 24 24')
  svg.setAttribute('class', options.className ?? 'mark')
  svg.setAttribute('part', options.part ?? 'mark')
  // Presentation attributes: any stylesheet overrides them, and an unstyled panel still draws a sensible size.
  svg.setAttribute('width', String(options.size ?? 20))
  svg.setAttribute('height', String(options.size ?? 20))
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shape.setAttribute('d', path)
  svg.append(shape)
  return svg
}

/** The light modules kept around a QR code so a camera finds its edges (the standard asks for four; three reads well on a screen). */
const QR_QUIET = 3

/**
 * A QR code of `text` as one SVG path of dark modules on a light square, named `label` for a screen reader. It stays dark
 * on light in a dark theme too, as cameras need; `--flung-qr-size` sets its size.
 */
export function qrCode(text: string, label: string): SVGSVGElement {
  const code = encodeQr(text)
  const size = code.size + QR_QUIET * 2
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.setAttribute('class', 'qr')
  svg.setAttribute('part', 'qr')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', label)
  svg.setAttribute('shape-rendering', 'crispEdges')
  // Presentation attributes, as `mark` sets: an unstyled panel still draws a code a camera reads.
  svg.setAttribute('width', '132')
  svg.setAttribute('height', '132')
  const ground = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  ground.setAttribute('width', String(size))
  ground.setAttribute('height', String(size))
  ground.setAttribute('fill', '#ffffff')
  const modules = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  const runs: string[] = []
  code.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) runs.push(`M${x + QR_QUIET} ${y + QR_QUIET}h1v1h-1z`)
    })
  })
  modules.setAttribute('d', runs.join(''))
  modules.setAttribute('fill', '#000000')
  svg.append(ground, modules)
  return svg
}

/**
 * An account's picture: an `<img>` that sends no referrer, loads lazily and has an empty `alt` (the name is beside it),
 * or a circle with the account's initial when there is no picture or it does not load. `avatarUrl` is only ever an
 * `https` address (the controller drops anything else).
 */
export function avatar(item: AccountItem): HTMLElement {
  const initial = html('span', { class: 'avatar initial', part: 'avatar avatar-initial', 'aria-hidden': 'true' }, item.initial)
  if (item.avatarUrl === null) return initial
  const image = html('img', { class: 'avatar', part: 'avatar avatar-image', alt: '', referrerpolicy: 'no-referrer', loading: 'lazy', decoding: 'async', width: 32, height: 32 })
  image.addEventListener('error', () => image.replaceWith(initial), { once: true })
  image.src = item.avatarUrl
  return image
}
