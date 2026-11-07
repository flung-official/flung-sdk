// The trait tables. Order and weights are part of every seed's output: append, never reorder, reweight or remove
// (BUILDING.md, "Adding a trait").

import { MOODS } from './expressions.js'

export interface Option {
  readonly id: string
  readonly label: string
  readonly weight?: number
}

export interface Colour extends Option {
  /** `#RRGGBB`. */
  readonly hex: string
  /** Discs this body may sit on in the light theme: keys of DISCS, or `#RRGGBB`. */
  readonly light: readonly string[]
  /** Discs this body may sit on in the dark theme: keys of DISCS, or `#RRGGBB`. */
  readonly dark: readonly string[]
}

export interface Shape extends Option {
  /** Half width and half height, in units of the 100 unit square. */
  readonly hw: number
  readonly hh: number
  /** Superellipse exponent: 2 is an ellipse, higher is squarer. */
  readonly n: number
  readonly wobble: number
  readonly lobes?: number
  readonly puff?: number
}

/**
 * Where an accessory is worn. A Flungie wears one in each at once: a hat, glasses and something in its hand. Absent on an
 * accessory: 'head'.
 */
export type AccessorySlot = 'head' | 'face' | 'hand'
export const ACCESSORY_SLOTS: readonly AccessorySlot[] = ['head', 'face', 'hand']

export interface Accessory extends Option {
  /** Preferred colours, keys of ACC_COLOURS, tried in order from a seeded start. */
  readonly colours: readonly string[]
  /** Where it is worn. Absent: 'head'. */
  readonly slot?: AccessorySlot
  /** Covers the top of the head, so the eyes sit lower. */
  readonly hat?: boolean
  /** Sits above the head, against the disc, so its colour must stand clear of both themes' discs too. */
  readonly above?: boolean
}

export interface LinePair extends Option {
  readonly top: string
  readonly bottom: string
}

export const INK = '#16141C'
export const PAPER = '#F7F6F3'
export const WHITE = '#FFFFFF'

/** Body colours. Each has a light-theme and a dark-theme list of background discs it is allowed to sit on. */
export const COLOURS: readonly Colour[] = [
  { id: 'peach', label: 'Peach', hex: '#FFA584', weight: 1.3, light: ['skyT', 'butterT', 'peachT', 'lilacT'], dark: ['inkD', 'oceanD', 'plumD'] },
  { id: 'sky', label: 'Sky', hex: '#86C0FF', weight: 1.3, light: ['peachT', 'butterT', 'skyT', 'mintT'], dark: ['inkD', 'plumD', 'oceanD'] },
  { id: 'butter', label: 'Butter', hex: '#FFD66E', light: ['periM', 'lilacM', 'coralM'], dark: ['inkD', 'plumD', 'oceanD', 'mossD'] },
  { id: 'mint', label: 'Mint', hex: '#8EDDB5', light: ['lilacM', 'periM', 'coralM'], dark: ['inkD', 'plumD', 'mossD'] },
  { id: 'lilac', label: 'Lilac', hex: '#BFA4FF', light: ['butterT', 'mintT', 'lilacT', 'peachT'], dark: ['inkD', 'plumD', 'oceanD'] },
  { id: 'coral', label: 'Coral', hex: '#FF7E6E', light: ['skyT', 'butterT', 'mintT', 'roseT'], dark: ['inkD', 'oceanD', 'berryD'] },
  { id: 'sand', label: 'Sand', hex: '#E6C9A0', weight: 0.8, light: ['periM', 'coralM', 'lilacM'], dark: ['inkD', 'rustD', 'oceanD'] },
  { id: 'cloud', label: 'Cloud', hex: '#ECEAF2', weight: 0.8, light: ['periM', 'coralM', 'lilacM', 'mintM'], dark: ['plumD', 'oceanD', 'inkD'] },
  { id: 'ink', label: 'Ink', hex: '#2B2834', weight: 0.8, light: ['peachT', 'skyT', 'butterT', 'mintT', 'lilacT'], dark: ['skyDim', 'peachDim', 'lilacDim', 'mintDim'] },
  { id: 'ocean', label: 'Ocean', hex: '#3F7EDB', weight: 0.9, light: ['peachT', 'butterT', 'skyT', 'sandT'], dark: ['inkD', 'plumD', 'mossD'] },
  { id: 'moss', label: 'Moss', hex: '#4E9A73', weight: 0.9, light: ['butterT', 'peachT', 'mintT', 'sandT'], dark: ['inkD', 'plumD', 'oceanD'] },
  { id: 'plum', label: 'Plum', hex: '#7457C9', weight: 0.9, light: ['butterT', 'mintT', 'lilacT', 'peachT'], dark: ['inkD', 'mossD', 'oceanD'] },
  { id: 'berry', label: 'Berry', hex: '#D2457E', weight: 0.9, light: ['skyT', 'butterT', 'roseT', 'mintT'], dark: ['inkD', 'plumD', 'oceanD'] },
  { id: 'rust', label: 'Rust', hex: '#C9643B', weight: 0.9, light: ['skyT', 'butterT', 'sandT', 'peachT'], dark: ['inkD', 'oceanD', 'mossD'] },
]

