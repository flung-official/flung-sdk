// The trait tables. Order and weights are part of every seed's output: append, never reorder, reweight or remove
// (BUILDING.md, "Adding a trait").

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

export interface Accessory extends Option {
  /** Preferred colours, keys of ACC_COLOURS, tried in order from a seeded start. */
  readonly colours: readonly string[]
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
  { id: 'sunglasses', label: 'Sunglasses', colours: ['night', 'berry', 'ocean', 'paper', 'gold'] },
  { id: 'glasses', label: 'Round glasses', colours: ['night', 'rust', 'plum', 'ocean', 'paper'] },
  { id: 'partyHat', label: 'Party hat', above: true, colours: ['berry', 'sky', 'mint', 'lilac', 'coral', 'butter', 'ocean'] },
  { id: 'antenna', label: 'Antenna', above: true, colours: ['coral', 'mint', 'sky', 'butter', 'rose', 'lilac'] },
  { id: 'bow', label: 'Bow', above: true, colours: ['rose', 'berry', 'coral', 'sky', 'butter', 'lilac'] },
  { id: 'halo', label: 'Ring light', above: true, colours: ['gold'] },
  { id: 'crown', label: 'Crown', above: true, colours: ['gold', 'coral', 'sky', 'mint'] },
  { id: 'megaphone', label: 'Megaphone', colours: ['coral', 'butter', 'paper', 'sky', 'mint', 'night'] },
  { id: 'pencil', label: 'Pencil', above: true, colours: ['butter', 'gold', 'sky', 'coral', 'mint'] },
  { id: 'plane', label: 'Paper plane', above: true, colours: ['paper', 'sky', 'butter', 'peach', 'mint', 'lilac'] },
]

export const SIDES: readonly Option[] = [
  { id: 'left', label: 'Tail left, flying right', weight: 2.2 },
  { id: 'right', label: 'Tail right, flying left' },
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
  side: SIDES,
  lines: LINE_PAIRS,
} as const

export const byId = <T extends { readonly id: unknown }>(list: readonly T[], id: unknown): T | undefined => list.find((x) => x.id === id)
export const labelOf = (list: readonly Option[], id: string): string => (byId(list, id) ?? (list[0] as Option)).label
