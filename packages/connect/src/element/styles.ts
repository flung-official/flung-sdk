/**
 * The panel's look, inside its shadow root. Every colour, the font and the corner radius are `--flung-*` properties a
 * page can set on the element; each part has a `part` name for `::part()`. Follows the page's light or dark scheme
 * unless `theme` says which.
 */
export const STYLES = `
:host {
  --flung-font: system-ui, -apple-system, "Segoe UI", sans-serif;
  --flung-text: #18181b;
  --flung-muted: #52525b;
  --flung-surface: #ffffff;
  --flung-raised: #f4f4f5;
  --flung-border: #d4d4d8;
  --flung-accent: #18181b;
  --flung-accent-text: #ffffff;
  --flung-danger: #b91c1c;
  --flung-warning: #a16207;
  --flung-radius: 8px;
  display: block;
  font: 15px/1.45 var(--flung-font);
  color: var(--flung-text);
}
:host([hidden]) { display: none; }
@media (prefers-color-scheme: dark) {
  :host(:not([theme="light"])) {
    --flung-text: #f4f4f5;
    --flung-muted: #a1a1aa;
    --flung-surface: #18181b;
    --flung-raised: #27272a;
    --flung-border: #3f3f46;
    --flung-accent: #f4f4f5;
    --flung-accent-text: #18181b;
    --flung-danger: #f87171;
    --flung-warning: #facc15;
  }
}
:host([theme="dark"]) {
  --flung-text: #f4f4f5;
  --flung-muted: #a1a1aa;
  --flung-surface: #18181b;
  --flung-raised: #27272a;
  --flung-border: #3f3f46;
  --flung-accent: #f4f4f5;
  --flung-accent-text: #18181b;
  --flung-danger: #f87171;
  --flung-warning: #facc15;
}
* { box-sizing: border-box; }
.panel { background: var(--flung-surface); border: 1px solid var(--flung-border); border-radius: var(--flung-radius); overflow: hidden; }
ul { list-style: none; margin: 0; padding: 0; }
.platform { padding: 12px 14px; border-top: 1px solid var(--flung-border); }
.platform:first-child { border-top: 0; }
.row { display: flex; align-items: center; gap: 10px; min-height: 36px; }
.badge { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--flung-raised); font-weight: 600; font-size: 13px; }
.name { flex: 1; min-width: 0; font-weight: 600; }
.accounts { margin: 6px 0 0 42px; }
.account { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 0; }
.who { flex: 1; min-width: 8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { font-size: 13px; color: var(--flung-warning); }
.note { margin: 8px 0 0 42px; color: var(--flung-muted); font-size: 14px; }
.note a { color: inherit; }
.confirm, .form { margin: 8px 0 0 42px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.confirm p { flex-basis: 100%; margin: 0; }
.form label { flex-basis: 100%; font-size: 14px; color: var(--flung-muted); }
.form input { flex: 1; min-width: 10rem; font: inherit; color: inherit; background: var(--flung-surface); border: 1px solid var(--flung-border); border-radius: calc(var(--flung-radius) - 2px); padding: 6px 10px; }
button { font: inherit; font-size: 14px; cursor: pointer; border-radius: calc(var(--flung-radius) - 2px); padding: 6px 12px; border: 1px solid var(--flung-border); background: transparent; color: inherit; }
button.primary { background: var(--flung-accent); border-color: var(--flung-accent); color: var(--flung-accent-text); }
button.danger { color: var(--flung-danger); border-color: currentColor; }
button:disabled { opacity: .55; cursor: default; }
button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--flung-accent); outline-offset: 2px; }
.message { margin: 0; padding: 10px 14px; border-top: 1px solid var(--flung-border); color: var(--flung-muted); font-size: 14px; }
.message:empty { display: none; }
.message.error { color: var(--flung-danger); }
@media (prefers-reduced-motion: no-preference) { button { transition: opacity .15s; } }
`
