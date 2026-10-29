# Workflows

CI for every change, and publishing to npm under `@flung.official` with trusted publishing.

## Standards

Workflows here follow:

- [Supply-chain provenance](../../.standards/docs/standards/core/supply-chain-provenance.md) - packages are built and published in CI, never from a laptop, with an npm provenance statement
- [Dependencies](../../.standards/docs/standards/core/dependencies.md) - actions pinned to a commit, a frozen lockfile, no install scripts

## Contents

| Path | Purpose |
|---|---|
| `ci.yml` | On a pull request and a push to `main`: install, audit, `pnpm check`, build, and pack every package. |
| `publish.yml` | On a tag `<package folder>-v<version>` (`connect-v0.1.0`, `sdk-v0.1.0`): checks the tag against the package's version, runs `pnpm check`, builds, and publishes with OIDC. A version with a `-` (`0.2.0-beta.1`) goes to the `next` dist-tag, any other to `latest`. |

## Publishing a package

| Step | Who | What |
|---|---|---|
| 1 | Owner, once | On npmjs.com, create the organisation `flung.official`. |
| 2 | Owner, once | In GitHub, add the environment `npm` to this repository (add required reviewers to approve each publish). |
| 3 | Owner, once a package | In the package's settings on npm, add a trusted publisher: GitHub Actions, organisation `flung-official`, repository `flung-sdk`, workflow `publish.yml`, environment `npm`. If npm offers this only for a package that exists, publish the first version once by hand and set the trusted publisher straight after. |
| 4 | Anyone with push | Set `version` in the package's `package.json`, merge, then push the tag: `git tag connect-v0.1.0 && git push origin connect-v0.1.0` (`sdk-v...` for the client). |
| 5 | Owner, after the first trusted publish | In the package's settings on npm, require two-factor authentication and disallow tokens, so only this workflow can publish. |
