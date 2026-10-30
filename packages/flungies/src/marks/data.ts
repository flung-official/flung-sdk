// The workspace marks' trait tables. As with Flungies, order and weights are part of every seed's output: append, never
// reorder, reweight or remove (BUILDING.md, "Workspace marks").

import type { Option } from '../data.js'

/**
 * A two-tone colour pair. The tile is lit like the brand's wash: its ground from the top left, turning toward the tone at the
 * bottom right.
 */
export interface MarkPair extends Option {
  /** `#RRGGBB`, a Flungies body colour. */
  readonly ground: string
  /** `#RRGGBB`, the ground's neighbour on the wheel. */
  readonly tone: string
}

export interface MarkScale extends Option {
  /** Feature pitch in units, per pattern: the tiles' grid, the lines' rows and the ripples' ring step. */
  readonly tiles: number
  readonly lines: number
  readonly ripples: number
}

export interface MarkAngle {
  /** Degrees. */
  readonly id: number
  readonly label: string
  readonly weight?: number
}

export interface MarkCentre extends Option {
  readonly x: number
  readonly y: number
}

export interface MarkRhythm extends Option {
  /** Capsule lengths along a row, in units of the row pitch. */
  readonly lengths: readonly number[]
}

export interface MarkLinePair extends Option {
  readonly top: string
  readonly bottom: string
}

/**
 * Every ground is a Flungies body colour and every tone its neighbour on the wheel, so the two families share one palette;
 * analogous tones keep the blend clean where a complement would go muddy. Sand and Cloud are the pale pairs: they come up
 * half as often as the others, and their tones are deeper than their grounds, so a small one still reads as a pattern
 * rather than plain initials.
 */
export const MARK_PAIRS: readonly MarkPair[] = [
  { id: 'peach', label: 'Peach into coral', ground: '#FFA584', tone: '#FF8A72', weight: 1.3 },
  { id: 'sky', label: 'Sky into lilac', ground: '#86C0FF', tone: '#A6ACFF', weight: 1.3 },
  { id: 'butter', label: 'Butter into peach', ground: '#FFD66E', tone: '#FFB37A' },
  { id: 'mint', label: 'Mint into sky', ground: '#8EDDB5', tone: '#86CDE8' },
  { id: 'lilac', label: 'Lilac into rose', ground: '#BFA4FF', tone: '#E6A2E6' },
  { id: 'coral', label: 'Coral into berry', ground: '#FF7E6E', tone: '#EE6286' },
  { id: 'sand', label: 'Sand into peach', ground: '#DDB27A', tone: '#E2885C', weight: 0.4 },
  { id: 'cloud', label: 'Cloud into sky', ground: '#D2D5EA', tone: '#93B2E8', weight: 0.4 },
  { id: 'ink', label: 'Ink into plum', ground: '#2B2834', tone: '#3A2F57', weight: 0.9 },
  { id: 'ocean', label: 'Ocean into plum', ground: '#3F7EDB', tone: '#5A64CF', weight: 0.9 },
  { id: 'moss', label: 'Moss into ocean', ground: '#4E9A73', tone: '#3F8A99', weight: 0.9 },
  { id: 'plum', label: 'Plum into berry', ground: '#7457C9', tone: '#9A4FAE', weight: 0.9 },
  { id: 'berry', label: 'Berry into rust', ground: '#D2457E', tone: '#D25A5C', weight: 0.9 },
  { id: 'rust', label: 'Rust into butter', ground: '#C9643B', tone: '#D98A3A', weight: 0.9 },
]

/** The signature speed lines, as Flungies has them: upper colour, lower colour. */
export const MARK_LINE_PAIRS: readonly MarkLinePair[] = [
  { id: 'brand', label: 'Peach and sky', top: '#FFA584', bottom: '#86C0FF' },
  { id: 'sunset', label: 'Butter and coral', top: '#FFD66E', bottom: '#FF7E6E' },
  { id: 'lagoon', label: 'Mint and sky', top: '#8EDDB5', bottom: '#86C0FF' },
  { id: 'dusk', label: 'Lilac and peach', top: '#BFA4FF', bottom: '#FFA584' },
  { id: 'paper', label: 'Paper', top: '#FFFFFF', bottom: '#FFFFFF' },
  { id: 'ink', label: 'Ink', top: '#2B2834', bottom: '#2B2834' },
]

