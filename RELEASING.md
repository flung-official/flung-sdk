# Releasing

How a commit on `main` becomes a version of `@flung.dev/connect` or `@flung.dev/sdk` on npm. Nobody bumps a version, writes a changelog or pushes a tag by hand: [release-please](https://github.com/googleapis/release-please) reads the commit messages and does it, in `.github/workflows/release-please.yml`, and `.github/workflows/publish.yml` publishes.

## TL;DR

| Question | Answer |
|---|---|
| How do I release a change? | Commit it as `feat(connect): ...` or `fix(sdk): ...` and push to `main`. When CI passes, the release PR is merged and the package is published. |
| What decides the version? | The commit types since the last release of that package: `fix` a patch, `feat` a minor, `!` or `BREAKING CHANGE:` a minor while the package is 0.x. |
| Which package does a commit release? | The one whose folder (`packages/connect`, `packages/sdk`) the commit changes. The scope is for people. |
| What are the tags? | `connect-v<version>` and `sdk-v<version>`, as before. |
| Can I stop a release? | Set the Actions variable `AUTO_RELEASE` to `false`, then merge the release PR yourself when ready. Required reviewers on the `npm` environment hold each publish for approval. |

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), as in the shared standard (`.standards/docs/standards/core/git-commits.md`):

```
<type>(<scope>)!: <subject>
```

| Type | In the changelog | Version |
|---|---|---|
| `feat` | Added | minor |
| `fix`, `perf` | Fixed | patch |
| `refactor`, `revert` | Changed | patch |
| `docs`, `test`, `build`, `ci`, `chore`, `style` | hidden | none |
| any type with `!`, or a `BREAKING CHANGE:` footer | its section, flagged breaking | minor while 0.x (`bump-minor-pre-major`), then major |

| Scope | For |
|---|---|
| `connect` | `packages/connect` |
| `sdk` | `packages/sdk` |
| `deps` | dependency updates (Renovate writes `chore(deps)` and `fix(deps)`) |
| `ci` | `.github/` |
| `docs` | READMEs and docs outside a package |
| `examples`, `spec`, `demo` | `examples/`, `spec/`, `tools/demo/` |
| `release`, `main` | release housekeeping |

The header is at most 72 characters with no full stop. A commit that changes both packages releases both, and `fix(connect,sdk): ...` says so.

`.githooks/commit-msg` checks this, and refuses a line that credits an AI tool, before git records the commit. Install it once per clone:

```sh
git config core.hooksPath .githooks
```

`SKIP_COMMIT_MSG=1 git commit ...` bypasses it in an emergency. Squash-merged pull requests use the PR title as the commit, so give the PR a Conventional Commit title too.

A non-conventional commit is skipped by release-please: it is neither in the changelog nor a reason to release.

## What happens, step by step

| # | When | What | Who |
|---|---|---|---|
| 1 | A `feat` or `fix` lands on `main` | release-please opens or updates one release PR, `chore: release main`, that sets each package's new `version` in `package.json`, adds its section to `packages/<name>/CHANGELOG.md`, and records the version in `.release-please-manifest.json`. | `release-please.yml`, on the push |
| 2 | CI passes on that commit, and it is still the tip of `main` | The workflow merges the release PR (squash). | `release-please.yml`, on `workflow_run` of CI |
| 3 | Right after the merge, in the same run | release-please tags the merge commit `connect-v<version>` / `sdk-v<version>` and creates a GitHub release per package, with the changelog section as its notes. | `release-please.yml` |
| 4 | Right after, in the same run | It dispatches `publish.yml` on each new tag. | `release-please.yml` |
| 5 | `publish.yml` on the tag | Checks the tag equals the package's `package.json` version, runs `pnpm check`, builds, and runs `npm publish` with trusted publishing and a provenance statement. `latest` dist-tag, or `next` for a version with a `-`. Waits for approval if the `npm` environment has required reviewers. | `publish.yml`, environment `npm` |

With `AUTO_RELEASE=false`, step 2 is yours: merge the release PR on GitHub. The push of that merge runs `release-please.yml`, which does steps 3 to 5.

