# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Features and changes being developed

### Changed
- Modifications to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes and improvements

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
