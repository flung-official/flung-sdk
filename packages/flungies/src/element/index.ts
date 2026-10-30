// <flung-ie>: a Flungie as a custom element, for pages without React.
//
//   import { defineFlungie } from '@flung.dev/flungies/element'
//   defineFlungie()                      // registers <flung-ie>; pass another name to use your own
//   <flung-ie seed="usr_8f3k2" size="40" theme="dark"></flung-ie>
//   <flung-ie seed="usr_8f3k2" size="240" animated></flung-ie>
//
// Attributes: seed, size (px, default 64), theme (light or dark), variant (disc, square or bare), salt, and animated,
// which loads the WebGL hero from 160 px. Importing this module registers nothing, so it is safe on a server.

import type { FlungieGL } from '../gl/index.js'
import { render, type Variant } from '../render.js'
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
      this.innerHTML = render(t, { size, theme, variant })
      return
    }
    if (this.#hero) {
      this.#hero.update(t, { size, theme, variant })
      return
    }
    this.innerHTML = render(t, { size, theme, variant })
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
