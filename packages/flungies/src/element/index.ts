// <flung-ie>: a Flungie as a custom element, for pages without React.
//
//   import { defineFlungie } from '@flung.dev/flungies/element'
//   defineFlungie()                      // registers <flung-ie>; pass another name to use your own
//   <flung-ie seed="usr_8f3k2" size="40" theme="dark"></flung-ie>
//   <flung-ie seed="usr_8f3k2" size="240" animated></flung-ie>
//
// Attributes: seed, size (px, default 64), theme (light or dark), variant (disc, square or bare), salt, and animated,
// which loads the WebGL hero from 160 px. defineWorkspaceMark() registers <flung-mark>, a workspace mark, the same way.
// Importing this module registers nothing, so it is safe on a server.

import type { FlungieGL } from '../gl/index.js'
import { renderMark } from '../marks/render.js'
import { markTraits } from '../marks/traits.js'
import { render, toSvgElement, type Variant } from '../render.js'
import { type Theme, traits } from '../traits.js'

const ANIMATED_MIN_SIZE = 160
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

export class FlungieElement extends Base {
  static readonly observedAttributes = ['seed', 'size', 'theme', 'variant', 'salt', 'animated']

  #hero: FlungieGL | null = null
  #loading = 0

  connectedCallback(): void {
    this.#draw()
  }

  disconnectedCallback(): void {
    this.#release()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#draw()
  }

  #options() {
    const size = Number(this.getAttribute('size')) || 64
    const theme: Theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    const v = this.getAttribute('variant')
    const variant: Variant = v === 'square' || v === 'bare' ? v : 'disc'
    const t = traits(this.getAttribute('seed') ?? '', {}, { salt: this.getAttribute('salt') ?? undefined })
    return { t, size, theme, variant, animated: this.hasAttribute('animated') && size >= ANIMATED_MIN_SIZE }
  }

  #release(): void {
    this.#loading++
    this.#hero?.dispose()
    this.#hero = null
  }

  #draw(): void {
    const { t, size, theme, variant, animated } = this.#options()
    this.style.display ||= 'inline-block'
    this.style.lineHeight = '0'
    if (!animated) {
      this.#release()
      this.replaceChildren(toSvgElement(render(t, { size, theme, variant })))
      return
    }
    if (this.#hero) {
      this.#hero.update(t, { size, theme, variant })
      return
    }
    this.replaceChildren(toSvgElement(render(t, { size, theme, variant })))
    const ticket = ++this.#loading
    import('../gl/index.js').then(({ mountFlungieGL }) => {
      if (ticket !== this.#loading || !this.isConnected) return
      this.#hero = mountFlungieGL(this, t, { size, theme, variant })
    })
  }
}

/** Registers the element, once. */
export function defineFlungie(name = 'flung-ie'): void {
  if (typeof customElements === 'undefined' || customElements.get(name)) return
  customElements.define(name, class extends FlungieElement {})
}

/**
 * <flung-mark>: a workspace mark. Attributes: seed (the workspace ID), name (for the initials), size (px, default 64), theme
 * (light or dark), initials (letters to show instead, or "none"), salt, and animated, the light sweep from MARK_SWEEP_MIN.
 *
 *   defineWorkspaceMark()
 *   <flung-mark seed="ws_8f3k2" name="Northwind Studio" size="32"></flung-mark>
 */
export class WorkspaceMarkElement extends Base {
  static readonly observedAttributes = ['seed', 'name', 'size', 'theme', 'initials', 'salt', 'animated']

  connectedCallback(): void {
    this.#draw()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#draw()
  }

  #draw(): void {
    const size = Number(this.getAttribute('size')) || 64
    const theme: Theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    const letters = this.getAttribute('initials')
    const initials = letters === null || letters === '' ? 'auto' : letters === 'none' ? false : letters
    const t = markTraits(this.getAttribute('seed') ?? '', {}, { salt: this.getAttribute('salt') ?? undefined })
    this.style.display ||= 'inline-block'
    this.style.lineHeight = '0'
    this.replaceChildren(toSvgElement(renderMark(t, { size, theme, initials, name: this.getAttribute('name') ?? undefined, animate: this.hasAttribute('animated') })))
  }
}

/** Registers the workspace mark element, once. */
export function defineWorkspaceMark(name = 'flung-mark'): void {
  if (typeof customElements === 'undefined' || customElements.get(name)) return
  customElements.define(name, class extends WorkspaceMarkElement {})
}