export const MARK_PATTERNS: readonly Option[] = [
  { id: 'tiles', label: 'Tiles', weight: 1.2 },
  { id: 'lines', label: 'Lines' },
  { id: 'ripples', label: 'Ripples' },
]

export const MARK_FINISHES: readonly Option[] = [
  { id: 'emboss', label: 'Embossed (raised)', weight: 1.4 },
  { id: 'deboss', label: 'Debossed (pressed)' },
]

export const MARK_SCALES: readonly MarkScale[] = [
  { id: 'fine', label: 'Fine', tiles: 19, lines: 10.5, ripples: 8.5, weight: 0.9 },
  { id: 'medium', label: 'Medium', tiles: 25, lines: 13.5, ripples: 11, weight: 1.3 },
  { id: 'bold', label: 'Bold', tiles: 33, lines: 17.5, ripples: 15 },
]

/** The pattern's lean. 14° is the brand's own. */
export const MARK_ANGLES: readonly MarkAngle[] = [
  { id: 14, label: '14°, the brand lean', weight: 1.6 },
  { id: -14, label: '−14°' },
  { id: 0, label: '0°', weight: 0.8 },
  { id: 8, label: '8°' },
  { id: 24, label: '24°', weight: 0.7 },
]

/** Where the ripples' rings start. */
export const MARK_CENTRES: readonly MarkCentre[] = [
  { id: 'centre', label: 'Centre', x: 50, y: 50, weight: 0.8 },
  { id: 'topLeft', label: 'Top left', x: 12, y: 12 },
  { id: 'topRight', label: 'Top right', x: 88, y: 12 },
  { id: 'bottomLeft', label: 'Bottom left', x: 12, y: 88 },
  { id: 'bottomRight', label: 'Bottom right', x: 88, y: 88, weight: 1.2 },
  { id: 'left', label: 'Left edge', x: 4, y: 52 },
  { id: 'bottom', label: 'Bottom edge', x: 50, y: 98 },
]

/** 'brand' is the social covers' own rhythm. */
export const MARK_RHYTHMS: readonly MarkRhythm[] = [
  { id: 'brand', label: 'Brand', lengths: [1.0, 0.34, 0.62, 1.45, 0.26, 0.8, 0.44, 1.18], weight: 1.5 },
  { id: 'dash', label: 'Dash and dot', lengths: [1.3, 0.28, 0.9, 0.28] },
  { id: 'long', label: 'Long throws', lengths: [2.2, 0.5, 1.6, 0.9] },
  { id: 'even', label: 'Even', lengths: [0.8, 0.8, 0.8], weight: 0.7 },
]

/** The corner the two tiny speed lines sit in, from 64 px. */
export const MARK_SIGNATURES: readonly Option[] = [
  { id: 'none', label: 'None', weight: 2.2 },
  { id: 'topRight', label: 'Top right', weight: 1.2 },
  { id: 'bottomLeft', label: 'Bottom left' },
  { id: 'bottomRight', label: 'Bottom right' },
  { id: 'topLeft', label: 'Top left', weight: 0.7 },
]

/** Every trait with its options, for pickers and inspectors. */
export const MARK_TRAITS = {
  pattern: MARK_PATTERNS,
  pair: MARK_PAIRS,
  finish: MARK_FINISHES,
  scale: MARK_SCALES,
  angle: MARK_ANGLES,
  centre: MARK_CENTRES,
  rhythm: MARK_RHYTHMS,
  signature: MARK_SIGNATURES,
} as const

export const byMarkId = <T extends { readonly id: unknown }>(list: readonly T[], id: unknown): T | undefined =>
  list.find((x) => x.id === id || String(x.id) === String(id))
