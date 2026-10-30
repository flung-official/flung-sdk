/**
 * The panel's own tooltip, never the browser's `title`: that one cannot be styled or themed, opens with no keyboard or
 * finger, and looks different in every browser. One tooltip serves the whole panel. An element asks for one with
 * `data-tooltip` (the words); with `data-tooltip-truncated` as well it opens only while the element's text is cut short,
 * as an account's name is in a narrow panel.
 *
 * It opens after a short rest of the pointer, on keyboard focus and on a held finger, and closes on Escape, a press, a
 * scroll, or when the pointer and focus leave. It goes in the top layer where the browser has popovers, so no page's
 * `overflow` or `transform` cuts it off, above the element (below when there is no room), and inside the screen's edges.
 */

import { html } from './dom.js'

/** How long the pointer rests before the tooltip opens. */
export const TOOLTIP_DELAY_MS = 400
/** How long a finger holds an element before its tooltip opens. */
export const TOOLTIP_HOLD_MS = 500
/** How long a tooltip opened by a finger stays once it lifts. */
export const TOOLTIP_TOUCH_MS = 2500

const GAP = 6
const EDGE = 8

/** Whether an element's text overflows its box. */
const isCut = (element: HTMLElement): boolean => element.scrollWidth > element.clientWidth + 1

/** A pointer event's kind (`mouse`, `pen`, `touch`). A shadow root's event map names no pointer events, so it is read off the event. */
const pointerType = (event: Event): string => ('pointerType' in event && typeof event.pointerType === 'string' ? event.pointerType : 'mouse')

/** The panel's tooltip, attached to its shadow root once. Put `element` back in the root each time the panel is drawn. */
export interface PanelTooltip {
  readonly element: HTMLElement
  hide(): void
}

export function panelTooltip(root: ShadowRoot): PanelTooltip {
  const element = html('span', { class: 'tooltip', part: 'tooltip', 'aria-hidden': 'true', hidden: true })
  const popover = typeof element.showPopover === 'function'
  if (popover) element.setAttribute('popover', 'manual')
  let timer: ReturnType<typeof setTimeout> | undefined
  let anchor: HTMLElement | null = null

  const asking = (target: EventTarget | null): HTMLElement | null => (target instanceof Element ? target.closest<HTMLElement>('[data-tooltip]') : null)

  const place = (target: HTMLElement) => {
    const box = target.getBoundingClientRect()
    const width = element.offsetWidth
    const height = element.offsetHeight
    const above = box.top - GAP - height >= EDGE
    const top = above ? box.top - GAP - height : box.bottom + GAP
    const left = Math.min(Math.max(box.left + box.width / 2 - width / 2, EDGE), Math.max(EDGE, window.innerWidth - EDGE - width))
    element.style.left = `${left}px`
    element.style.top = `${top}px`
    element.dataset['side'] = above ? 'top' : 'bottom'
  }

  const show = (target: HTMLElement) => {
    const words = target.dataset['tooltip'] ?? ''
    if (words === '' || !target.isConnected || (target.hasAttribute('data-tooltip-truncated') && !isCut(target))) return
    anchor = target
    element.textContent = words
    element.hidden = false
    if (popover && !element.matches(':popover-open')) element.showPopover()
    place(target)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
  }

  function hide(): void {
    clearTimeout(timer)
    timer = undefined
    if (anchor === null) return
    anchor = null
    if (popover && element.matches(':popover-open')) element.hidePopover()
    element.hidden = true
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', hide, true)
    window.removeEventListener('resize', hide)
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') hide()
  }

  const later = (target: HTMLElement, delay: number) => {
    clearTimeout(timer)
    timer = setTimeout(() => show(target), delay)
  }

  root.addEventListener('pointerover', (event) => {
    const target = asking(event.target)
    if (target === null || target === anchor || pointerType(event) === 'touch') return
    hide()
    later(target, TOOLTIP_DELAY_MS)
  })
  root.addEventListener('pointerout', (event) => {
    const target = asking(event.target)
    if (target === null || ('relatedTarget' in event && event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return
    hide()
  })
  root.addEventListener('pointerdown', (event) => {
    hide()
    const target = asking(event.target)
    if (target !== null && pointerType(event) === 'touch') later(target, TOOLTIP_HOLD_MS)
  })
  root.addEventListener('pointerup', (event) => {
    if (pointerType(event) !== 'touch') return
    if (anchor === null) {
      clearTimeout(timer)
      return
    }
    timer = setTimeout(hide, TOOLTIP_TOUCH_MS)
  })
  root.addEventListener('focusin', (event) => {
    const target = asking(event.target)
    if (target !== null) show(target)
  })
  root.addEventListener('focusout', hide)

  return { element, hide }
}

/** What the tooltip needs to work at all, kept with `unstyled` too: fixed in place, out of the way of the pointer. */
export const TOOLTIP_BASE_STYLES = `
.tooltip { position: fixed; inset: auto; margin: 0; pointer-events: none; }
`

/** Its look: a small pill in the panel's own colours turned around, so it follows the theme and the page's overrides. */
export const TOOLTIP_STYLES = `
:host {
  --flung-tooltip-background: var(--flung-text);
  --flung-tooltip-text: var(--flung-surface);
  --flung-tooltip-radius: var(--flung-radius-inner);
  --flung-tooltip-shadow: 0 4px 14px rgb(0 0 0 / .16);
}
.tooltip {
  z-index: 2147483647; max-width: min(20rem, calc(100vw - 16px)); padding: 4px 8px; border: 0; border-radius: var(--flung-tooltip-radius);
  background: var(--flung-tooltip-background); color: var(--flung-tooltip-text); box-shadow: var(--flung-tooltip-shadow);
  font: var(--flung-font-weight-medium) var(--flung-font-size-small)/1.35 var(--flung-font); overflow-wrap: anywhere;
}
@media (prefers-reduced-motion: no-preference) {
  .tooltip:not([hidden]) { animation: flung-tooltip-in .12s ease-out; }
}
@keyframes flung-tooltip-in { from { opacity: 0; } }
`