/** Background discs: tints for the light ground, deep tones for the dark one, and mid tones where the body needs them. */
export const DISCS: Readonly<Record<string, string>> = {
  peachT: '#FFE6DA', skyT: '#DCEBFF', butterT: '#FFF1C7', mintT: '#DAF3E6', lilacT: '#EAE2FF', roseT: '#FFE0E8', sandT: '#F2E6D3',
  periM: '#8FA9EC', lilacM: '#A891EC', coralM: '#F39380', mintM: '#6FC79F',
  inkD: '#221F2B', oceanD: '#172A45', plumD: '#2A2242', mossD: '#162E27', berryD: '#381B2C', rustD: '#38231A',
  skyDim: '#4F6E9C', peachDim: '#9A6150', lilacDim: '#6C5D9E', mintDim: '#4A7D66',
}

/** Accessory colours. Bodies count too, plus a few that only accessories wear. */
export const ACC_COLOURS: readonly (Option & { readonly hex: string })[] = [
  ...COLOURS.map(({ id, label, hex }) => ({ id, label, hex })),
  { id: 'paper', label: 'Paper', hex: '#FFFFFF' },
  { id: 'gold', label: 'Gold', hex: '#F5BC3C' },
  { id: 'rose', label: 'Rose', hex: '#FF8FA8' },
  { id: 'night', label: 'Night', hex: '#1E1C27' },
  { id: 'red', label: 'Red', hex: '#D9363E' },
]
export const ACC: Readonly<Record<string, string>> = Object.fromEntries(ACC_COLOURS.map((c) => [c.id, c.hex]))

/** The speed lines: upper colour, lower colour. */
export const LINE_PAIRS: readonly LinePair[] = [
  { id: 'brand', label: 'Peach and sky', top: '#FFA584', bottom: '#86C0FF', weight: 2 },
  { id: 'sunset', label: 'Butter and coral', top: '#FFD66E', bottom: '#FF7E6E' },
  { id: 'lagoon', label: 'Mint and sky', top: '#8EDDB5', bottom: '#86C0FF' },
  { id: 'dusk', label: 'Lilac and peach', top: '#BFA4FF', bottom: '#FFA584' },
  { id: 'ember', label: 'Coral and butter', top: '#FF7E6E', bottom: '#FFD66E' },
  { id: 'twilight', label: 'Sky and lilac', top: '#86C0FF', bottom: '#BFA4FF' },
]

