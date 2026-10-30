import { PLATFORMS } from '../core/types.js'
import type { Platform } from '../core/types.js'
import { PLATFORM_MARKS } from './marks.js'

/**
 * How much of its tile each mark fills, so they read at one optical size. Solid discs and squares fill their whole grid
 * and look heavier than open or wide marks, so they are drawn a little smaller.
 */
const OPTICAL_SCALE: Readonly<Record<Platform, number>> = {
  x: 0.86,
  instagram: 0.9,
  facebook: 0.92,
  threads: 0.9,
  linkedin: 0.92,
  tiktok: 0.9,
  youtube: 1,
  pinterest: 0.92,
  bluesky: 1,
  mastodon: 0.9,
  discord: 1,
  farcaster: 0.86,
}

/** Each platform's brand colour for its mark, and its optical scale. A black mark takes the text colour, so it shows on a dark page too. */
const MARKS = PLATFORMS.map((platform) => {
  const hex = PLATFORM_MARKS[platform].hex
  return `.platform[data-platform="${platform}"] { --mark: ${hex === '000000' ? 'var(--flung-text)' : `#${hex}`}; --mark-scale: ${OPTICAL_SCALE[platform]}; }`
}).join('\n')

const DARK = `
    --flung-text: #f4f4f5;
    --flung-muted: #a1a1aa;
    --flung-surface: #18181b;
    --flung-raised: #27272a;
    --flung-border: #2e2e33;
    --flung-accent: #f4f4f5;
    --flung-accent-text: #18181b;
    --flung-danger: #f87171;
    --flung-warning: #fbbf24;
    --flung-success: #4ade80;
    --flung-mark-strength: 75%;
    --flung-tint-strength: 14%;`

/** What `unstyled` keeps: the element is a block, and `hidden` hides it. Everything else is the page's, through `::part()`. */
export const BASE_STYLES = `
:host { display: block; }
:host([hidden]) { display: none; }
[hidden] { display: none !important; }
`

/**
 * The panel's look, inside its shadow root. Colours, type, spacing, sizes, radii, borders, shadows and the focus ring
 * are `--flung-*` properties a page can set on the element; each piece has a `part` name for `::part()`. Follows the
 * page's light or dark scheme unless `theme` says which. `layout` picks `list`, `grid` or `compact`.
 */
