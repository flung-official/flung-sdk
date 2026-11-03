/**
 * The Flungie store: what a person can dress their Flungie in, what it costs, when it unlocks, and how points are earned. Plain data
 * and pure functions, so the server that keeps the wallets, the staff console that sets the prices and the app that shows the
 * shelf all read the same rules. A service keeps its own overrides (a price, a level, an item switched off) and passes them in.
 *
 * Items are the drawing's own options: accessories in each of their colours, pants, eyes, mouths, tattoos, body colours, speed
 * lines, shapes and auras, so whatever is sold draws exactly as a seed would have drawn it. A new item is one entry in its table (data.ts);
 * a new kind is one entry in `KINDS` and in `wear`.
 */
import { ACCESSORIES, type Accessory, AURAS, byId, COLOURS, EYES, LINE_PAIRS, MOUTHS, type Option, PANTS, SHAPES, TATTOOS } from './data.js'
import { render, type RenderOptions } from './render.js'
import type { Traits } from './traits.js'

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
export type Rarity = (typeof RARITIES)[number]

/** What an item changes on the Flungie: the trait it sets. */
export const STORE_KINDS = ['accessory', 'pants', 'eyes', 'mouth', 'tattoo', 'colour', 'lines', 'shape', 'aura'] as const
export type StoreKind = (typeof STORE_KINDS)[number]

/** How the shelf is sorted for people: accessories split three ways, then one category for each other kind. */
export const STORE_CATEGORIES = ['headwear', 'glasses', 'gear', 'pants', 'eyes', 'mouths', 'tattoos', 'colours', 'trails', 'shapes', 'auras'] as const
export type StoreCategory = (typeof STORE_CATEGORIES)[number]

export interface StoreItem {
  /** Stable: wallets and overrides keep it. `accessory:colour` for an accessory (`crown:gold`), else `kind:value` (`tattoo:heart`). */
  id: string
  kind: StoreKind
  category: StoreCategory
  /** The option it puts on: an id from ACCESSORIES, EYES, MOUTHS, TATTOOS, COLOURS, LINE_PAIRS or SHAPES, by kind. */
  value: string
  /** An accessory's colour (ACC_COLOURS); null for every other kind. */
  colour: string | null
  label: string
  rarity: Rarity
  /** The level a workspace must reach before it can be bought. 1 is from the start. */
  level: number
  /** Points it costs. 0 is free once its level is reached. */
  price: number
  /** Off: not on the shelf. Owned ones stay owned and wearable. */
  enabled: boolean
}

/** What it takes to draw an item on a Flungie. */
export type Wearable = Pick<StoreItem, 'kind' | 'value' | 'colour'>

/** What a service may change about an item. Anything left out keeps the default. */
export type StoreOverride = Partial<Pick<StoreItem, 'level' | 'price' | 'enabled' | 'rarity'>>

/** Points earned for what a person's workspaces have done. */
export interface EarnRules {
  /** For each post published. */
  perPost: number
  /** For each level reached above the first. */
  perLevel: number
  /** For each achievement unlocked. */
  perAchievement: number
}

export const DEFAULT_EARN_RULES: EarnRules = { perPost: 5, perLevel: 50, perAchievement: 25 }

/** By rarity: the level an item opens at and its price, unless a service sets its own. */
const RARITY_DEFAULTS: Readonly<Record<Rarity, { level: number; price: number }>> = {
  common: { level: 1, price: 100 },
  rare: { level: 5, price: 300 },
  epic: { level: 10, price: 750 },
  legendary: { level: 20, price: 2000 },
}