export const SHAPES: readonly Shape[] = [
  { id: 'classic', label: 'Classic', hw: 27, hh: 18.5, n: 3.4, wobble: 0.5, weight: 1.6 },
  { id: 'round', label: 'Round', hw: 24, hh: 21, n: 2.3, wobble: 0.4 },
  { id: 'squat', label: 'Squat', hw: 29.5, hh: 15.5, n: 3.8, wobble: 0.4 },
  { id: 'tall', label: 'Tall', hw: 21.5, hh: 23.5, n: 3, wobble: 0.4 },
  { id: 'wobbly', label: 'Wobbly', hw: 26, hh: 19, n: 2.9, wobble: 1.9 },
  { id: 'puffy', label: 'Puffy', hw: 25.5, hh: 19.5, n: 3, wobble: 0.3, lobes: 10, puff: 1.4 },
]

export const EYES: readonly Option[] = [
  { id: 'dots', label: 'Dots', weight: 2 },
  { id: 'ovals', label: 'Ovals', weight: 1.5 },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'wink', label: 'Wink', weight: 0.8 },
  { id: 'wide', label: 'Wide', weight: 1.2 },
  { id: 'happy', label: 'Happy arcs' },
]

export const MOUTHS: readonly Option[] = [
  { id: 'none', label: 'None', weight: 3 },
  { id: 'smile', label: 'Smile', weight: 3 },
  { id: 'o', label: 'Little o' },
  { id: 'cat', label: 'Cat', weight: 1.5 },
  { id: 'grin', label: 'Grin', weight: 1.5 },
]

