/**
 * The Flungie store: what a person can dress their Flungie in, what it costs, when it unlocks, and how points are earned. Plain data
 * and pure functions, so the server that keeps the wallets, the staff console that sets the prices and the app that shows the
 * shelf all read the same rules. A service keeps its own overrides (a price, a level, an item switched off) and passes them in.
 *
 * Items are the drawing's own options: accessories in each of their colours, pants, eyes, mouths, tattoos, piercings, body colours, speed
 * lines, shapes and auras, so whatever is sold draws exactly as a seed would have drawn it. A new item is one entry in its table (data.ts);
 * a new kind is one entry in `KINDS` and in `wear`.
 */
import {
  ACCESSORIES,
  type Accessory,
  type AccessorySlot,
  AURAS,
  byId,
  COLOURS,
  EYES,
  FACE_TATTOOS,
  HAIRS,
  LINE_PAIRS,
  MOUTHS,
  type Option,
  OUTFITS,
  PANTS,
  PATTERNS,
  PETS,
  PIERCINGS,
  SHAPES,
  slotOfAccessory,
  TATTOOS,
} from './data.js'
import { MOODS } from './expressions.js'
import { render, type RenderOptions } from './render.js'
import type { Traits } from './traits.js'

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
export type Rarity = (typeof RARITIES)[number]

/** What an item changes on the Flungie: the trait it sets. */
export const STORE_KINDS = ['accessory', 'pants', 'outfit', 'eyes', 'mouth', 'tattoo', 'faceTattoo', 'piercing', 'colour', 'lines', 'shape', 'aura', 'hair', 'pattern', 'pet', 'expression'] as const
export type StoreKind = (typeof STORE_KINDS)[number]

/** How the shelf is sorted for people: accessories split three ways (head, face, hand and gear), then one category for each other kind. */
export const STORE_CATEGORIES = [
  'headwear',
  'hair',
  'glasses',
  'gear',
  'outfits',
  'pants',
  'eyes',
  'mouths',
  'expressions',
  'tattoos',
  'piercings',
  'patterns',
  'colours',
  'trails',
  'shapes',
  'auras',
  'pets',
] as const
export type StoreCategory = (typeof STORE_CATEGORIES)[number]

/** The times of year an item is for, so a shelf can feature it when its time comes round. Most items are for any time. */
export const STORE_EVENTS = ['christmas', 'halloween', 'valentines', 'easter', 'stPatricks', 'newYear', 'lunarNewYear', 'spring', 'summer', 'autumn', 'winter', 'birthday'] as const
export type StoreEvent = (typeof STORE_EVENTS)[number]

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
  /** The time of year it is for, if any, so a shelf can feature it then. */
  event?: StoreEvent
  /** Earned, never sold: what it takes. The service grants it once `earnedItems` says the person has done it. */
  earn?: EarnRule
}

/** What earns an item that is never sold: a streak of days posting, a number of achievements, or a level. */
export type EarnRule = { kind: 'streak'; days: number } | { kind: 'achievements'; count: number } | { kind: 'level'; level: number }

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
  santaHat: { category: 'headwear', rarity: 'rare' },
  witchHat: { category: 'headwear', rarity: 'rare' },
  horns: { category: 'headwear', rarity: 'rare' },
  bunnyEars: { category: 'headwear', rarity: 'common' },
  antlers: { category: 'headwear', rarity: 'rare' },
  boppers: { category: 'headwear', rarity: 'common' },
  leprechaun: { category: 'headwear', rarity: 'rare' },
  cakeHat: { category: 'headwear', rarity: 'common' },
  pirateHat: { category: 'headwear', rarity: 'rare' },
  lantern: { category: 'headwear', rarity: 'rare' },
  glasses: { category: 'glasses', rarity: 'common' },
  sunglasses: { category: 'glasses', rarity: 'rare' },
  headphones: { category: 'gear', rarity: 'common' },
  pencil: { category: 'gear', rarity: 'common' },
  megaphone: { category: 'gear', rarity: 'rare' },
  plane: { category: 'gear', rarity: 'rare' },
  coffee: { category: 'gear', rarity: 'common' },
  phone: { category: 'gear', rarity: 'common' },
  balloon: { category: 'gear', rarity: 'common' },
  sign: { category: 'gear', rarity: 'rare' },
  iceCream: { category: 'gear', rarity: 'common' },
  bouquet: { category: 'gear', rarity: 'rare' },
  trophy: { category: 'gear', rarity: 'rare' },
  laurel: { category: 'headwear', rarity: 'epic' },
  starCrown: { category: 'headwear', rarity: 'legendary' },
}

