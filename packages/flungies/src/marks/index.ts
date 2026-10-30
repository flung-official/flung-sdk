// Workspace marks: generated avatars for workspaces. Each one is a squared object pressed with one of the brand's three
// patterns (tiles, lines, ripples), in a two-tone pair from the Flungies palette, with the workspace's initials on top. People
// are round living characters (Flungies); workspaces are squared objects, so the two never read as one another. No
// dependencies and no DOM: it returns strings, in browsers, workers and Node.
//
//   import { workspaceMark, markTraits, renderMark } from '@flung.dev/flungies/marks'
//   const svg = workspaceMark(workspace.id, { size: 32, theme: 'dark', name: workspace.name })
//   renderMark(markTraits(workspace.id, { pattern: 'ripples' }), { size: 256, initials: 'NW', animate: true })
//
// Seeding is the Flungies seeding: every trait draws from its own stream, so overriding one trait, or adding a new one
// later, never changes the others. How it is built: BUILDING.md, "Workspace marks".

export { toSvgElement } from '../render.js'
export {
  MARK_ANGLES,
  MARK_CENTRES,
  MARK_FINISHES,
  MARK_LINE_PAIRS,
  MARK_PAIRS,
  MARK_PATTERNS,
  MARK_RHYTHMS,
  MARK_SCALES,
  MARK_SIGNATURES,
  MARK_TRAITS,
  type MarkAngle,
  type MarkCentre,
  type MarkLinePair,
  type MarkPair,
  type MarkRhythm,
  type MarkScale,
} from './data.js'
export {
  describeMark,
  MARK_SWEEP_MIN,
  type MarkGeometry,
  markGeometry,
  type MarkOptions,
  type MarkRenderOptions,
  plainMark,
  renderMark,
  workspaceMark,
} from './render.js'
export {
  type MarkConfig,
  markCombinations,
  markInitials,
  type MarkOverrides,
  markPalette,
  type MarkShading,
  type MarkTraits,
  markTraits,
} from './traits.js'