export const STYLES = `
:host {
  --flung-font: system-ui, -apple-system, "Segoe UI", sans-serif;
  --flung-font-size: 15px;
  --flung-font-size-small: 13px;
  --flung-line-height: 1.45;
  --flung-font-weight-medium: 500;
  --flung-font-weight-strong: 600;
  --flung-text: #18181b;
  --flung-muted: #71717a;
  --flung-surface: #ffffff;
  --flung-raised: #f4f4f5;
  --flung-border: #e4e4e7;
  --flung-accent: #18181b;
  --flung-accent-text: #ffffff;
  --flung-danger: #dc2626;
  --flung-warning: #b45309;
  --flung-success: #15803d;
  --flung-radius: 12px;
  --flung-radius-inner: max(calc(var(--flung-radius) - 4px), 0px);
  --flung-border-width: 1px;
  --flung-shadow: none;
  --flung-card-shadow: none;
  --flung-padding: 16px;
  --flung-gap: 12px;
  --flung-badge-size: 40px;
  --flung-mark-size: 20px;
  --flung-mark-strength: 100%;
  --flung-tint-strength: 8%;
  --flung-avatar-size: 32px;
  --flung-button-height: 36px;
  --flung-button-padding: 0 14px;
  --flung-button-radius: var(--flung-radius-inner);
  --flung-focus-color: var(--flung-accent);
  --flung-focus-width: 2px;
  --flung-focus-offset: 2px;
  --flung-grid-min: 16rem;
  display: block;
  font: var(--flung-font-size)/var(--flung-line-height) var(--flung-font);
  color: var(--flung-text);
  -webkit-font-smoothing: antialiased;
}
:host([hidden]) { display: none; }
[hidden] { display: none !important; }
@media (prefers-color-scheme: dark) {
  :host(:not([theme="light"])) {${DARK}
  }
}
:host([theme="dark"]) {${DARK}
}
:host([layout="compact"]) {
  --flung-font-size: 14px;
  --flung-font-size-small: 12px;
  --flung-padding: 12px;
  --flung-gap: 8px;
  --flung-badge-size: 30px;
  --flung-mark-size: 16px;
  --flung-avatar-size: 24px;
  --flung-button-height: 30px;
  --flung-button-padding: 0 10px;
}
* { box-sizing: border-box; }
.panel { background: var(--flung-surface); border: var(--flung-border-width) solid var(--flung-border); border-radius: var(--flung-radius); box-shadow: var(--flung-shadow); overflow: hidden; }
ul { list-style: none; margin: 0; padding: 0; }
.platform { padding: var(--flung-gap) var(--flung-padding); border-top: var(--flung-border-width) solid var(--flung-border); }
.platform:first-child { border-top: 0; }
.row { display: flex; align-items: center; gap: var(--flung-gap); min-height: var(--flung-badge-size); }
.row ::slotted(*) { flex: 1; min-width: 0; }
.badge {
  flex: none; width: var(--flung-badge-size); height: var(--flung-badge-size); border-radius: var(--flung-radius-inner);
  display: grid; place-items: center;
  color: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-mark-strength), var(--flung-text));
  background: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-tint-strength), var(--flung-surface));
  border: var(--flung-border-width) solid color-mix(in srgb, var(--mark, var(--flung-text)) 14%, var(--flung-border));
}
.mark { width: var(--flung-mark-size); height: var(--flung-mark-size); fill: currentColor; display: block; transform: scale(var(--mark-scale, 1)); }
.title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.name { font-weight: var(--flung-font-weight-strong); line-height: 1.25; }
.count { font-size: var(--flung-font-size-small); color: var(--flung-muted); line-height: 1.3; }
.count.on::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--flung-success); margin-right: 6px; vertical-align: 2px; }
.accounts { margin: 10px 0 2px calc(var(--flung-badge-size) + var(--flung-gap)); border-left: var(--flung-border-width) solid var(--flung-border); }
.account { display: flex; align-items: center; gap: 10px; padding: 6px 0 6px 12px; min-height: calc(var(--flung-avatar-size) + 12px); }
.account ::slotted(*) { flex: 1; min-width: 0; }
.avatar {
  flex: none; width: var(--flung-avatar-size); height: var(--flung-avatar-size); border-radius: 50%; object-fit: cover; display: block;
  background: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-tint-strength), var(--flung-surface));
  border: var(--flung-border-width) solid color-mix(in srgb, var(--mark, var(--flung-text)) 14%, var(--flung-border));
}
.avatar.initial {
  display: grid; place-items: center; font-size: calc(var(--flung-avatar-size) * .42); font-weight: var(--flung-font-weight-strong); line-height: 1;
  color: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-mark-strength), var(--flung-text));
}
.who { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; row-gap: 2px; }
.names { min-width: 0; max-width: 100%; display: flex; flex-direction: column; }
.handle, .username { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.handle { font-size: calc(var(--flung-font-size) - 1px); font-weight: var(--flung-font-weight-medium); line-height: 1.3; }
.username { font-size: var(--flung-font-size-small); color: var(--flung-muted); line-height: 1.3; }
.status { display: inline-flex; align-items: center; gap: 5px; font-size: calc(var(--flung-font-size-small) - 1px); font-weight: var(--flung-font-weight-medium); line-height: 1; padding: 4px 8px; border-radius: 999px; color: var(--flung-warning); background: color-mix(in srgb, var(--flung-warning) 12%, var(--flung-surface)); white-space: nowrap; }
.actions { flex: none; display: flex; align-items: center; gap: 4px; }
.tag { display: inline-flex; align-items: center; font-size: calc(var(--flung-font-size-small) - 1px); font-weight: var(--flung-font-weight-medium); line-height: 1; padding: 3px 7px; border-radius: 999px; color: var(--flung-muted); background: var(--flung-raised); border: var(--flung-border-width) solid var(--flung-border); white-space: nowrap; }
.note { margin: 10px 0 0 calc(var(--flung-badge-size) + var(--flung-gap)); color: var(--flung-muted); font-size: calc(var(--flung-font-size) - 1px); display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.note-text { flex: 1 1 12rem; min-width: 0; }
.note a { color: var(--flung-text); font-weight: var(--flung-font-weight-medium); }
.spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--flung-border); border-top-color: var(--flung-text); flex: none; }
.confirm, .form { margin: 10px 0 0 calc(var(--flung-badge-size) + var(--flung-gap)); padding: var(--flung-gap); border-radius: var(--flung-radius-inner); background: var(--flung-raised); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.confirm p { flex-basis: 100%; margin: 0 0 2px; font-size: calc(var(--flung-font-size) - 1px); }
.choose { margin: 10px 0 0 calc(var(--flung-badge-size) + var(--flung-gap)); padding: var(--flung-gap); border-radius: var(--flung-radius-inner); background: var(--flung-raised); display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.choose-title { margin: 0; font-size: calc(var(--flung-font-size) - 1px); }
.options { align-self: stretch; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 8px; }
button.option { height: auto; min-height: var(--flung-button-height); padding: 10px 12px; gap: 10px; justify-content: flex-start; text-align: left; white-space: normal; line-height: var(--flung-line-height); }
button.option:hover:not(:disabled) { background: var(--flung-surface); border-color: color-mix(in srgb, var(--mark, var(--flung-text)) 45%, var(--flung-border)); }
.option-icon {
  flex: none; width: 32px; height: 32px; border-radius: var(--flung-radius-inner); display: grid; place-items: center;
  color: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-mark-strength), var(--flung-text));
  background: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-tint-strength), var(--flung-surface));
}
.option-mark { width: 18px; height: 18px; fill: currentColor; display: block; }
.option-text { min-width: 0; display: flex; flex-direction: column; }
.option-name { font-weight: var(--flung-font-weight-strong); line-height: 1.3; }
.option-description { font-size: var(--flung-font-size-small); font-weight: normal; color: var(--flung-muted); line-height: 1.3; }
.form label { flex-basis: 100%; font-size: var(--flung-font-size-small); color: var(--flung-muted); }
.form input { flex: 1 1 12rem; min-width: 0; height: var(--flung-button-height); font: inherit; font-size: calc(var(--flung-font-size) - 1px); color: inherit; background: var(--flung-surface); border: var(--flung-border-width) solid var(--flung-border); border-radius: var(--flung-button-radius); padding: 0 10px; }
button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: var(--flung-button-height); padding: var(--flung-button-padding); border-radius: var(--flung-button-radius);
  font: inherit; font-size: calc(var(--flung-font-size) - 1px); font-weight: var(--flung-font-weight-medium); line-height: 1; white-space: nowrap;
  cursor: pointer; color: var(--flung-text); background: var(--flung-surface); border: var(--flung-border-width) solid var(--flung-border);
}
button:hover:not(:disabled) { background: var(--flung-raised); }
button:active:not(:disabled) { background: color-mix(in srgb, var(--flung-text) 8%, var(--flung-raised)); }
button.primary { background: var(--flung-accent); border-color: var(--flung-accent); color: var(--flung-accent-text); }
button.primary:hover:not(:disabled) { background: color-mix(in srgb, var(--flung-accent) 88%, var(--flung-surface)); }
button.primary:active:not(:disabled) { background: color-mix(in srgb, var(--flung-accent) 78%, var(--flung-surface)); }
button.quiet { border-color: transparent; background: transparent; color: var(--flung-muted); padding: 0 10px; }
button.quiet:hover:not(:disabled) { color: var(--flung-danger); background: color-mix(in srgb, var(--flung-danger) 8%, transparent); }
button.quiet:active:not(:disabled) { color: var(--flung-danger); background: color-mix(in srgb, var(--flung-danger) 14%, transparent); }
button.danger { background: var(--flung-danger); border-color: var(--flung-danger); color: #ffffff; }
button.danger:hover:not(:disabled) { background: color-mix(in srgb, var(--flung-danger) 88%, #000000); }
button.danger:active:not(:disabled) { background: color-mix(in srgb, var(--flung-danger) 78%, #000000); }
button:disabled { opacity: .5; cursor: default; }
button:focus-visible, input:focus-visible, a:focus-visible { outline: var(--flung-focus-width) solid var(--flung-focus-color); outline-offset: var(--flung-focus-offset); }
.message { margin: 0; padding: 10px var(--flung-padding); border-top: var(--flung-border-width) solid var(--flung-border); color: var(--flung-muted); font-size: calc(var(--flung-font-size) - 1px); background: var(--flung-raised); }
.message.error { color: var(--flung-danger); background: color-mix(in srgb, var(--flung-danger) 8%, var(--flung-surface)); }
.footer { margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px var(--flung-padding); border-top: var(--flung-border-width) solid var(--flung-border); font-size: calc(var(--flung-font-size-small) - 1px); color: var(--flung-muted); }
.footer a { display: inline-flex; align-items: center; gap: 4px; color: inherit; text-decoration: none; font-weight: var(--flung-font-weight-strong); }
.footer a:hover { color: var(--flung-text); }
.footer .flung { width: 14px; height: 14px; fill: currentColor; display: block; }
.panel[data-layout="grid"] .list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--flung-grid-min)), 1fr)); gap: var(--flung-gap); padding: var(--flung-padding); }
.panel[data-layout="grid"] .platform, .panel[data-layout="grid"] .platform:first-child { border: var(--flung-border-width) solid var(--flung-border); border-radius: var(--flung-radius-inner); box-shadow: var(--flung-card-shadow); padding: var(--flung-gap); }
.panel[data-layout="grid"] .accounts, .panel[data-layout="grid"] .note, .panel[data-layout="grid"] .confirm, .panel[data-layout="grid"] .form, .panel[data-layout="grid"] .choose { margin-left: 0; }
.panel[data-layout="grid"] .accounts { border-left: 0; border-top: var(--flung-border-width) solid var(--flung-border); margin-top: var(--flung-gap); padding-top: 4px; }
.panel[data-layout="grid"] .account { padding-left: 0; }
.panel[data-layout="compact"] .count { display: none; }
.panel[data-layout="compact"] .accounts, .panel[data-layout="compact"] .note, .panel[data-layout="compact"] .confirm, .panel[data-layout="compact"] .form, .panel[data-layout="compact"] .choose { margin-top: 6px; }
.panel[data-layout="compact"] .account { padding-top: 3px; padding-bottom: 3px; }
@media (max-width: 420px) {
  .platform { padding: var(--flung-gap); }
  .accounts, .note, .confirm, .form, .choose { margin-left: 0; }
  .accounts { border-left: 0; border-top: var(--flung-border-width) solid var(--flung-border); margin-top: 10px; }
  .account { padding-left: 0; }
  .row button { padding: 0 12px; }
}
@media (prefers-reduced-motion: no-preference) {
  button { transition: background-color .15s ease, color .15s ease, border-color .15s ease, opacity .15s ease; }
  .spinner { animation: flung-spin .8s linear infinite; }
}
@keyframes flung-spin { to { transform: rotate(360deg); } }
${MARKS}
`
