# Contributing to ng-signal-query

Thank you for your interest in contributing to **ng-signal-query**! We're excited to have you join our community. This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

We are committed to providing a welcoming and safe environment for all contributors. We expect all participants to:

- Be respectful and inclusive
- Avoid discriminatory language
- Foster a collaborative atmosphere
- Report violations to the maintainers

## Getting Started

### Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9.0 or **pnpm**
- **Angular** >= 21.1.0
- **TypeScript** >= 5.9
- Git

### Fork and Clone

1. Fork this repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ng-signal-query.git
   cd ng-signal-query
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ali7040/ng-signal-query.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Build the Library

```bash
npm run build
```

### Run Examples

```bash
npm run start
```

Browse to http://localhost:4200 to see the examples.

### Run Tests

```bash
npm run test
```

## Making Changes

### Create a Feature Branch

Before making changes, create a new branch:

```bash
git checkout -b feature/my-feature
# or for bug fixes
git checkout -b fix/my-bug-fix
```

### Branch Naming Convention

- **Features**: `feature/short-description`
- **Bug Fixes**: `fix/short-description`
- **Documentation**: `docs/short-description`
- **Performance**: `perf/short-description`
- **Refactoring**: `refactor/short-description`

### Code Style

We follow Angular's style guide and TypeScript best practices:

- Use **PascalCase** for class names
- Use **camelCase** for variables and functions
- Use **SCREAMING_SNAKE_CASE** for constants
- Keep lines under 100 characters
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Quality

- Write clean, readable, and maintainable code
- Follow DRY (Don't Repeat Yourself) principle
- Use TypeScript strict mode
- Avoid `any` types where possible
- Use signals over observables when appropriate

## Commit Guidelines

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (prettier, formatting)
- **refactor**: Code change that neither fixes bugs nor adds features
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, etc.

### Examples

```bash
# Feature
git commit -m "feat(query): add staleTime support for queries"

# Bug fix
git commit -m "fix(mutation): resolve memory leak in mutation cleanup"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple lines
git commit -m "feat(cache): implement smart cache invalidation

Implement automatic cache invalidation based on query key patterns.
This allows for more efficient cache management and reduces memory usage."
```

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests locally**:
   ```bash
   npm run test
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Lint your code** (if available):
   ```bash
   npm run lint
   ```

### Submit Your PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/my-feature
   ```

2. Create a Pull Request on GitHub with:
   - Clear title describing the changes
   - Reference related issues (use #issue-number)
   - Description of what changed and why
   - Screenshots or examples if applicable

3. Ensure all CI checks pass

### PR Review Process

- A maintainer will review your PR
- Address feedback and suggestions
- Update your PR with requested changes
- Keep commit history clean (squash if necessary)
- PR will be merged once approved

## Testing

### Write Tests

- Write tests for new features
- Write tests for bug fixes
- Maintain >80% code coverage
- Place tests in the same directory as the code

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

## Documentation

### Update Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md with your changes
- Add examples if adding new features

### Documentation Format

```typescript
/**
 * Fetches user data from the server.
 * 
 * @param userId - The ID of the user to fetch
 * @returns A promise resolving to user data
 * 
 * @example
 * const userData = await getUser('123');
 */
export function getUser(userId: string): Promise<User> {
  // implementation
}
```

## Reporting Bugs

### Create an Issue

1. Use the bug report template
2. Provide a clear title
3. Describe the bug in detail
4. Include steps to reproduce
5. Attach error messages and screenshots
6. Specify your environment (Angular version, Node version, etc.)

### Example

```markdown
## Bug Report

**Description**: Query fails when using special characters in keys

**Steps to Reproduce**:
1. Create a query with key `['user@domain.com']`
2. The query throws an error

**Expected Behavior**: Query should work with any valid string

**Actual Behavior**: Error thrown: "Invalid query key"

**Environment**:
- Angular: 21.1.0
- ng-signal-query: 0.0.1
- Node: 18.0.0
```

## Suggesting Features

### Create a Feature Request

1. Use the feature request template
2. Describe the feature clearly
3. Explain the use case
4. Provide examples or mockups
5. Discuss potential implementations

### Example

```markdown
## Feature Request

**Title**: Add retry mechanism for failed queries

**Description**: Allow automatic retry of failed queries with exponential backoff

**Use Case**: Users lose connection briefly; queries should retry automatically

**Proposed Solution**:
```typescript
createQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data'),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

## Maintainers

- **Ali** ([@ali7040](https://github.com/ali7040)) - Lead maintainer

## License

By contributing to this project, you agree that your contributions will be licensed under its MIT License.

## Questions?

- Open a GitHub Discussion
- Create an Issue
- Email: support@example.com

---

**Thank you for contributing to ng-signal-query!** 🙏
