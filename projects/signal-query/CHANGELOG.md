# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

> **No breaking changes.** Upgrading from `0.0.2` requires no code changes.
> New behavior (retry/backoff) is **opt-in**; defaults preserve existing behavior.

### Fixed
- **Race condition in queries** — a slow, older response could overwrite fresher
  data in the cache. Fetches now carry a generation and only the latest one commits.
- **Duplicate requests** — two components using the same query key fired two
  network requests. Concurrent fetches for a key now share a single in-flight request.
- **`createSignalQuery` cache divergence** — it kept a private copy of state instead
  of sharing the cache entry, so `setQueryData()` and invalidation could be missed.

### Added
- **Request cancellation** — fetchers receive a `QueryFunctionContext` with an
  `AbortSignal`: `fetcher: ({ signal }) => fetch(url, { signal })`. A forced refetch
  or a key change aborts the request it supersedes. Zero-argument fetchers still work.
- **Retry with exponential backoff** (opt-in) — `retry` and `retryDelay` options on
  queries and mutations. Defaults to `0` (no retries), matching previous behavior.
  Set `retry: 3` to enable; the default delay is 1s → 2s → 4s, capped at 30s.
- Exported `RetryValue`, `RetryDelayValue`, `QueryFunctionContext`, `defaultRetryDelay`,
  and `AbortError`.
- Backward-compatibility test suite pinning the pre-0.1.0 public behavior.

### Added — MutationConcurrencyStrategy
- **MutationConcurrencyStrategy** — new `concurrencyStrategy` option for `createMutation()` controlling how overlapping `mutate()` calls are handled.
  - `merge` (default): run all mutations in parallel (preserves existing behavior).
  - `concat`: queue mutations and execute one at a time, in order.
  - `switch`: discard results of previous in-flight mutation when a new call arrives.
  - `exhaust`: ignore new `mutate()` calls while one is already running.
- Exported `MutationConcurrencyStrategy` type from public API.
- Comprehensive unit tests for all 4 concurrency strategy modes including race-condition and optimistic-update compatibility tests.

---

## [0.0.2] - 2026-03-28

### Fixed
- Bumped package version to allow publishing a new immutable artifact to npm and GitHub Packages.

---

## [0.0.1] - 2026-03-28

### Added
- Initial release of ng-signal-query
- Core `QueryClient` service for managing queries and mutations
- `createQuery()` function for simple data fetching
- `createSignalQuery()` function for signal-based reactive queries
- `createInfiniteQuery()` for paginated data loading
- `createMutation()` for server mutations
- Built-in query caching mechanism with automatic invalidation
- `QueryCache` for managing cached queries
- SSR support with hydration
- DevTools component for debugging queries and mutations in development
- RxJS adapter for custom HTTP client integration
- TypeScript support with strict typing
- Signal-driven architecture using Angular signals
- Comprehensive documentation and examples

### Features
- **Type-Safe**: Full TypeScript support with strict typing
- **Signal-Driven**: Built on Angular signals for optimal performance
- **Automatic Caching**: Smart query result caching with configurable strategies
- **Infinite Queries**: Seamless pagination with automatic data accumulation
- **Mutations**: Server state mutations with optimistic updates
- **DevTools**: Built-in debugging component for development
- **Lightweight**: Minimal bundle size with zero unnecessary dependencies
- **SSR Ready**: Server-side rendering support with hydration
- **Adapter Pattern**: Custom adapters for different HTTP clients

### Documentation
- Comprehensive README with quick start guide
- API documentation
- Examples directory with working code samples
- Contributing guidelines
- Changelog

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Format
- `v0.0.1` = Version 0.0.1
- `v1.0.0` = Version 1.0.0

---

## Template for New Releases

Use this template when creating new release notes:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature 1
- New feature 2

### Changed
- Changed behavior 1
- Changed behavior 2

### Fixed
- Fixed bug 1
- Fixed bug 2

### Breaking Changes
- Describes any breaking changes

### Migration Guide
- Instructions for upgrading from previous versions

### Contributors
- Thanks to contributors
```

---

## How to Release

1. Update version in `projects/signal-query/package.json`
2. Update this CHANGELOG.md with changes
3. Create a git commit: `git commit -m "chore: release v0.0.2"`
4. Create a git tag: `git tag v0.0.2`
5. Push changes: `git push origin main --tags`
6. Create GitHub release from tag
7. Run: `npm run build && npm publish --access public` from dist folder

---

**All notable changes to this project are documented above.**
