# GitHub Release Guide for ng-signal-query

This guide explains how to create professional GitHub releases for your ng-signal-query package.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Release Workflow](#release-workflow)
3. [Step-by-Step Instructions](#step-by-step-instructions)
4. [Release Notes Template](#release-notes-template)
5. [Automation](#automation)

---

## Prerequisites

- ✅ Already published on npm: **@ali7040/ng-singal-query@0.0.1**
- GitHub repository created
- Changes committed and pushed to GitHub
- Version bumped in `package.json`
- CHANGELOG.md updated

---

## Release Workflow

```
1. Bump Version
   ↓
2. Update CHANGELOG.md
   ↓
3. Commit & Push Changes
   ↓
4. Create Git Tag
   ↓
5. Push Tags to GitHub
   ↓
6. Create GitHub Release
   ↓
7. Publish Release Notes
   ↓
8. Update Documentation (optional)
```

---

## Step-by-Step Instructions

### Step 1: Update Version Number

Edit `projects/signal-query/package.json`:

```json
{
  "name": "@ali7040/ng-singal-query",
  "version": "0.0.2",
  ...
}
```

**Version Format**: `MAJOR.MINOR.PATCH`
- `0.0.1` → `0.0.2` (patch fix)
- `0.0.2` → `0.1.0` (minor feature)
- `0.1.0` → `1.0.0` (major breaking change)

### Step 2: Update CHANGELOG.md

```markdown
## [0.0.2] - 2026-03-29

### Added
- New feature: Retry mechanism for failed queries
- Support for custom cache strategies

### Fixed
- Fixed memory leak in mutation cleanup
- Fixed query key serialization with special characters

### Changed
- Improved error messages for better debugging
```

### Step 3: Commit Changes

```bash
cd c:\Users\DELL\ng-signal-query

git add projects/signal-query/package.json projects/signal-query/CHANGELOG.md
git commit -m "chore(release): bump version to 0.0.2"
git push origin main
```

### Step 4: Create Git Tag

```bash
git tag -a v0.0.2 -m "Release version 0.0.2"
# or with more description
git tag -a v0.0.2 -m "Release version 0.0.2

- Added retry mechanism
- Fixed memory leak
- Improved error messages"
```

### Step 5: Push Tag to GitHub

```bash
git push origin v0.0.2
# or push all tags
git push origin --tags
```

### Step 6: Create GitHub Release

#### **Method 1: Via GitHub Web UI (Easiest)**

1. Go to: https://github.com/YOUR_USERNAME/ng-signal-query
2. Click **"Releases"** on the right sidebar
3. Click **"Create a new release"** or **"Draft a new release"**
4. Fill in:
   - **Tag version**: `v0.0.2`
   - **Release title**: `Release 0.0.2 - Feature Updates`
   - **Release notes**: (See template below)
5. Optionally attach binary files (dist folder zip)
6. Click **"Publish release"**

#### **Method 2: Via GitHub CLI**

Install GitHub CLI: https://cli.github.com/

```bash
# Create release with file
gh release create v0.0.2 --title "Release 0.0.2" --notes-file CHANGELOG.md

# Or with inline notes
gh release create v0.0.2 \
  --title "Release 0.0.2 - Feature Updates" \
  --notes "See CHANGELOG.md for details"
```

#### **Method 3: List All Releases**

```bash
gh release list
```

---

## Release Notes Template

### For Patch Release (v0.0.1 → v0.0.2)

```markdown
# Release 0.0.2 - Bug Fixes & Improvements

## What's New

### 🐛 Bug Fixes
- Fixed memory leak in mutation cleanup
- Fixed query key serialization with special characters
- Fixed DevTools component rendering on SSR

### ✨ Improvements
- Improved error messages for better debugging
- Enhanced performance of query cache lookups
- Better TypeScript error reporting

### 📚 Documentation
- Updated examples with new features
- Added troubleshooting guide

### 🙏 Contributors
- Thanks to @contributor-name for the bug reports and fixes

## Installation

```bash
npm install @ali7040/ng-singal-query@0.0.2
```

## Changelog

See [CHANGELOG.md](https://github.com/ali7040/ng-signal-query/blob/main/CHANGELOG.md) for full details.

## Links

- 📦 [NPM Package](https://www.npmjs.com/package/@ali7040/ng-singal-query)
- 📖 [Documentation](https://github.com/ali7040/ng-signal-query/blob/main/README.md)
- 🤝 [Contributing](https://github.com/ali7040/ng-signal-query/blob/main/CONTRIBUTING.md)
```

### For Minor Release (v0.0.2 → v0.1.0)

```markdown
# Release 0.1.0 - Retry Mechanism & Cache Strategies

## 🎉 Major Features

### Retry Mechanism
- Automatic retry for failed queries with exponential backoff
- Configurable retry count and delay strategy
- Works with both queries and mutations

```typescript
createQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data'),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Custom Cache Strategies
- LRU (Least Recently Used) cache strategy
- TTL (Time To Live) cache invalidation
- Custom adapter support for third-party caches

## 🐛 Bug Fixes
- Fixed memory leak in mutation cleanup
- Fixed query key serialization with special characters
- Fixed DevTools component rendering on SSR

## ✨ Improvements
- Improved error messages
- Enhanced performance
- Better TypeScript support

## 📊 Stats
- 50+ commits since last release
- 10+ new features
- 5+ bug fixes
- 100% test coverage maintained

## Installation

```bash
npm install @ali7040/ng-singal-query@0.1.0
```

**Breaking Changes**: None

## Migration Guide

No breaking changes in this release. Just update and enjoy new features!

## Changelog

[CHANGELOG.md](../CHANGELOG.md)

## Thank You

Special thanks to all contributors and the community!
```

### For Major Release (v0.1.0 → v1.0.0)

```markdown
# Release 1.0.0 - Stable Production Release 🚀

## 🎉 This is the First Stable Release!

After extensive testing and feedback from the community, ng-signal-query is ready for production use.

## ⚠️ Breaking Changes

### Query API Changes
```typescript
// OLD (0.x)
createQuery({ key: 'users', fn: () => fetch(...) })

// NEW (1.x)
createQuery({ queryKey: ['users'], queryFn: () => fetch(...) })
```

### Mutation Options
```typescript
// OLD: mutationFn returns Observable
mutationFn: (data) => http.post('/api/users', data)

// NEW: mutationFn can return Promise or Observable
mutationFn: async (data) => fetch(...).then(r => r.json())
```

## Migration Guide

See [MIGRATION.md](../MIGRATION.md) for detailed upgrade instructions.

## 🎯 Features

- ✅ Type-safe query management
- ✅ Signal-driven architecture
- ✅ Infinite queries with pagination
- ✅ Automatic caching & invalidation
- ✅ Mutations with optimistic updates
- ✅ DevTools for debugging
- ✅ SSR support
- ✅ 100% TypeScript coverage
- ✅ Zero external dependencies (except Angular & RxJS)

## 📊 Achievements

- 1000+ npm downloads
- 100% test coverage
- Comprehensive documentation
- Production-ready

## Installation

```bash
npm install @ali7040/ng-singal-query@1.0.0
```

## Resources

- 📚 [Documentation](https://github.com/ali7040/ng-signal-query)
- 🤝 [Contributing](https://github.com/ali7040/ng-signal-query/blob/main/CONTRIBUTING.md)
- 🐛 [Issue Tracker](https://github.com/ali7040/ng-signal-query/issues)

## Thank You 🙏

This release wouldn't be possible without our amazing community!

---

**ng-signal-query is now production-ready!** 🎊
```

---

## Automation

### Using GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Publish Release

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish dist/signal-query --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
```

---

## Checklist for Each Release

- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] Changes committed and pushed
- [ ] Git tag created: `git tag -a v0.0.2 -m "Release message"`
- [ ] Tag pushed: `git push origin v0.0.2`
- [ ] GitHub release created with proper notes
- [ ] NPM package published: `npm publish --access public`
- [ ] Documentation updated if needed
- [ ] Announcement made (Twitter, Discord, etc.)

---

## Quick Reference

```bash
# 1. Update version in package.json

# 2. Update CHANGELOG.md

# 3. Commit
git add .
git commit -m "chore(release): bump version to 0.0.2"
git push origin main

# 4. Create tag
git tag -a v0.0.2 -m "Release version 0.0.2"

# 5. Push tag
git push origin v0.0.2

# 6. Build and publish
npm run build
cd dist/signal-query
npm publish --access public

# 7. Create GitHub Release (via web UI or gh cli)
```

---

**Happy Releasing!** 🚀

For more info: [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