// colours: the accessory's preferred colours in order; the first that stands clear of the body (and, for those that sit
// above the head, of both discs) wins, starting from a seeded place in the list. hat: covers the top, so the eyes sit lower.
export const ACCESSORIES: readonly Accessory[] = [
  { id: 'none', label: 'None', weight: 1.6, colours: [] },
  { id: 'headphones', label: 'Headphones', colours: ['night', 'paper', 'coral', 'ocean', 'lilac', 'mint'] },
  { id: 'beanie', label: 'Beanie', hat: true, colours: ['coral', 'ocean', 'mint', 'butter', 'berry', 'lilac', 'night'] },
  { id: 'cap', label: 'Cap, forward', hat: true, colours: ['ocean', 'coral', 'night', 'butter', 'moss', 'berry'] },
  { id: 'capBack', label: 'Cap, backward', hat: true, colours: ['night', 'coral', 'sky', 'moss', 'plum', 'butter'] },
  { id: 'sunglasses', label: 'Sunglasses', slot: 'face', colours: ['night', 'berry', 'ocean', 'paper', 'gold'] },
  { id: 'glasses', label: 'Round glasses', slot: 'face', colours: ['night', 'rust', 'plum', 'ocean', 'paper'] },
  { id: 'partyHat', label: 'Party hat', above: true, colours: ['berry', 'sky', 'mint', 'lilac', 'coral', 'butter', 'ocean'] },
  { id: 'antenna', label: 'Antenna', above: true, colours: ['coral', 'mint', 'sky', 'butter', 'rose', 'lilac'] },
  { id: 'bow', label: 'Bow', above: true, colours: ['rose', 'berry', 'coral', 'sky', 'butter', 'lilac'] },
  { id: 'halo', label: 'Ring light', above: true, colours: ['gold'] },
  { id: 'crown', label: 'Crown', above: true, colours: ['gold', 'coral', 'sky', 'mint'] },
  { id: 'megaphone', label: 'Megaphone', slot: 'hand', colours: ['coral', 'butter', 'paper', 'sky', 'mint', 'night'] },
  { id: 'pencil', label: 'Pencil', slot: 'hand', above: true, colours: ['butter', 'gold', 'sky', 'coral', 'mint'] },
  { id: 'plane', label: 'Paper plane', above: true, colours: ['paper', 'sky', 'butter', 'peach', 'mint', 'lilac'] },
  // Weight 0: worn only when put on, so no seed's drawing changes. Keep store-only accessories at the end, weighted 0.
  { id: 'santaHat', label: 'Santa hat', hat: true, weight: 0, colours: ['red', 'moss'] },
  { id: 'witchHat', label: 'Witch hat', hat: true, weight: 0, colours: ['night', 'plum', 'moss'] },
  { id: 'horns', label: 'Devil horns', above: true, weight: 0, colours: ['red', 'night', 'berry'] },
  { id: 'bunnyEars', label: 'Bunny ears', above: true, weight: 0, colours: ['paper', 'rose', 'lilac', 'sand'] },
  { id: 'antlers', label: 'Reindeer antlers', above: true, weight: 0, colours: ['rust', 'sand', 'gold'] },
  { id: 'boppers', label: 'Heart boppers', above: true, weight: 0, colours: ['red', 'rose', 'berry'] },
  { id: 'leprechaun', label: 'Leprechaun hat', hat: true, weight: 0, colours: ['moss', 'night'] },
  { id: 'cakeHat', label: 'Birthday cake', above: true, weight: 0, colours: ['rose', 'butter', 'mint', 'lilac'] },
  { id: 'pirateHat', label: 'Pirate hat', hat: true, weight: 0, colours: ['night', 'rust'] },
  { id: 'lantern', label: 'Lucky lantern', above: true, weight: 0, colours: ['red', 'gold'] },
  // Things to hold (held.ts), in the hand slot, so one is worn with a hat and glasses.
  { id: 'coffee', label: 'Coffee', slot: 'hand', weight: 0, colours: ['paper', 'night', 'coral', 'mint', 'butter'] },
  { id: 'phone', label: 'Phone', slot: 'hand', weight: 0, colours: ['night', 'coral', 'sky', 'lilac', 'paper'] },
  { id: 'balloon', label: 'Balloon', slot: 'hand', above: true, weight: 0, colours: ['red', 'sky', 'butter', 'mint', 'lilac', 'rose'] },
  { id: 'sign', label: 'Sign', slot: 'hand', above: true, weight: 0, colours: ['paper', 'butter', 'sky', 'mint', 'rose'] },
  { id: 'iceCream', label: 'Ice cream', slot: 'hand', weight: 0, colours: ['rose', 'mint', 'butter', 'lilac', 'peach'] },
  { id: 'bouquet', label: 'Bouquet', slot: 'hand', weight: 0, colours: ['paper', 'rose', 'sky', 'lilac'] },
  // Earned, never sold (store.ts, EARNED): a trophy, a laurel wreath and a star crown.
  { id: 'trophy', label: 'Trophy', slot: 'hand', weight: 0, colours: ['gold'] },
  { id: 'laurel', label: 'Laurel wreath', above: true, weight: 0, colours: ['gold'] },
  { id: 'starCrown', label: 'Star crown', above: true, weight: 0, colours: ['gold'] },
]

/** Where an accessory is worn: its slot, 'head' when it names none. */
export const slotOfAccessory = (id: string): AccessorySlot => ACCESSORIES.find((accessory) => accessory.id === id)?.slot ?? 'head'

export const SIDES: readonly Option[] = [
  { id: 'left', label: 'Tail left, flying right', weight: 2.2 },
  { id: 'right', label: 'Tail right, flying left' },
]

/**
 * Tattoos: a small mark on the body, behind the face. A seed never picks one (every Flungie has none until one is put on, from
 * the store or an override), so adding a tattoo changes no one's drawing. Drawn from 32 px.
 */
export const TATTOOS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'bolt', label: 'Lightning' },
  { id: 'flower', label: 'Flower' },
  { id: 'note', label: 'Music note' },
  { id: 'flame', label: 'Flame' },
  { id: 'anchor', label: 'Anchor' },
]

/**
 * Face tattoos: a small mark on the face, by an eye or across the cheeks, in the skin: whatever is worn sits over one. One
 * can be worn with a body tattoo. A seed never picks one, so adding one changes no one. Drawn from 32 px.
 */
