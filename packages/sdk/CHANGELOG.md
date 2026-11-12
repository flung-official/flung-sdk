# Changelog

Every version of `@flung.dev/sdk` on npm. From 0.2.0 on, release-please writes each section from the Conventional Commits that change `packages/sdk` (see RELEASING.md at the root of the repository).

## [0.10.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.9.0...sdk-v0.10.0) (2026-11-12)


### Added

* **sdk:** every endpoint the API has today ([28d8868](https://github.com/flung-official/flung-sdk/commit/28d88682714b3571f0034703842c50d325ed6769))

## [0.9.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.8.0...sdk-v0.9.0) (2026-11-06)


### Added

* **sdk:** drives, photos and linked files ([5b1bfbf](https://github.com/flung-official/flung-sdk/commit/5b1bfbf1d67761eb1f848d89a10c806c51c21c5d))

## [0.8.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.7.0...sdk-v0.8.0) (2026-11-06)


### Added

* **sdk:** send a post as a thread, and list posts by their counts ([c6ea822](https://github.com/flung-official/flung-sdk/commit/c6ea822dc6091451d0786bd08b12b4cf1a0a45c8))

## [0.7.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.6.0...sdk-v0.7.0) (2026-11-05)


### Added

* **sdk:** notifications, series, tags, composers and brand style ([2cb4aa7](https://github.com/flung-official/flung-sdk/commit/2cb4aa7e9299f0fe169a3ef41e257d8a0fc9dd78))

## [0.6.0](https://github.com/flung-official/flung-sdk/compare/sdk-v0.5.0...sdk-v0.6.0) (2026-10-31)


### Added

* **sdk:** connectFlow, consent or approval, on each platform ([e67aaa7](https://github.com/flung-official/flung-sdk/commit/e67aaa73cc1f7c7639600387bb7955b60167be7c))

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
