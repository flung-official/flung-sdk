# Workflows

CI for every change, releases from Conventional Commits with release-please, and publishing to npm under `@flung.dev` with trusted publishing.

## Standards

Workflows here follow:

- [Supply-chain provenance](../../.standards/docs/standards/core/supply-chain-provenance.md) - packages are built and published in CI, never from a laptop, with an npm provenance statement
- [Dependencies](../../.standards/docs/standards/core/dependencies.md) - actions pinned to a commit, a frozen lockfile, no install scripts

## Contents

| Path | Purpose |
|---|---|
| `ci.yml` | On a pull request and a push to `main`: install, audit, `pnpm check`, build, and pack every package; then installs each app in `examples/` from its lockfile with the packed packages swapped in, type checks it and builds it. |
| `release-please.yml` | On a push to `main`, a passing CI run on `main`, and by hand: keeps one release PR current from the Conventional Commits since each package's last release; once CI passes on the tip of `main`, merges it, tags `connect-v<version>` / `sdk-v<version>`, creates the GitHub releases, and dispatches `publish.yml` on each new tag. `AUTO_RELEASE=false` leaves the merge to a person. See [RELEASING.md](../../RELEASING.md). |
| `publish.yml` | On a tag `<package folder>-v<version>` (`connect-v0.1.0`, `sdk-v0.1.0`), pushed or dispatched by `release-please.yml` (or by hand on a tag, to retry): checks the tag against the package's version, runs `pnpm check`, builds, and publishes with OIDC. A version with a `-` (`0.2.0-beta.1`) goes to the `next` dist-tag, any other to `latest`. |
| `no-ai-coauthors.yml` | On every push and pull request: fails when a commit credits an AI tool. |

## Publishing a package

| Step | Who | What |
|---|---|---|
| 1 | Owner, once (done) | On npmjs.com, the organisation `flung.dev`. |
| 2 | Owner, once (done) | In GitHub, the environment `npm` on this repository (add required reviewers there to approve each publish). |
| 3 | Owner, once a package | In the package's settings on npm, add a trusted publisher: GitHub Actions, organisation `flung-official`, repository `flung-sdk`, workflow `publish.yml`, environment `npm`. If npm offers this only for a package that exists, publish the first version once by hand and set the trusted publisher straight after. |
| 4 | Anyone with push | Commit with Conventional Commits (`feat(connect): ...`, `fix(sdk): ...`) and push to `main`. `release-please.yml` versions, tags and dispatches `publish.yml`; see [RELEASING.md](../../RELEASING.md). Pushing a tag by hand still publishes, as the fallback. |
| 5 | Owner, after the first trusted publish | In the package's settings on npm, require two-factor authentication and disallow tokens, so only this workflow can publish. |
