# Releasing

`@ali7040/ng-signal-query` is published to the **npm registry automatically** by
CI when a GitHub Release is published. You no longer publish from your machine.

## One-time setup (repo owner)

Publishing uses **npm Trusted Publishing (OIDC)** — there is **no token or secret
to create, rotate, or leak**, and nothing that expires.

On <https://www.npmjs.com>, open the package →
*Settings → Trusted Publisher → GitHub Actions*, and enter:

| Field | Value |
|-------|-------|
| Organization or user | `Ali7040` |
| Repository | `ng-signal-query` |
| Workflow filename | `publish-npm.yml` |
| Environment | *(leave empty)* |

That's it. npm will then accept publishes **only** from this repository's
`publish-npm.yml` workflow, and provenance is attached automatically.

> **Why not an access token?** npm explicitly warns against 2FA-bypass tokens for
> CI. A token is a long-lived secret that can leak and (for granular tokens)
> expires — silently breaking releases. OIDC has neither problem.

## Cutting a release

1. Bump the version in [`projects/signal-query/package.json`](./projects/signal-query/package.json)
   (e.g. `0.0.2` → `0.1.0`). Follow [semver](https://semver.org/).
2. Update [`CHANGELOG.md`](./projects/signal-query/CHANGELOG.md).
3. Commit and merge to `main` via PR.
4. Create a **GitHub Release** with a tag that matches the version (e.g. `v0.1.0`).

Publishing the Release triggers [`.github/workflows/publish-npm.yml`](./.github/workflows/publish-npm.yml),
which builds, tests, and runs `npm publish` with [provenance](https://docs.npmjs.com/generating-provenance-statements).

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`ci.yml`](./.github/workflows/ci.yml) | push / PR to `main`, `dev` | Build the library and run the test suite |
| [`publish-npm.yml`](./.github/workflows/publish-npm.yml) | GitHub Release published (or manual) | Publish to the npm registry |
| [`publish-github-packages.yml`](./.github/workflows/publish-github-packages.yml) | GitHub Release published (or manual) | Publish to GitHub Packages |

## Manual fallback

The local script still works if you ever need it:

```bash
npm run release:npm
```
