import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectClient, createConnectController, DEFAULT_LABELS, isPageAccount } from '../core/index.js'
import type { ConnectController } from '../core/index.js'
import { defineFlungConnect } from '../element/define.js'
import type { FlungConnectElement } from '../element/flung-connect.js'
import { FlungConnect, useFlungConnect } from '../react/index.js'
import type { UseFlungConnectResult } from '../react/index.js'
import { fakeApi, fakePopup } from './fake-api.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

/** A Flung with LinkedIn's personal app and its pages app both set up. */
const withPages = () => fakeApi({ variants: { linkedin: ['pages'] } })
const PAGE_URN = 'urn:li:organization:42'

let made: ConnectController[] = []

beforeEach(() => {
  defineFlungConnect()
})

afterEach(() => {
  for (const controller of made) controller.destroy()
  made = []
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const posts = (api: ReturnType<typeof fakeApi>) => api.requests.filter((request) => request.method === 'POST')

describe('ConnectClient', () => {
  it('sends a variant in the connect body, and none when it is left out', async () => {
    const api = withPages()
    const client = new ConnectClient({ token: 'flung_ct_a.b', fetch: api.fetch })
    await client.connect('linkedin', { variant: 'pages' })
    await client.connect('linkedin')
    expect(posts(api).map((request) => request.body)).toEqual([{ variant: 'pages' }, {}])
  })
})

describe('createConnectController with a connect variant', () => {
  function start(api: ReturnType<typeof fakeApi>) {
    const controller = createConnectController({ token: 'flung_ct_a.b', fetch: api.fetch })
    made.push(controller)
    return controller
  }
  const linkedin = (controller: ConnectController) => controller.getState().platforms.find((item) => item.platform === 'linkedin')

  it('asks what to connect when LinkedIn offers pages, then sends the answer', async () => {
    const api = withPages()
    const controller = start(api)
    await vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
    expect(linkedin(controller)).toMatchObject({ connectable: true, variants: ['pages'] })
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.connect('linkedin')
    expect(linkedin(controller)?.step).toEqual({ kind: 'choose', variants: ['pages'] })
    expect(posts(api)).toEqual([])
    controller.connect('linkedin', { variant: 'pages' })
    expect(linkedin(controller)?.step).toMatchObject({ kind: 'waiting', variant: 'pages' })
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
  })

  it('connects the profile without asking when told to, and lets the person back out of the question', async () => {
    const api = withPages()
    const controller = start(api)
    await vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
    controller.connect('linkedin')
    controller.cancel('linkedin')
    expect(linkedin(controller)?.step).toEqual({ kind: 'idle' })
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.connect('linkedin', { variant: null })
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: {} }]))
  })

  it('behaves as before when the API offers no variant, or is older than the field', async () => {
    for (const api of [fakeApi(), fakeApi({ omitVariants: true })]) {
      const controller = start(api)
      await vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
      expect(linkedin(controller)).toMatchObject({ connectable: true, variants: [] })
      vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
      controller.connect('linkedin')
      expect(linkedin(controller)?.step.kind).toBe('waiting')
      await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: {} }]))
    }
  })

  it('offers LinkedIn for pages alone when only the pages app is set up, and connects pages without asking', async () => {
    const api = fakeApi({ connectable: ['x'], variants: { linkedin: ['pages'] } })
    const controller = start(api)
    await vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
    expect(controller.getState().platforms.map((item) => item.platform)).toEqual(['x', 'linkedin'])
    expect(linkedin(controller)).toMatchObject({ connectable: false, variants: ['pages'] })
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.connect('linkedin')
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
  })

  it('marks the accounts a pages connect stores as pages, and reports them all', async () => {
    const api = withPages()
    api.account('linkedin', 'Ada Lovelace', { platformUserId: 'abc123' })
    const connected: unknown[] = []
    const controller = createConnectController({ token: 'flung_ct_a.b', fetch: api.fetch, onConnect: (detail) => connected.push(detail) })
    made.push(controller)
    await vi.waitFor(() => expect(controller.getState().loaded).toBe(true))
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    controller.connect('linkedin', { variant: 'pages' })
    await vi.waitFor(() => expect(posts(api)).toHaveLength(1))
    api.finish({ username: 'Acme Studio', platformUserId: PAGE_URN, more: [{ username: 'Acme Labs', platformUserId: 'urn:li:organization:43' }] })
    await vi.waitFor(() => expect(connected).toHaveLength(1), { timeout: 5000 })
    expect(connected[0]).toMatchObject({ accounts: [{ username: 'Acme Labs' }, { username: 'Acme Studio' }] })
    const accounts = linkedin(controller)?.accounts ?? []
    expect(accounts.map((item) => [item.displayName, item.page])).toEqual([
      ['Acme Labs', true],
      ['Acme Studio', true],
      ['Ada Lovelace', false],
    ])
    expect(controller.getState().message.text).toBe('LinkedIn is connected.')
  })

  it('tells a page from a person by its organisation urn, on LinkedIn only', () => {
    expect(isPageAccount({ platform: 'linkedin', platformUserId: PAGE_URN })).toBe(true)
    expect(isPageAccount({ platform: 'linkedin', platformUserId: 'abc123' })).toBe(false)
    expect(isPageAccount({ platform: 'facebook', platformUserId: PAGE_URN })).toBe(false)
  })
})

