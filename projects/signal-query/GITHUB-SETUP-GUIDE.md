# GitHub Repository Setup Guide

A comprehensive guide to set up your **ng-signal-query** GitHub repository professionally.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Repository Settings](#repository-settings)
3. [Branch Protection](#branch-protection)
4. [Issue Templates](#issue-templates)
5. [Pull Request Templates](#pull-request-templates)
6. [Badges & Status](#badges--status)
7. [GitHub Actions/CI-CD](#github-actionsci-cd)
8. [Project Board](#project-board)
9. [Documentation](#documentation)

---

## Initial Setup

### 1. Create Repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `ng-signal-query`
3. **Description**: `A powerful, type-safe querying library for Angular applications built with signals.`
4. **Visibility**: Public
5. **Initialize with**:
   - ✅ Add a README file
   - ✅ Add .gitignore (Node)
   - ✅ Choose a license (MIT)
6. Click **Create repository**

### 2. Clone to Local Machine

```bash
git clone https://github.com/YOUR_USERNAME/ng-signal-query.git
cd ng-signal-query
```

### 3. Push Your Code

```bash
git add .
git commit -m "Initial commit: add ng-signal-query library"
git push origin main
```

---

## Repository Settings

### Access https://github.com/YOUR_USERNAME/ng-signal-query/settings

### 1. General Settings

- **Default branch**: `main`
- **Template repository**: Unchecked
- **Issues**: ✅ Enabled
- **Discussions**: ✅ Enable (for community)
- **Projects**: ✅ Enable
- **Wiki**: ❌ Disabled (use docs instead)
- **Sponsorships**: ✅ Enable

### 2. Collaborators and Teams

- Add core team members with appropriate roles
  - **Maintain**: Can manage PRs and releases
  - **Triage**: Can manage issues and PRs
  - **Write**: Can push to branches
  - **Read**: View-only access

### 3. Secrets and Variables

Store tokens for CI/CD:

**Settings → Secrets and variables → Actions → New repository secret**

```
NPM_TOKEN = your_npm_automation_token
GITHUB_TOKEN = automatically available
```

---

## Branch Protection

### Protect Main Branch

**Settings → Branches → Add rule**

1. **Branch name pattern**: `main`
2. **Protect matching branches**:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require code reviews before merging (required: 1)
   - ✅ Require review from code owners
   - ✅ Require status checks to pass
   - ✅ Include administrators

### Code Owners

Create `.github/CODEOWNERS`:

```
# All files
* @ali7040

# Specific paths
/projects/signal-query/src/ @ali7040
/docs/ @ali7040

# GitHub team
* @organization/core-team
```

---

## Issue Templates

Create `.github/ISSUE_TEMPLATE/`

### 1. Bug Report

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: "[BUG] "
labels: bug
assignees: ''
---

## Description
<!-- Brief description of the bug -->

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- ng-signal-query version: 
- Angular version: 
- TypeScript version: 
- Node version: 
- OS: 

## Screenshots
<!-- If applicable -->

## Error Messages
```
<!-- Paste error message or stack trace -->
```

## Additional Context
<!-- Any additional information -->
```

### 2. Feature Request

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: "[FEATURE] "
labels: enhancement
assignees: ''
---

## Description
<!-- Clear description of the feature -->

## Problem Statement
<!-- What problem does this solve? -->

## Proposed Solution
<!-- How should this be implemented? -->

## Alternatives Considered
<!-- Any alternative approaches? -->

## Additional Context
<!-- Any other information -->

## Code Example
```typescript
// Example usage of the proposed feature
```
```

### 3. Documentation Issue

Create `.github/ISSUE_TEMPLATE/docs.md`:

```markdown
---
name: Documentation Issue
about: Report a documentation problem
title: "[DOCS] "
labels: documentation
assignees: ''
---

## Document
<!-- Which doc has the issue? -->

## Problem
<!-- What's wrong or confusing? -->

## Suggested Fix
<!-- How should it be fixed? -->

## Links
<!-- Link to the problematic documentation -->
```

---

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Clear description of changes -->

## Related Issue
<!-- Link issue: Fixes #123 -->

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Changes
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Testing
<!-- How was this tested? -->

## Screenshots
<!-- If applicable -->

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings generated

## Breaking Changes
<!-- Any breaking changes? Describe migration path. -->

## Reviewer Notes
<!-- Information for reviewers -->
```

---

## Badges & Status

Add to README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/@ali7040/ng-singal-query?style=flat-square)](https://www.npmjs.com/package/@ali7040/ng-singal-query)
[![downloads](https://img.shields.io/npm/dm/@ali7040/ng-singal-query?style=flat-square)](https://www.npmjs.com/package/@ali7040/ng-singal-query)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![twitter](https://img.shields.io/twitter/follow/ali7040?style=flat-square)](https://twitter.com/ali7040)
```

### Badge Sources

- **npm**: https://shields.io/
- **GitHub**: https://github.com/badges/shields
- **Build Status**: https://img.shields.io/

---

## GitHub Actions/CI-CD

Create `.github/workflows/`

### 1. Tests Workflow

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm install
      
      - name: Run linter
        run: npm run lint --if-present
      
      - name: Run tests
        run: npm run test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 2. Build Workflow

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
```

### 3. Publish Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

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
```

---

## Project Board

### Setup GitHub Project Board

1. Go to **Projects** tab
2. Click **New project**
3. Choose **Table** template
4. Add columns:
   - **Backlog** - Ideas and feature requests
   - **Todo** - Ready to work on
   - **In Progress** - Currently being worked on
   - **Review** - Waiting for review
   - **Done** - Completed

### Automate with Rules

- Move PRs from Todo → In Progress when opened
- Move PRs to Review when ready for review
- Move PRs to Done when merged

---

## Documentation

### Create `/docs` folder

```
docs/
├── README.md
├── GETTING_STARTED.md
├── API.md
├── EXAMPLES.md
└── TROUBLESHOOTING.md
```

### Enable GitHub Pages

1. **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`
4. **Folder**: `/docs`
5. Create `docs/index.html` or use Jekyll theme

---

## Repository Structure

```
ng-signal-query/
├── .github/
│   ├── workflows/
│   │   ├── tests.yml
│   │   ├── build.yml
│   │   └── publish.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── docs.md
│   └── pull_request_template.md
├── projects/
│   └── signal-query/
│       ├── src/
│       ├── examples/
│       ├── package.json
│       ├── README.md
│       ├── CONTRIBUTING.md
│       ├── CHANGELOG.md
│       ├── LICENSE
│       └── GITHUB-RELEASE-GUIDE.md
├── dist/
├── docs/
├── .gitignore
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] Branch protection enabled
- [ ] Issue templates created
- [ ] PR template created
- [ ] GitHub Actions workflows configured
- [ ] NPM_TOKEN added to secrets
- [ ] Badges added to README
- [ ] GitHub Pages enabled (optional)
- [ ] Project board created
- [ ] Code owners file created
- [ ] Release/tag created with notes

---

## Quick Links

- [GitHub Docs](https://docs.github.com/)
- [GitHub Actions](https://github.com/features/actions)
- [Shields.io](https://shields.io/)
- [Semantic Versioning](https://semver.org/)

---

**Your professional GitHub repository is now ready!** 🚀