export const FACE_TATTOOS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'freckles', label: 'Freckles' },
  { id: 'heart', label: 'Cheek heart' },
  { id: 'star', label: 'Cheek star' },
  { id: 'teardrop', label: 'Teardrop' },
  { id: 'dots', label: 'Three dots' },
  { id: 'bolt', label: 'Cheek lightning' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'whiskers', label: 'Whiskers' },
]

/**
 * Piercings: a little metal on the face, in its own colours. They hang from the eyes and the mouth, clear of every hat, pair of
 * glasses and outfit, so one is worn with any of them. A seed never picks one, so adding one changes no one. Drawn from 32 px.
 */
export const PIERCINGS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'noseStud', label: 'Nose stud' },
  { id: 'noseRing', label: 'Nose ring' },
  { id: 'septum', label: 'Septum ring' },
  { id: 'browBar', label: 'Brow bar' },
  { id: 'browRing', label: 'Brow ring' },
  { id: 'lipRing', label: 'Lip ring' },
  { id: 'snakebites', label: 'Snakebites' },
  { id: 'labret', label: 'Labret stud' },
  { id: 'dimples', label: 'Dimple studs' },
  { id: 'bridge', label: 'Bridge bar' },
  { id: 'faceGem', label: 'Face gem' },
]

/**
 * Pants: a little garment over the bottom of the body and the tail, the spike of the speech bubble. Never picked by a seed, as
 * tattoos are, so adding a pair changes no one. Each has its own colours. Drawn from 32 px.
 */
export const PANTS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'stripes', label: 'Sailor stripes' },
  { id: 'polka', label: 'Polka dots' },
  { id: 'jeans', label: 'Jeans' },
  { id: 'plaid', label: 'Plaid' },
  { id: 'tutu', label: 'Tutu' },
  { id: 'gold', label: 'Gold lamé' },
]

/**
 * Outfits: a garment over more of the body than pants, or over all of it, as a ghost's sheet is. Never picked by a seed, so
 * adding one changes no one. Each has its own colours. Drawn from 32 px.
 */
export const OUTFITS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'jumper', label: 'Cosy jumper' },
  { id: 'festive', label: 'Christmas jumper' },
  { id: 'sundress', label: 'Sundress' },
  { id: 'santa', label: 'Santa suit' },
  { id: 'ghost', label: 'Ghost sheet' },
  { id: 'pumpkin', label: 'Pumpkin' },
  { id: 'skeleton', label: 'Skeleton suit' },
  { id: 'vampire', label: 'Vampire cape' },
  { id: 'mummy', label: 'Mummy wraps' },
  { id: 'tuxedo', label: 'Tuxedo' },
  { id: 'raincoat', label: 'Raincoat' },
  { id: 'aloha', label: 'Aloha shirt' },
  { id: 'sweetheart', label: 'Sweetheart jumper' },
  { id: 'scarf', label: 'Cosy scarf' },
  { id: 'bee', label: 'Bumblebee' },
  { id: 'frog', label: 'Frog onesie' },
  { id: 'bear', label: 'Bear onesie' },
  { id: 'bunny', label: 'Bunny suit' },
  { id: 'fairy', label: 'Fairy wings' },
  { id: 'superhero', label: 'Superhero' },
  { id: 'wizard', label: 'Wizard robe' },
  { id: 'dinosaur', label: 'Dinosaur onesie' },
  { id: 'cat', label: 'Cat suit' },
  { id: 'shark', label: 'Shark onesie' },
  { id: 'penguin', label: 'Penguin suit' },
  { id: 'unicorn', label: 'Unicorn onesie' },
  { id: 'pirate', label: 'Pirate' },
  { id: 'astronaut', label: 'Astronaut' },
  { id: 'newYearJacket', label: 'New Year jacket' },
  { id: 'dragon', label: 'Dragon' },
]