Why a dispatch and not a tag push: the merge and the tags are made with `GITHUB_TOKEN`, and GitHub starts no workflow from a push made with that token. `workflow_dispatch` is the documented exception. Why not `workflow_call`: npm's trusted publishing checks the top-level workflow of the run, so a publish called from `release-please.yml` would be checked as `release-please.yml`, not `publish.yml` ([npm/documentation#1755](https://github.com/npm/documentation/issues/1755)). Dispatched, `publish.yml` is its own run and the trusted publisher on npm stays valid.

## When something goes wrong

| Problem | Do this |
|---|---|
| A publish failed after the tag and the GitHub release were made | Actions > Publish > Run workflow, "Use workflow from" the tag (such as `connect-v0.3.0`). Or `gh workflow run publish.yml --ref connect-v0.3.0`. |
| The release PR proposes the wrong version | Add a commit with a `Release-As: 1.2.3` footer that changes a file in that package, or edit the PR's `package.json` and `CHANGELOG.md` before merging. |
| A release PR is open but nothing merges it | `AUTO_RELEASE` is `false`, CI failed on the tip of `main`, or `main`'s rules refuse a merge from GitHub Actions. Merge it by hand, or run Actions > release-please > Run workflow. |
| You must publish with release-please off | Set the `version`, merge, push the tag yourself (`git tag sdk-v0.2.1 && git push origin sdk-v0.2.1`); `publish.yml` still runs on a tag push. Then set the same version in `.release-please-manifest.json`, or the next release PR starts from the old one. |

## The first release (bootstrap)

npm has `@flung.dev/connect` 0.1.2 and `@flung.dev/sdk` 0.1.3; their tags `connect-v0.1.2` and `sdk-v0.1.3` are on GitHub. `package.json` already says connect 0.3.0 and sdk 0.2.0 (connect 0.1.3 and 0.2.0 were never published, and the local tag `connect-v0.2.0` was never pushed). So:

- `.release-please-manifest.json` holds the last published versions, 0.1.2 and 0.1.3. release-please finds the commit of each through its tag.
- The commits since then were not Conventional Commits, so release-please would skip them. Two commits, `docs(connect): ...` and `docs(sdk): ...`, start each package's `CHANGELOG.md` with its published history and carry the unreleased changes as Conventional Commits in their message body (release-please reads each `feat(...)`/`fix(...)` paragraph of a message as its own commit), with a `Release-As: 0.3.0` / `Release-As: 0.2.0` footer.
- The first release PR therefore proposes exactly connect 0.3.0 and sdk 0.2.0. The `Release-As` footers sit before those releases, so they never apply again: nothing needs to be removed afterwards.

Delete the stale local tag before you push tags from this clone, or `git push --tags` would publish connect 0.2.0: `git tag -d connect-v0.2.0`.

## Owner settings

| Where | Setting | Why |
|---|---|---|
| GitHub: Settings > Actions > General > Workflow permissions | "Allow GitHub Actions to create and approve pull requests" on | release-please opens the release PR with `GITHUB_TOKEN`. |
| GitHub: Settings > Rules / Branches, `main` | No rule that requires a review or status checks for GitHub Actions, or GitHub Actions on the bypass list | The workflow merges the release PR with `GITHUB_TOKEN`. A PR opened with that token gets no CI run of its own, so a required check would never report. Its commits already passed CI on `main`. |
| GitHub: Settings > Environments > `npm` | Optional required reviewers; if it limits deployment branches and tags, allow tags `connect-v*` and `sdk-v*` | Each publish waits for approval; the dispatched run's ref is the tag. |
| GitHub: Settings > Secrets and variables > Actions > Variables | `AUTO_RELEASE` = `false` to merge release PRs by hand (unset: merged when CI passes) | The switch. |
| npm: each package > Settings > Trusted publishing | GitHub Actions, organisation `flung-official`, repository `flung-sdk`, workflow `publish.yml`, environment `npm` | Unchanged: publishing still runs in `publish.yml`. If that file is ever renamed, or publishing moves into another workflow, update this on npmjs.com for both packages first, or every publish fails. |