/** Each accessory's category and rarity. The first colour of each is its signature, a step rarer. */
const ACCESSORY_SHELF: Readonly<Record<string, { category: StoreCategory; rarity: Rarity }>> = {
  beanie: { category: 'headwear', rarity: 'common' },
  cap: { category: 'headwear', rarity: 'common' },
  capBack: { category: 'headwear', rarity: 'common' },
  bow: { category: 'headwear', rarity: 'common' },
  partyHat: { category: 'headwear', rarity: 'rare' },
  antenna: { category: 'headwear', rarity: 'rare' },
  halo: { category: 'headwear', rarity: 'epic' },
  crown: { category: 'headwear', rarity: 'legendary' },
  glasses: { category: 'glasses', rarity: 'common' },
  sunglasses: { category: 'glasses', rarity: 'rare' },
  headphones: { category: 'gear', rarity: 'common' },
  pencil: { category: 'gear', rarity: 'common' },
  megaphone: { category: 'gear', rarity: 'rare' },
  plane: { category: 'gear', rarity: 'rare' },
}

/**
 * Every kind but accessories: its table, category, the word its items are labelled with, and the rarer options (the rest are
 * common). Options a Flungie can have no way of showing (a mouth of none) are left off the shelf.
 */
const KINDS: Readonly<Record<Exclude<StoreKind, 'accessory'>, { table: readonly Option[]; category: StoreCategory; noun: string; skip?: readonly string[]; rarer: Readonly<Record<string, Rarity>> }>> = {
  eyes: { table: EYES, category: 'eyes', noun: 'Eyes', rarer: { wink: 'rare', wide: 'rare', happy: 'rare' } },
  mouth: { table: MOUTHS, category: 'mouths', noun: 'Mouth', skip: ['none'], rarer: { cat: 'rare', grin: 'rare' } },
  tattoo: { table: TATTOOS, category: 'tattoos', noun: 'Tattoo', skip: ['none'], rarer: { bolt: 'rare', flower: 'rare', note: 'rare', flame: 'epic', anchor: 'epic' } },
  colour: { table: COLOURS, category: 'colours', noun: 'Body', rarer: { cloud: 'rare', berry: 'rare', plum: 'rare', ink: 'epic' } },
  lines: { table: LINE_PAIRS, category: 'trails', noun: 'Trail', rarer: { dusk: 'rare', ember: 'rare', twilight: 'rare' } },
  shape: { table: SHAPES, category: 'shapes', noun: 'Shape', rarer: { wobbly: 'rare', puffy: 'epic' } },
  pants: { table: PANTS, category: 'pants', noun: 'Pants', skip: ['none'], rarer: { polka: 'rare', jeans: 'rare', plaid: 'rare', tutu: 'epic', gold: 'legendary' } },
  aura: {
    table: AURAS,
    category: 'auras',
    noun: 'Aura',
    skip: ['none'],
    rarer: { glow: 'rare', bubbles: 'rare', hearts: 'epic', sparkles: 'epic', orbit: 'epic', halo: 'legendary', prism: 'legendary' },
  },
}

const STEP_UP: Readonly<Record<Rarity, Rarity>> = { common: 'rare', rare: 'epic', epic: 'legendary', legendary: 'legendary' }

const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

const accessoryItems: readonly StoreItem[] = ACCESSORIES.filter((accessory) => accessory.id !== 'none').flatMap((accessory: Accessory) =>
  accessory.colours.map((colour, index) => {
    const shelf = ACCESSORY_SHELF[accessory.id] ?? { category: 'gear' as const, rarity: 'common' as const }
    const rarity = index === 0 && accessory.colours.length > 1 ? STEP_UP[shelf.rarity] : shelf.rarity
    return {
      id: `${accessory.id}:${colour}`,
      kind: 'accessory' as const,
      category: shelf.category,
      value: accessory.id,
      colour,
      label: `${accessory.label}, ${titleCase(colour)}`,
      rarity,
      ...RARITY_DEFAULTS[rarity],
      enabled: true,
    }
  }),
)

const traitItems: readonly StoreItem[] = (Object.keys(KINDS) as Exclude<StoreKind, 'accessory'>[]).flatMap((kind) => {
  const { table, category, noun, skip = [], rarer } = KINDS[kind]
  return table
    .filter((option) => !skip.includes(option.id))
    .map((option) => {
      const rarity = rarer[option.id] ?? 'common'
      return { id: `${kind}:${option.id}`, kind, category, value: option.id, colour: null, label: `${noun}, ${option.label}`, rarity, ...RARITY_DEFAULTS[rarity], enabled: true }
    })
})

