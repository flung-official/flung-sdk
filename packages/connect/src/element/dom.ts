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
export function button(text: string, key: string, onClick: () => void, options: { primary?: boolean; danger?: boolean; disabled?: boolean; label?: string } = {}): HTMLButtonElement {
  const className = options.primary === true ? 'primary' : options.danger === true ? 'danger' : undefined
  const element = html('button', { type: 'button', class: className, 'data-key': key, disabled: options.disabled === true, 'aria-label': options.label }, text)
  element.addEventListener('click', onClick)
  return element
}
