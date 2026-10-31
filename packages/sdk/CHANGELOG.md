# Changelog

Every version of `@flung.dev/sdk` on npm. From 0.2.0 on, release-please writes each section from the Conventional Commits that change `packages/sdk` (see RELEASING.md at the root of the repository).

## [0.5.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.4.0...sdk-v0.5.0) (2026-10-31)


### Added

* **sdk:** Plotwork diagrams in posts, brands and the newest API ([45f45b6](https://github.com/flung-official/flung-sdk/commit/45f45b60450d1519a6a7d4b3b45013421b5c0bda))

## [0.4.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.3.0...sdk-v0.4.0) (2026-10-31)


### Added

* **sdk:** the one-account-per-platform limit and its error, documented ([0707297](https://github.com/flung-official/flung-sdk/commit/0707297cceaf79d0bab75dbfeb0be8f60d20b2e4))

## [0.3.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.2.0...sdk-v0.3.0) (2026-10-31)


### Added

* **sdk:** schedule at a local time in a time zone ([3edcaf1](https://github.com/flung-official/flung-sdk/commit/3edcaf1d66cf00aa53540c796b1beda6b016b303))

## [0.2.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.1.3...sdk-v0.2.0) (2026-10-30)


### Added

* **sdk:** account displayName and avatarUrl, billing, and the plan_limit_reached error code ([d3c96c5](https://github.com/flung-official/flung-sdk/commit/d3c96c5e946f5f2946bde6e63328ee3b6c4e9447))
* **sdk:** LinkedIn company pages: accounts.connect takes variant 'pages', and PlatformInfo has variants ([d3c96c5](https://github.com/flung-official/flung-sdk/commit/d3c96c5e946f5f2946bde6e63328ee3b6c4e9447))

## [0.1.3](https://github.com/flung-official/flung-sdk/compare/sdk-v0.1.2...sdk-v0.1.3) (2026-10-29)

### Added

* Profiles: `flung.profiles.create`, `list`, `get`, `update` and `delete`, and `profileId` on accounts and posts.

## [0.1.2](https://github.com/flung-official/flung-sdk/compare/sdk-v0.1.1...sdk-v0.1.2) (2026-10-29)

### Changed

* Doc comments since 0.1.1, with an example of `verifyWebhook`, and the README logo from assets.flung.dev.

## [0.1.1](https://github.com/flung-official/flung-sdk/compare/sdk-v0.1.0...sdk-v0.1.1) (2026-10-29)

### Changed

* Published under the `@flung.dev` scope from CI, with trusted publishing and a provenance statement.

## 0.1.0 (2026-10-29)

### Added

* The typed client for the Flung `/v1` API, generated from `spec/openapi.json`, with no runtime dependencies.