/** Every item, in shelf order: by category, then as each table lists them. */
export const DEFAULT_STORE: readonly StoreItem[] = STORE_CATEGORIES.flatMap((category) => [...accessoryItems, ...traitItems].filter((item) => item.category === category))

/** The shelf as a service runs it: the defaults with its overrides laid over them. Unknown override ids are ignored. */
export function storeItems(overrides: Readonly<Record<string, StoreOverride>> = {}, base: readonly StoreItem[] = DEFAULT_STORE): StoreItem[] {
  return base.map((item) => ({ ...item, ...(overrides[item.id] ?? {}) }))
}

export interface EarnFacts {
  publishedPosts: number
  /** The highest level among the person's workspaces. */
  level: number
  achievements: number
}

/** Points earned from what has been done. Never negative. */
export function pointsEarned(facts: EarnFacts, rules: EarnRules = DEFAULT_EARN_RULES): number {
  return Math.max(0, facts.publishedPosts * rules.perPost + Math.max(0, facts.level - 1) * rules.perLevel + facts.achievements * rules.perAchievement)
}

export interface Wallet {
  /** Earned by the rules. */
  earned: number
  /** Added or taken away by staff, in points. */
  adjustment: number
  /** Spent on items. */
  spent: number
  owned: readonly string[]
}

/** What a person can spend now. */
export function balance(wallet: Wallet): number {
  return Math.max(0, wallet.earned + wallet.adjustment - wallet.spent)
}

export type Availability = 'owned' | 'available' | 'level' | 'points' | 'off'

/** Whether a person can have an item: owned, available to buy, or what stands in the way. */
export function availability(item: StoreItem, wallet: Wallet, level: number): Availability {
  if (wallet.owned.includes(item.id)) return 'owned'
  if (!item.enabled) return 'off'
  if (level < item.level) return 'level'
  if (balance(wallet) < item.price) return 'points'
  return 'available'
}

/** The trait each kind sets. */
const TRAIT_OF: Readonly<Record<Exclude<StoreKind, 'accessory'>, keyof Traits>> = {
  pants: 'pants',
  eyes: 'eyes',
  mouth: 'mouth',
  tattoo: 'tattoo',
  colour: 'colour',
  lines: 'lines',
  shape: 'shape',
  aura: 'aura',
}

function wear(traits: Traits, item: Wearable): Traits {
  if (item.kind === 'accessory') {
    const accessory = byId(ACCESSORIES, item.value)
    return accessory === undefined ? traits : { ...traits, accessory: accessory.id, accColour: item.colour }
  }
  const kind = KINDS[item.kind]
  if (kind === undefined || byId(kind.table, item.value) === undefined) return traits
  return { ...traits, [TRAIT_OF[item.kind]]: item.value }
}

/**
 * A Flungie wearing one item or several (one of each kind; a later one of a kind wins): its traits with theirs, every other
 * trait its own. null takes the seed's accessory off. Eyes put on show: the seed's own sunglasses come off unless an accessory
 * is worn too.
 */
export function dress(traits: Traits, wearing: Wearable | readonly Wearable[] | null): Traits {
  if (wearing === null) return { ...traits, accessory: 'none', accColour: null }
  const items: readonly Wearable[] = Array.isArray(wearing) ? (wearing as readonly Wearable[]) : [wearing as Wearable]
  let dressed = items.reduce(wear, { ...traits })
  if (dressed.accessory === 'sunglasses' && items.some((item) => item.kind === 'eyes') && !items.some((item) => item.kind === 'accessory')) {
    dressed = { ...dressed, accessory: 'none', accColour: null }
  }
  return dressed
}

/** An SVG of a Flungie wearing an item (or several), for a shelf or a preview. */
export function preview(traits: Traits, wearing: Wearable | readonly Wearable[] | null, options: RenderOptions = {}): string {
  return render(dress(traits, wearing), { size: 160, variant: 'bare', ...options })
}
