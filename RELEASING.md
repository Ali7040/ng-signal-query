# Releasing

`@ali7040/ng-signal-query` is published to the **npm registry automatically** by
CI when a GitHub Release is published. You no longer publish from your machine.

## One-time setup (repo owner)

Add a repository secret named **`NPM_TOKEN`**:

1. Create an npm access token at <https://www.npmjs.com/settings/~/tokens>.
   - **Granular token:** permissions **Read and write**, scoped to
     `@ali7040/ng-signal-query`, with **Bypass 2FA** checked and no IP restrictions.
   - **Classic → Automation** works too and never expires.
2. In GitHub: *Settings → Secrets and variables → Actions → New repository secret*
   (the **Secrets** tab — never *Variables*, which are stored in plaintext).
   Name it `NPM_TOKEN` and paste the token.

### ⚠️ Token expiry

The current token is a 90-day granular token created **1 Aug 2026**, so it expires
around **30 Oct 2026**.

When it expires, `Publish to npm` fails with a `401 Unauthorized`. The fix is to
generate a new token and update the `NPM_TOKEN` secret — no code change needed.

> Set a calendar reminder ~1 week before expiry. To avoid this recurring, switch to
> a Classic **Automation** token, which does not expire.

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