describe('<flung-connect> with LinkedIn pages', () => {
  let api: ReturnType<typeof fakeApi>

  async function mount(attributes: Record<string, string> = {}, options: { labels?: Partial<typeof DEFAULT_LABELS> } = {}) {
    vi.stubGlobal('fetch', api.fetch)
    const element = document.createElement('flung-connect') as FlungConnectElement
    element.setAttribute('token', 'flung_ct_a.b')
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
    if (options.labels !== undefined) element.labels = options.labels
    const loads: unknown[] = []
    element.addEventListener('flung-load', (event) => loads.push((event as CustomEvent).detail))
    document.body.append(element)
    await vi.waitFor(() => expect(loads.length).toBeGreaterThan(0))
    return element
  }
  const root = (element: FlungConnectElement) => element.shadowRoot as ShadowRoot
  const key = (element: FlungConnectElement, name: string) => root(element).querySelector<HTMLButtonElement>(`[data-key="${name}"]`)
  const chooser = (element: FlungConnectElement) => root(element).querySelector<HTMLElement>('[part="choose"]')
  const keydown = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))

  it('opens a chooser inside the panel only when LinkedIn offers pages', async () => {
    api = fakeApi()
    const plain = await mount()
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    expect(key(plain, 'connect-linkedin')?.hasAttribute('aria-expanded')).toBe(false)
    key(plain, 'connect-linkedin')?.click()
    expect(chooser(plain)).toBeNull()
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: {} }]))
    document.body.replaceChildren()

    api = withPages()
    const element = await mount()
    const connect = key(element, 'connect-linkedin')
    expect(connect?.getAttribute('aria-expanded')).toBe('false')
    expect(connect?.getAttribute('aria-controls')).toBe('choose-linkedin')
    connect?.click()
    const group = chooser(element)
    expect(group?.getAttribute('role')).toBe('group')
    expect(group?.id).toBe('choose-linkedin')
    expect(key(element, 'connect-linkedin')?.getAttribute('aria-expanded')).toBe('true')
    const title = root(element).getElementById(group?.getAttribute('aria-labelledby') ?? '')
    expect(title?.textContent).toBe('What do you want to connect on LinkedIn?')
    expect(posts(api)).toEqual([])
    // Only LinkedIn asks: X connects straight away.
    expect(key(element, 'connect-x')?.hasAttribute('aria-expanded')).toBe(false)
  })

  it('names each choice for a screen reader, with its line as the description, and puts focus on the first', async () => {
    api = withPages()
    const element = await mount()
    key(element, 'connect-linkedin')?.focus()
    key(element, 'connect-linkedin')?.click()
    const personal = key(element, 'choose-linkedin-personal')
    const pages = key(element, 'choose-linkedin-pages')
    expect(root(element).activeElement).toBe(personal)
    const read = (button: HTMLButtonElement | null, attribute: string) => root(element).getElementById(button?.getAttribute(attribute) ?? '')?.textContent
    expect([read(personal, 'aria-labelledby'), read(personal, 'aria-describedby')]).toEqual(['Personal profile', 'Post as yourself.'])
    expect([read(pages, 'aria-labelledby'), read(pages, 'aria-describedby')]).toEqual(['Company page', 'Post as a page you admin.'])
    expect(personal?.querySelector('[part="option-icon"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(pages?.querySelector('svg')).not.toBeNull()
  })

  it('moves between the choices with the arrow keys, and closes on Escape with focus back on Connect', async () => {
    api = withPages()
    const element = await mount()
    key(element, 'connect-linkedin')?.focus()
    key(element, 'connect-linkedin')?.click()
    const personal = key(element, 'choose-linkedin-personal') as HTMLButtonElement
    keydown(personal, 'ArrowDown')
    expect(root(element).activeElement).toBe(key(element, 'choose-linkedin-pages'))
    keydown(key(element, 'choose-linkedin-pages') as HTMLButtonElement, 'ArrowRight')
    expect(root(element).activeElement).toBe(personal)
    keydown(personal, 'ArrowUp')
    expect(root(element).activeElement).toBe(key(element, 'choose-linkedin-pages'))
    keydown(key(element, 'choose-linkedin-pages') as HTMLButtonElement, 'Escape')
    expect(chooser(element)).toBeNull()
    expect(root(element).activeElement).toBe(key(element, 'connect-linkedin'))
    expect(posts(api)).toEqual([])
  })

  it('closes when Connect is pressed again or on Cancel', async () => {
    api = withPages()
    const element = await mount()
    key(element, 'connect-linkedin')?.click()
    key(element, 'connect-linkedin')?.click()
    expect(chooser(element)).toBeNull()
    key(element, 'connect-linkedin')?.click()
    key(element, 'cancel-linkedin')?.click()
    expect(chooser(element)).toBeNull()
  })

  it('sends variant pages for Company page and no variant for Personal profile', async () => {
    api = withPages()
    const element = await mount()
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    key(element, 'connect-linkedin')?.click()
    key(element, 'choose-linkedin-pages')?.click()
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
    expect(chooser(element)).toBeNull()
    expect(root(element).querySelector('[part="note"]')?.textContent).toContain('Finish signing in to LinkedIn')
    key(element, 'cancel-linkedin')?.click()
    await vi.waitFor(() => expect(key(element, 'connect-linkedin')?.disabled).toBe(false))
    key(element, 'connect-linkedin')?.click()
    key(element, 'choose-linkedin-personal')?.click()
    await vi.waitFor(() => expect(posts(api)).toHaveLength(2))
    expect(posts(api)[1]).toMatchObject({ path: '/v1/connect/linkedin', body: {} })
  })

  it('shows connected pages by name with a Page tag, and the profile without one', async () => {
    api = withPages()
    const person = api.account('linkedin', 'Ada Lovelace', { platformUserId: 'abc123' })
    const page = api.account('linkedin', 'Acme Studio', { platformUserId: PAGE_URN, displayName: 'Acme Studio' })
    const element = await mount()
    const row = (id: string) => root(element).querySelector(`[data-account="${id}"]`)
    expect(row(page.id)?.querySelector('[part="account-name"]')?.textContent).toBe('Acme Studio')
    expect(row(page.id)?.querySelector('[part="tag tag-page"]')?.textContent).toBe('Page')
    expect(row(page.id)?.querySelector('[part="account-username"]')).toBeNull()
    expect(row(person.id)?.querySelector('[part~="tag"]')).toBeNull()
  })

  it('takes its new words from labels, like the rest', async () => {
    api = withPages()
    api.account('linkedin', 'Acme', { platformUserId: PAGE_URN })
    const element = await mount({}, { labels: { chooseVariant: 'Quoi connecter sur {platform} ?', variantPersonal: 'Profil', variantPersonalDescription: 'En votre nom.', variantPages: 'Page entreprise', variantPagesDescription: 'Au nom d’une page.', pageTag: 'Page pro' } })
    key(element, 'connect-linkedin')?.click()
    expect(root(element).querySelector('[part="choose-title"]')?.textContent).toBe('Quoi connecter sur LinkedIn ?')
    expect(key(element, 'choose-linkedin-personal')?.textContent).toBe('ProfilEn votre nom.')
    expect(key(element, 'choose-linkedin-pages')?.textContent).toBe('Page entrepriseAu nom d’une page.')
    expect(root(element).querySelector('[part~="tag-page"]')?.textContent).toBe('Page pro')
  })

  it('shows LinkedIn and LinkedIn Page as two tiles with variants="tiles", each with its own accounts and connect', async () => {
    api = withPages()
    const person = api.account('linkedin', 'Ada Lovelace', { platformUserId: 'abc123' })
    const page = api.account('linkedin', 'Acme Studio', { platformUserId: PAGE_URN })
    const element = await mount({ variants: 'tiles' })
    const tiles = [...root(element).querySelectorAll<HTMLElement>('[data-platform="linkedin"]')]
    expect(tiles.map((tile) => [tile.querySelector('[part="name"]')?.textContent, tile.dataset['variant'] ?? null, tile.getAttribute('part')])).toEqual([
      ['LinkedIn', null, 'platform platform-linkedin'],
      ['LinkedIn Page', 'pages', 'platform platform-linkedin platform-linkedin-pages'],
    ])
    expect(tiles[0]?.querySelector(`[data-account="${person.id}"]`)).not.toBeNull()
    expect(tiles[0]?.querySelector(`[data-account="${page.id}"]`)).toBeNull()
    expect(tiles[1]?.querySelector(`[data-account="${page.id}"]`)).not.toBeNull()
    expect(tiles[1]?.querySelector('slot')?.getAttribute('name')).toBe('platform-linkedin-pages')

    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    key(element, 'connect-linkedin-pages')?.click()
    expect(chooser(element)).toBeNull()
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
    // The wait shows under the tile that started it.
    expect(tiles.length).toBe(2)
    const after = [...root(element).querySelectorAll<HTMLElement>('[data-platform="linkedin"]')]
    expect(after[1]?.querySelector('[part="note"]')).not.toBeNull()
    expect(after[0]?.querySelector('[part="note"]')).toBeNull()
    key(element, 'cancel-linkedin')?.click()
    await vi.waitFor(() => expect(key(element, 'connect-linkedin')?.disabled).toBe(false))
    key(element, 'connect-linkedin')?.click()
    await vi.waitFor(() => expect(posts(api)).toHaveLength(2))
    expect(posts(api)[1]).toMatchObject({ path: '/v1/connect/linkedin', body: {} })
  })

  it('draws one LinkedIn tile, as before, when the variant is not available, whatever variants says', async () => {
    api = fakeApi()
    const element = await mount({ variants: 'tiles' })
    expect([...root(element).querySelectorAll('[data-platform="linkedin"]')]).toHaveLength(1)
    expect(root(element).querySelector('[data-variant]')).toBeNull()
  })

  it('offers only the pages tile when only the pages app is set up', async () => {
    api = fakeApi({ connectable: ['x'], variants: { linkedin: ['pages'] } })
    const element = await mount()
    expect(root(element).querySelector('[data-platform="linkedin"] [part="name"]')?.textContent).toBe('LinkedIn Page')
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    key(element, 'connect-linkedin-pages')?.click()
    expect(chooser(element)).toBeNull()
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
  })

  it('connects pages from code with element.connect', async () => {
    api = withPages()
    const element = await mount()
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    element.connect('linkedin', { variant: 'pages' })
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
  })

  it('names every new piece with a part', async () => {
    api = withPages()
    api.account('linkedin', 'Acme', { platformUserId: PAGE_URN })
    const element = await mount()
    key(element, 'connect-linkedin')?.click()
    const unnamed = [...root(element).querySelectorAll('*')].filter((node) => !['STYLE', 'SLOT', 'path'].includes(node.tagName) && !node.hasAttribute('part'))
    expect(unnamed.map((node) => node.outerHTML.slice(0, 60))).toEqual([])
    const parts = new Set([...root(element).querySelectorAll('[part]')].flatMap((node) => (node.getAttribute('part') ?? '').split(' ')))
    for (const part of ['choose', 'choose-title', 'choose-options', 'button-option', 'button-option-personal', 'button-option-pages', 'option-icon', 'option-mark', 'option-text', 'option-name', 'option-description', 'tag', 'tag-page']) {
      expect(parts).toContain(part)
    }
  })
})