/**
 * Every kind but accessories: its table, category, the word its items are labelled with, and the rarer options (the rest are
 * common). Options a Flungie can have no way of showing (a mouth of none) are left off the shelf.
 */
const KINDS: Readonly<Record<Exclude<StoreKind, 'accessory'>, { table: readonly Option[]; category: StoreCategory; noun: string; skip?: readonly string[]; rarer: Readonly<Record<string, Rarity>> }>> = {
  eyes: { table: EYES, category: 'eyes', noun: 'Eyes', rarer: { wink: 'rare', wide: 'rare', happy: 'rare' } },
  mouth: { table: MOUTHS, category: 'mouths', noun: 'Mouth', skip: ['none'], rarer: { cat: 'rare', grin: 'rare' } },
  tattoo: { table: TATTOOS, category: 'tattoos', noun: 'Tattoo', skip: ['none'], rarer: { bolt: 'rare', flower: 'rare', note: 'rare', flame: 'epic', anchor: 'epic' } },
  // Face tattoos share the tattoo shelf, as a kind of their own, so one is worn with a body tattoo.
  faceTattoo: { table: FACE_TATTOOS, category: 'tattoos', noun: 'Face tattoo', skip: ['none'], rarer: { star: 'rare', bolt: 'rare', sparkle: 'rare', whiskers: 'rare', teardrop: 'epic' } },
  piercing: {
    table: PIERCINGS,
    category: 'piercings',
    noun: 'Piercing',
    skip: ['none'],
    rarer: { septum: 'rare', browRing: 'rare', snakebites: 'rare', dimples: 'rare', bridge: 'epic', faceGem: 'epic' },
  },
  colour: { table: COLOURS, category: 'colours', noun: 'Body', rarer: { cloud: 'rare', berry: 'rare', plum: 'rare', ink: 'epic' } },
  lines: { table: LINE_PAIRS, category: 'trails', noun: 'Trail', rarer: { dusk: 'rare', ember: 'rare', twilight: 'rare' } },
  shape: { table: SHAPES, category: 'shapes', noun: 'Shape', rarer: { wobbly: 'rare', puffy: 'epic' } },
  pants: { table: PANTS, category: 'pants', noun: 'Pants', skip: ['none'], rarer: { polka: 'rare', jeans: 'rare', plaid: 'rare', tutu: 'epic', gold: 'legendary' } },
  outfit: {
    table: OUTFITS,
    category: 'outfits',
    noun: 'Outfit',
    skip: ['none'],
    rarer: {
      festive: 'rare',
      sundress: 'rare',
      santa: 'epic',
      ghost: 'epic',
      pumpkin: 'rare',
      skeleton: 'epic',
      vampire: 'legendary',
      mummy: 'epic',
      tuxedo: 'rare',
      aloha: 'rare',
      sweetheart: 'rare',
      bee: 'rare',
      frog: 'rare',
      bear: 'rare',
      bunny: 'rare',
      fairy: 'epic',
      superhero: 'epic',
      wizard: 'epic',
      dinosaur: 'rare',
      cat: 'rare',
      shark: 'rare',
      penguin: 'rare',
      unicorn: 'epic',
      pirate: 'rare',
      astronaut: 'epic',
      newYearJacket: 'rare',
      dragon: 'legendary',
    },
  },
  aura: {
    table: AURAS,
    category: 'auras',
    noun: 'Aura',
    skip: ['none'],
    rarer: { glow: 'rare', bubbles: 'rare', hearts: 'epic', sparkles: 'epic', orbit: 'epic', halo: 'legendary', prism: 'legendary', snow: 'rare', leaves: 'rare', blossoms: 'rare', bats: 'epic', confetti: 'epic', fireworks: 'legendary' },
  },
  hair: { table: HAIRS, category: 'hair', noun: 'Hair', skip: ['none'], rarer: { mohawk: 'rare', curls: 'rare', pigtails: 'rare', rainbow: 'epic' } },
  pattern: { table: PATTERNS, category: 'patterns', noun: 'Pattern', skip: ['none'], rarer: { ombre: 'rare', stars: 'rare', hearts: 'rare', galaxy: 'legendary' } },
  pet: { table: PETS, category: 'pets', noun: 'Pet', skip: ['none'], rarer: { bird: 'rare', ghost: 'rare', star: 'epic', mini: 'epic', bee: 'rare', cloud: 'rare', owl: 'epic' } },
  expression: { table: MOODS, category: 'expressions', noun: 'Mood', skip: ['neutral'], rarer: { cute: 'rare', mad: 'rare', thinking: 'rare', sleepy: 'rare' } },
}