/**
 * Auras: something that moves behind the Flungie, a glow, bubbles, sparkles or a ring. Never picked by a seed. Still unless
 * the render asks for `animate`, and none under 32 px.
 */
export const AURAS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'glow', label: 'Soft glow' },
  { id: 'bubbles', label: 'Bubbles' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'halo', label: 'Rainbow halo' },
  { id: 'prism', label: 'Prism ring' },
  { id: 'snow', label: 'Snowfall' },
  { id: 'leaves', label: 'Autumn leaves' },
  { id: 'blossoms', label: 'Cherry blossoms' },
  { id: 'bats', label: 'Bats' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'fireworks', label: 'Fireworks' },
]

/**
 * Hairdos: a little felt on the head, in the body's own colour a shade deeper (hair.ts). Under a hat only what peeks out shows
 * (a fringe, pigtails). Never picked by a seed, so adding one changes no one. Drawn from 32 px.
 */
export const HAIRS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'tuft', label: 'Tuft' },
  { id: 'fringe', label: 'Fringe' },
  { id: 'mohawk', label: 'Mohawk' },
  { id: 'curls', label: 'Curls' },
  { id: 'bun', label: 'Top bun' },
  { id: 'pigtails', label: 'Pigtails' },
  // Earned, never sold.
  { id: 'rainbow', label: 'Rainbow crest' },
]

/**
 * Body patterns: a print on the felt, in the skin (patterns.ts): under tattoos, pants, outfits, the face and every accessory.
 * Never picked by a seed, so adding one changes no one. Drawn from 32 px.
 */
export const PATTERNS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'spots', label: 'Spots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'speckles', label: 'Speckles' },
  { id: 'ombre', label: 'Sunset fade' },
  { id: 'stars', label: 'Stars' },
  { id: 'hearts', label: 'Hearts' },
  // Earned, never sold.
  { id: 'galaxy', label: 'Galaxy' },
]

/**
 * Pets: a small friend that floats beside the Flungie on its leading side, bobbing when it moves (pets.ts). Never picked by a
 * seed, so adding one changes no one. Drawn from 32 px.
 */
export const PETS: readonly Option[] = [
  { id: 'none', label: 'None' },
  { id: 'bird', label: 'Bluebird' },
  { id: 'ghost', label: 'Little ghost' },
  { id: 'star', label: 'Star buddy' },
  { id: 'mini', label: 'Mini Flungie' },
  { id: 'bee', label: 'Bumblebee' },
  { id: 'cloud', label: 'Rain cloud' },
  // Earned, never sold.
  { id: 'owl', label: 'Wise owl' },
]

/** Every trait with its options, for pickers and inspectors. */
export const TRAITS = {
  shape: SHAPES,
  colour: COLOURS,
  eyes: EYES,
  mouth: MOUTHS,
  blush: [
    { id: true, label: 'On' },
    { id: false, label: 'Off' },
  ],
  accessory: ACCESSORIES,
  accColour: ACC_COLOURS,
  eyewear: [ACCESSORIES[0] as Accessory, ...ACCESSORIES.filter((accessory) => accessory.slot === 'face')],
  held: [ACCESSORIES[0] as Accessory, ...ACCESSORIES.filter((accessory) => accessory.slot === 'hand')],
  side: SIDES,
  lines: LINE_PAIRS,
  tattoo: TATTOOS,
  faceTattoo: FACE_TATTOOS,
  piercing: PIERCINGS,
  pants: PANTS,
  outfit: OUTFITS,
  aura: AURAS,
  hair: HAIRS,
  pattern: PATTERNS,
  pet: PETS,
  mood: MOODS,
} as const

export const byId = <T extends { readonly id: unknown }>(list: readonly T[], id: unknown): T | undefined => list.find((x) => x.id === id)
export const labelOf = (list: readonly Option[], id: string): string => (byId(list, id) ?? (list[0] as Option)).label