describe('React', () => {
  it('passes variants to the element', async () => {
    const api = withPages()
    vi.stubGlobal('fetch', api.fetch)
    const container = document.body.appendChild(document.createElement('div'))
    const ref = createRef<FlungConnectElement>()
    await act(async () => {
      createRoot(container).render(<FlungConnect ref={ref} token="flung_ct_a.b" variants="tiles" />)
    })
    expect(ref.current?.getAttribute('variants')).toBe('tiles')
    await vi.waitFor(() => expect(ref.current?.shadowRoot?.querySelector('[data-variant="pages"]')).not.toBeNull())
  })

  it('connects pages from useFlungConnect', async () => {
    const api = withPages()
    const container = document.body.appendChild(document.createElement('div'))
    let panel: UseFlungConnectResult | null = null
    function Panel() {
      panel = useFlungConnect({ token: 'flung_ct_a.b', fetch: api.fetch })
      return null
    }
    await act(async () => {
      createRoot(container).render(<Panel />)
    })
    await vi.waitFor(() => expect((panel as UseFlungConnectResult | null)?.loaded).toBe(true))
    vi.spyOn(window, 'open').mockReturnValue(fakePopup() as unknown as Window)
    await act(async () => {
      ;(panel as UseFlungConnectResult | null)?.connect('linkedin', { variant: 'pages' })
    })
    await vi.waitFor(() => expect(posts(api)).toMatchObject([{ path: '/v1/connect/linkedin', body: { variant: 'pages' } }]))
  })
})