/**
 * Items that are earned, never sold, by accessory id or `kind:value`, with what earns each. They cost nothing and open at level
 * 1; `availability` says 'earn' until the service grants them, which it does when `earnedItems` lists them.
 */
const EARNED: Readonly<Record<string, EarnRule>> = {
  laurel: { kind: 'streak', days: 30 },
  starCrown: { kind: 'streak', days: 100 },
  trophy: { kind: 'achievements', count: 10 },
  'pet:owl': { kind: 'achievements', count: 50 },
  'hair:rainbow': { kind: 'level', level: 15 },
  'pattern:galaxy': { kind: 'level', level: 25 },
}

/** `{ earn, level: 1, price: 0 }` when the item is earned, else nothing. */
const earnOf = (key: string): { earn?: EarnRule; level?: number; price?: number } => {
  const earn = EARNED[key]
  return earn === undefined ? {} : { earn, level: 1, price: 0 }
}

/** Each seasonal item's event, by accessory id or by `kind:value`. */
const EVENT_OF: Readonly<Record<string, StoreEvent>> = {
  santaHat: 'christmas',
  antlers: 'christmas',
  'outfit:festive': 'christmas',
  'outfit:santa': 'christmas',
  'aura:snow': 'winter',
  'outfit:scarf': 'winter',
  witchHat: 'halloween',
  horns: 'halloween',
  'outfit:ghost': 'halloween',
  'outfit:pumpkin': 'halloween',
  'outfit:skeleton': 'halloween',
  'outfit:vampire': 'halloween',
  'outfit:mummy': 'halloween',
  'outfit:wizard': 'halloween',
  'aura:bats': 'halloween',
  boppers: 'valentines',
  'outfit:sweetheart': 'valentines',
  'aura:hearts': 'valentines',
  bunnyEars: 'easter',
  'outfit:bunny': 'easter',
  leprechaun: 'stPatricks',
  lantern: 'lunarNewYear',
  'outfit:newYearJacket': 'lunarNewYear',
  'outfit:dragon': 'lunarNewYear',
  'aura:fireworks': 'newYear',
  'outfit:tuxedo': 'newYear',
  'aura:blossoms': 'spring',
  'outfit:bee': 'spring',
  'outfit:raincoat': 'spring',
  'outfit:sundress': 'summer',
  'outfit:aloha': 'summer',
  'aura:leaves': 'autumn',
  'outfit:jumper': 'autumn',
  partyHat: 'birthday',
  'aura:confetti': 'birthday',
  cakeHat: 'birthday',
}

/** `{ event }` when the item has one, else nothing, so an item for any time carries no key. */
const eventOf = (key: string): { event?: StoreEvent } => {
  const event = EVENT_OF[key]
  return event === undefined ? {} : { event }
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
      ...eventOf(accessory.id),
      ...earnOf(accessory.id),
    }
  }),
)

