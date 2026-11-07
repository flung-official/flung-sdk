/**
 * What a Flungie is feeling right now. An expression is a state, not an identity: the seed decides who a Flungie is, and an
 * expression only changes its face for a moment (a post that failed, a long think, a job well done), so the same Flungie can show
 * every one. `neutral` is the seed's own face, drawn exactly as before.
 *
 * Each expression sets the eyes, the mouth, the brows, the colour that comes to the cheeks, and one small extra: a tear, a flush,
 * a sparkle or a thought. New ones are added here, with nothing else to change.
 */

export const EXPRESSIONS = ['neutral', 'happy', 'cute', 'mad', 'sad', 'thinking', 'surprised', 'sleepy'] as const
export type Expression = (typeof EXPRESSIONS)[number]

export type BrowShape = 'none' | 'angry' | 'worried' | 'raised' | 'quizzical'
export type ExpressionMouth = 'smile' | 'grin' | 'cat' | 'o' | 'frown' | 'flat' | 'none'
export type ExpressionExtra = 'none' | 'tear' | 'flush' | 'sparkle' | 'thought' | 'zzz'

export interface ExpressionSpec {
  id: Expression
  label: string
  /** The eyes, as the trait's kinds name them, plus `look` (dots glancing up and aside). Absent: the seed's own. */
  eyes?: 'dots' | 'happy' | 'wide' | 'sleepy' | 'look' | undefined
  /** Absent: the seed's own mouth. */
  mouth?: ExpressionMouth | undefined
  brows: BrowShape
  /** The cheeks' colour and strength. Absent: the seed's own blush, if it has one. */
  cheeks?: { colour: string; opacity: number; size: number } | undefined
  extra: ExpressionExtra
}

export const EXPRESSION_SPECS: Readonly<Record<Expression, ExpressionSpec>> = {
  neutral: { id: 'neutral', label: 'Neutral', brows: 'none', extra: 'none' },
  happy: { id: 'happy', label: 'Happy', eyes: 'happy', mouth: 'grin', brows: 'none', cheeks: { colour: '#FF7A85', opacity: 0.55, size: 1 }, extra: 'none' },
  cute: { id: 'cute', label: 'Cute', eyes: 'wide', mouth: 'cat', brows: 'none', cheeks: { colour: '#FF6F9C', opacity: 0.8, size: 1.25 }, extra: 'sparkle' },
  mad: { id: 'mad', label: 'Mad', eyes: 'dots', mouth: 'frown', brows: 'angry', cheeks: { colour: '#FF4A4A', opacity: 0.7, size: 1.45 }, extra: 'flush' },
  sad: { id: 'sad', label: 'Sad', eyes: 'dots', mouth: 'frown', brows: 'worried', cheeks: { colour: '#86C0FF', opacity: 0.45, size: 1 }, extra: 'tear' },
  thinking: { id: 'thinking', label: 'Thinking', eyes: 'look', mouth: 'flat', brows: 'quizzical', extra: 'thought' },
  surprised: { id: 'surprised', label: 'Surprised', eyes: 'wide', mouth: 'o', brows: 'raised', extra: 'none' },
  sleepy: { id: 'sleepy', label: 'Sleepy', eyes: 'sleepy', mouth: 'o', brows: 'none', extra: 'zzz' },
}

/** The expressions a Flungie may wear as its own face (the `mood` trait), with neutral as none. */
export const MOODS: readonly { readonly id: string; readonly label: string }[] = EXPRESSIONS.map((id) => ({ id, label: id === 'neutral' ? 'None' : EXPRESSION_SPECS[id].label }))

/** The spec of an expression, or neutral's for anything it does not know. */
export function expressionOf(id: string | undefined): ExpressionSpec {
  return (id !== undefined && Object.hasOwn(EXPRESSION_SPECS, id) ? EXPRESSION_SPECS[id as Expression] : undefined) ?? EXPRESSION_SPECS.neutral
}
