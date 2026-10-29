/**
 * `@flung.dev/connect`: `<flung-connect>`, a panel that lets people connect and disconnect their social accounts
 * from your page, with a connect token your server makes. `import '@flung.dev/connect/register'` to register it,
 * or call `defineFlungConnect()`.
 */
export { defineFlungConnect, TAG_NAME } from './element/define.js'
export type { FlungConnectElement } from './element/flung-connect.js'
export { DEFAULT_LABELS } from './element/copy.js'
export type { ConnectLabels } from './element/copy.js'
export type { ConnectDetail, DisconnectDetail, ErrorDetail, FlungConnectEventMap, LoadDetail } from './element/events.js'
export * from './core/index.js'
