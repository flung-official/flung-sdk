import { PLATFORMS } from '../core/types.js'
import { PLATFORM_MARKS } from './marks.js'

/** Each platform's brand colour for its mark. A black mark takes the text colour, so it shows on a dark page too. */
const MARK_COLOURS = PLATFORMS.map((platform) => {
  const hex = PLATFORM_MARKS[platform].hex
  return `.platform[data-platform="${platform}"] { --mark: ${hex === '000000' ? 'var(--flung-text)' : `#${hex}`}; }`
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
    --flung-mark-strength: 70%;`

/**
 * The panel's look, inside its shadow root. Every colour, the font and the corner radius are `--flung-*` properties a
 * page can set on the element; each part has a `part` name for `::part()`. Follows the page's light or dark scheme
 * unless `theme` says which.
 */
export const STYLES = `
:host {
  --flung-font: system-ui, -apple-system, "Segoe UI", sans-serif;
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
  --flung-mark-strength: 100%;
  display: block;
  font: 15px/1.45 var(--flung-font);
  color: var(--flung-text);
  -webkit-font-smoothing: antialiased;
}
:host([hidden]) { display: none; }
@media (prefers-color-scheme: dark) {
  :host(:not([theme="light"])) {${DARK}
  }
}
:host([theme="dark"]) {${DARK}
}
* { box-sizing: border-box; }
.panel { background: var(--flung-surface); border: 1px solid var(--flung-border); border-radius: var(--flung-radius); overflow: hidden; }
ul { list-style: none; margin: 0; padding: 0; }
.platform { padding: 12px 16px; border-top: 1px solid var(--flung-border); }
.platform:first-child { border-top: 0; }
.row { display: flex; align-items: center; gap: 12px; min-height: 40px; }
.badge { flex: none; width: 40px; height: 40px; border-radius: calc(var(--flung-radius) - 2px); display: grid; place-items: center; color: color-mix(in srgb, var(--mark, var(--flung-text)) var(--flung-mark-strength), var(--flung-text)); background: color-mix(in srgb, var(--mark, var(--flung-text)) 10%, var(--flung-surface)); }
.mark { width: 20px; height: 20px; fill: currentColor; display: block; }
.title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.name { font-weight: 600; line-height: 1.25; }
.count { font-size: 13px; color: var(--flung-muted); line-height: 1.3; }
.count.on::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--flung-success); margin-right: 6px; vertical-align: 2px; }
.accounts { margin: 10px 0 2px 52px; border-left: 1px solid var(--flung-border); }
.account { display: flex; align-items: center; gap: 8px; padding: 6px 0 6px 12px; min-height: 36px; }
.who { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; row-gap: 2px; }
.handle { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.status { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; line-height: 1; padding: 4px 8px; border-radius: 999px; color: var(--flung-warning); background: color-mix(in srgb, var(--flung-warning) 12%, var(--flung-surface)); white-space: nowrap; }
.actions { flex: none; display: flex; gap: 4px; }
.note { margin: 10px 0 0 52px; color: var(--flung-muted); font-size: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.note-text { flex: 1 1 12rem; min-width: 0; }
.note a { color: var(--flung-text); font-weight: 500; }
.spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--flung-border); border-top-color: var(--flung-text); flex: none; }
.confirm, .form { margin: 10px 0 0 52px; padding: 12px; border-radius: calc(var(--flung-radius) - 2px); background: var(--flung-raised); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.confirm p { flex-basis: 100%; margin: 0 0 2px; font-size: 14px; }
.form label { flex-basis: 100%; font-size: 13px; color: var(--flung-muted); }
.form input { flex: 1 1 12rem; min-width: 0; font: inherit; font-size: 14px; color: inherit; background: var(--flung-surface); border: 1px solid var(--flung-border); border-radius: calc(var(--flung-radius) - 4px); padding: 7px 10px; }
button { font: inherit; font-size: 14px; font-weight: 500; line-height: 1.2; cursor: pointer; border-radius: calc(var(--flung-radius) - 4px); padding: 8px 14px; border: 1px solid var(--flung-border); background: var(--flung-surface); color: inherit; white-space: nowrap; }
button:hover:not(:disabled) { background: var(--flung-raised); }
button.primary { background: var(--flung-accent); border-color: var(--flung-accent); color: var(--flung-accent-text); }
button.primary:hover:not(:disabled) { background: color-mix(in srgb, var(--flung-accent) 85%, var(--flung-surface)); }
button.quiet { border-color: transparent; background: transparent; color: var(--flung-muted); padding: 6px 10px; font-size: 13px; }
button.quiet:hover:not(:disabled) { color: var(--flung-danger); background: color-mix(in srgb, var(--flung-danger) 8%, transparent); }
button.warning { padding: 6px 10px; font-size: 13px; color: var(--flung-warning); border-color: color-mix(in srgb, var(--flung-warning) 40%, var(--flung-border)); }
button.danger { background: var(--flung-danger); border-color: var(--flung-danger); color: #ffffff; }
button.danger:hover:not(:disabled) { background: color-mix(in srgb, var(--flung-danger) 85%, #000000); }
button:disabled { opacity: .5; cursor: default; }
button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--flung-accent); outline-offset: 2px; }
.message { margin: 0; padding: 10px 16px; border-top: 1px solid var(--flung-border); color: var(--flung-muted); font-size: 14px; background: var(--flung-raised); }
.message:empty { display: none; }
.message.error { color: var(--flung-danger); background: color-mix(in srgb, var(--flung-danger) 8%, var(--flung-surface)); }
.footer { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-top: 1px solid var(--flung-border); font-size: 12px; color: var(--flung-muted); }
.footer a { display: inline-flex; align-items: center; gap: 4px; color: inherit; text-decoration: none; font-weight: 600; }
.footer a:hover { color: var(--flung-text); }
.footer .flung { width: 14px; height: 14px; fill: currentColor; display: block; }
@media (max-width: 420px) {
  .platform { padding: 12px; }
  .accounts, .note, .confirm, .form { margin-left: 0; }
  .accounts { border-left: 0; border-top: 1px solid var(--flung-border); margin-top: 10px; }
  .account { padding-left: 0; }
  .row > button { padding: 8px 12px; }
}
@media (prefers-reduced-motion: no-preference) {
  button { transition: background-color .15s, color .15s, opacity .15s; }
  .spinner { animation: flung-spin .8s linear infinite; }
}
@keyframes flung-spin { to { transform: rotate(360deg); } }
${MARK_COLOURS}
`
