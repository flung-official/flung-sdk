# Changelog

Every version of `@flung.dev/connect` on npm. From 0.3.0 on, release-please writes each section from the Conventional Commits that change `packages/connect` (see RELEASING.md at the root of the repository). 0.1.3 and 0.2.0 were set in `package.json` but never published; their changes are in 0.3.0.

## [0.4.0](https://github.com/flung-official/flung-sdk/compare/connect-v0.3.0...connect-v0.4.0) (2026-10-31)


### Added

* **connect:** connect Farcaster by approval in Warpcast, with a QR code ([c0c1f74](https://github.com/flung-official/flung-sdk/commit/c0c1f740acc872873d87247f1c428e4763c9012e))

## [0.3.0](https://github.com/flung-official/flung-sdk/compare/connect-v0.1.2...connect-v0.3.0) (2026-10-30)


### Added

* **connect:** a headless controller, a React hook, layouts, parts and custom properties ([784d66d](https://github.com/flung-official/flung-sdk/commit/784d66d05986e093ceba4f8cc73ae0ab6443df78))
* **connect:** LinkedIn company pages, chosen in the panel or as their own tile ([784d66d](https://github.com/flung-official/flung-sdk/commit/784d66d05986e093ceba4f8cc73ae0ab6443df78))


### Fixed

* **connect:** one token request for calls side by side ([784d66d](https://github.com/flung-official/flung-sdk/commit/784d66d05986e093ceba4f8cc73ae0ab6443df78))
* **connect:** show cut-short account names in the panel's own tooltip ([deb807d](https://github.com/flung-official/flung-sdk/commit/deb807d7782cccc325657f88a7778b0653c61483))

## [0.1.2](https://github.com/flung-official/flung-sdk/compare/connect-v0.1.1...connect-v0.1.2) (2026-10-29)

### Added

* Each platform's mark in its brand colour, a count of connected accounts, and a spinner while a connect waits.
* `branding="none"` hides the "Secured by Flung" line; new labels `connectedCount`, `notConnected` and `securedBy`.
* Doc comments for every panel property and event field.

## [0.1.1](https://github.com/flung-official/flung-sdk/compare/connect-v0.1.0...connect-v0.1.1) (2026-10-29)

### Changed

* Published under the `@flung.dev` scope from CI, with trusted publishing and a provenance statement.

## 0.1.0 (2026-10-29)

### Added

* `<flung-connect>`, a React component and a core client that let people connect, reconnect and disconnect their social accounts from any page with a short-lived connect token.
