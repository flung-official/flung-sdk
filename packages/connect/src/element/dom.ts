/**
 * Building the element's own nodes with `createElement`, never from a string of HTML, so nothing the API or a page
 * supplies (an account name, an error message) can become markup. Attributes go through `setAttribute`, text through
 * `textContent`.
 */

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

/** How an account is named in the panel: its username, or its platform id when it has none. */
export function displayName(account: Account): string {
  return account.username ?? account.platformUserId
}

/** A button that calls `onClick`, with a `data-key` so focus can be put back on it after the panel is drawn again. */
export function button(text: string, key: string, onClick: () => void, options: { primary?: boolean; danger?: boolean; warning?: boolean; quiet?: boolean; disabled?: boolean; label?: string } = {}): HTMLButtonElement {
  const className = [options.primary === true && 'primary', options.danger === true && 'danger', options.warning === true && 'warning', options.quiet === true && 'quiet'].filter(Boolean).join(' ') || undefined
  const element = html('button', { type: 'button', class: className, 'data-key': key, disabled: options.disabled === true, 'aria-label': options.label }, text)
  element.addEventListener('click', onClick)
  return element
}

/** An icon drawn from one path, for the platform marks and Flung's own. Hidden from screen readers: the name beside it says what it is. */
export function mark(path: string, viewBox = '0 0 24 24', className = 'mark'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('class', className)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shape.setAttribute('d', path)
  svg.append(shape)
  return svg
}