const traitItems: readonly StoreItem[] = (Object.keys(KINDS) as Exclude<StoreKind, 'accessory'>[]).flatMap((kind) => {
  const { table, category, noun, skip = [], rarer } = KINDS[kind]
  return table
    .filter((option) => !skip.includes(option.id))
    .map((option) => {
      const rarity = rarer[option.id] ?? 'common'
      return { id: `${kind}:${option.id}`, kind, category, value: option.id, colour: null, label: `${noun}, ${option.label}`, rarity, ...RARITY_DEFAULTS[rarity], enabled: true, ...eventOf(`${kind}:${option.id}`), ...earnOf(`${kind}:${option.id}`) }
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
  /** The longest current streak of days posting among the person's workspaces, for earned items. Absent: 0. */
  streakDays?: number
}

/** Whether what a person has done meets an earned item's rule. */
export function meetsEarn(rule: EarnRule, facts: Pick<EarnFacts, 'level' | 'achievements' | 'streakDays'>): boolean {
  if (rule.kind === 'streak') return (facts.streakDays ?? 0) >= rule.days
  if (rule.kind === 'achievements') return facts.achievements >= rule.count
  return facts.level >= rule.level
}

/**
 * The earned items a person has earned, from what they have done: the ones the service should grant them (it grants any not
 * yet owned). Items switched off are left out.
 */
export function earnedItems(facts: Pick<EarnFacts, 'level' | 'achievements' | 'streakDays'>, items: readonly StoreItem[] = DEFAULT_STORE): StoreItem[] {
  return items.filter((item) => item.enabled && item.earn !== undefined && meetsEarn(item.earn, facts))
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

/** 'earn': never sold, earned by doing what `item.earn` says; the service grants it then. */
export type Availability = 'owned' | 'available' | 'level' | 'points' | 'off' | 'earn'

/** Whether a person can have an item: owned, available to buy, or what stands in the way. */
export function availability(item: StoreItem, wallet: Wallet, level: number): Availability {
  if (wallet.owned.includes(item.id)) return 'owned'
  if (!item.enabled) return 'off'
  if (item.earn !== undefined) return 'earn'
  if (level < item.level) return 'level'
  if (balance(wallet) < item.price) return 'points'
  return 'available'
}

/** The trait each kind sets. */
const TRAIT_OF: Readonly<Record<Exclude<StoreKind, 'accessory'>, keyof Traits>> = {
  hair: 'hair',
  pattern: 'pattern',
  pet: 'pet',
  expression: 'mood',
  pants: 'pants',
  outfit: 'outfit',
  eyes: 'eyes',
  mouth: 'mouth',
  tattoo: 'tattoo',
  faceTattoo: 'faceTattoo',
  piercing: 'piercing',
  colour: 'colour',
  lines: 'lines',
  shape: 'shape',
  aura: 'aura',
}

/** The trait and colour trait each accessory slot fills when an item is put on. */
const SLOT_TRAITS: Readonly<Record<AccessorySlot, ['accessory' | 'eyewear' | 'held', 'accColour' | 'eyewearColour' | 'heldColour']>> = {
  head: ['accessory', 'accColour'],
  face: ['eyewear', 'eyewearColour'],
  hand: ['held', 'heldColour'],
}

/**
 * What an item takes up on a Flungie: `accessory:head`, `accessory:face` or `accessory:hand` for an accessory, else its kind.
 * A Flungie wears one item in each, so a list of items to wear has each of these once at most.
 */
export function slotOf(item: Pick<StoreItem, 'kind' | 'value'>): string {
  return item.kind === 'accessory' ? `accessory:${slotOfAccessory(item.value)}` : item.kind
}

function wear(traits: Traits, item: Wearable): Traits {
  if (item.kind === 'accessory') {
    const accessory = byId(ACCESSORIES, item.value)
    if (accessory === undefined) return traits
    const [trait, colour] = SLOT_TRAITS[slotOfAccessory(accessory.id)]
    return { ...traits, [trait]: accessory.id, [colour]: item.colour }
  }
  const kind = KINDS[item.kind]
  if (kind === undefined || byId(kind.table, item.value) === undefined) return traits
  return { ...traits, [TRAIT_OF[item.kind]]: item.value }
}

const BARE = { accessory: 'none', accColour: null, eyewear: 'none', eyewearColour: null, held: 'none', heldColour: null } as const

/**
 * A Flungie wearing one item or several (one in each slot, `slotOf`; a later one in a slot wins): its traits with theirs, every
 * other trait its own. Accessories put on take the place of the seed's own: a hat, glasses and something held are worn together,
 * each in its slot. null takes the seed's accessory off. Eyes put on show: the seed's own sunglasses come off unless an accessory
 * is worn too; hair put on shows the same way, the seed's own hat coming off.
 */
export function dress(traits: Traits, wearing: Wearable | readonly Wearable[] | null): Traits {
  if (wearing === null) return { ...traits, ...BARE }
  const items: readonly Wearable[] = Array.isArray(wearing) ? (wearing as readonly Wearable[]) : [wearing as Wearable]
  const start = items.some((item) => item.kind === 'accessory' && byId(ACCESSORIES, item.value) !== undefined) ? { ...traits, ...BARE } : { ...traits }
  let dressed = items.reduce(wear, start)
  if (dressed.accessory === 'sunglasses' && items.some((item) => item.kind === 'eyes') && !items.some((item) => item.kind === 'accessory')) {
    dressed = { ...dressed, accessory: 'none', accColour: null }
  }
  // Hair put on shows: the seed's own hat comes off unless an accessory is worn too (one put on is the person's choice).
  const wornAccessory = items.some((item) => item.kind === 'accessory')
  if (items.some((item) => item.kind === 'hair') && !wornAccessory && slotOfAccessory(dressed.accessory) === 'head' && !['none', 'halo'].includes(dressed.accessory)) {
    dressed = { ...dressed, accessory: 'none', accColour: null }
  }
  return dressed
}

/** An SVG of a Flungie wearing an item (or several), for a shelf or a preview. */
export function preview(traits: Traits, wearing: Wearable | readonly Wearable[] | null, options: RenderOptions = {}): string {
  return render(dress(traits, wearing), { size: 160, variant: 'bare', ...options })
}
