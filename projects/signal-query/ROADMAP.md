# ng-signal-query Roadmap

This roadmap is designed for a professional, issue-driven workflow with clean branching and predictable releases.

## Goal

Move from direct commits on main to a structured delivery model:
- 1 issue = 1 branch = 1 pull request
- small, reviewable changes
- milestone-based releases

## Workflow Upgrade (Do This First)

### Step 1: Protect main branch
- Enable branch protection for main in GitHub settings.
- Require pull request before merge.
- Require at least 1 approval.
- Require status checks (build + test).
- Disable force push.

### Step 2: Standardize issue labels
Create these labels:
- type:feature
- type:bug
- type:docs
- type:infra
- priority:high
- priority:medium
- priority:low
- status:blocked
- status:ready
- status:in-progress

### Step 3: Standardize branch naming
Use these branch prefixes:
- feat/<issue-number>-<short-name>
- fix/<issue-number>-<short-name>
- docs/<issue-number>-<short-name>
- chore/<issue-number>-<short-name>

Examples:
- feat/42-mutation-concurrency-strategy
- fix/51-cache-invalidation-race
- docs/60-roadmap-and-guides

### Step 4: Standardize pull requests
Every PR should include:
- linked issue
- summary of changes
- testing notes
- checklist for docs/changelog impact

## Release Milestones

## Milestone M1: Stability Foundation (Critical First)
Target: v0.1.0

### Issues to create
1. [Feature] MutationConcurrencyStrategy for createMutation (critical)

Issue type: Feature
Priority: High
Labels: type:feature, priority:high, status:ready
Suggested branch: feat/<issue-number>-mutation-concurrency-strategy

Problem statement:
- Mutations currently run in parallel by default.
- For ordered or latest-only workflows, this can cause race conditions and server/client state drift.

Implementation scope:
- Add a `concurrencyStrategy` option to mutation configuration.
- Support the following modes:
  - `merge`: run all mutations in parallel (current behavior)
  - `concat`: queue mutations and run sequentially
  - `switch`: cancel/ignore previous in-flight mutation when a new one starts
  - `exhaust`: ignore new mutation calls while one is running

Technical checklist:
- Define public type for `MutationConcurrencyStrategy`.
- Wire strategy selection into mutation execution pipeline.
- Ensure state transitions (`idle`/`pending`/`success`/`error`) remain deterministic.
- Verify compatibility with optimistic updates and invalidation hooks.

Testing checklist:
- Unit tests for each strategy mode.
- Ordering tests for sequential execution (`concat`).
- Latest-only behavior tests for `switch`.
- Ignore-while-running tests for `exhaust`.
- Race-condition tests for rapid consecutive `mutate()` calls.
- Regression test to confirm `merge` preserves current behavior.

Documentation and examples:
- Add API docs for `concurrencyStrategy` in README and DOCS.
- Add one example snippet per strategy mode.
- Document recommended use-cases and trade-offs.

Research and references:
- RxJS operator semantics: `mergeMap`, `concatMap`, `switchMap`, `exhaustMap`.
- Compare expected behavior with common server-state libraries.

Acceptance criteria (Definition of Done):
- All 4 strategy modes implemented and typed.
- Tests pass locally and in CI.
- Docs and examples published.
- Changelog entry added.

2. Mutation state consistency and rollback safety
- Validate optimistic updates under concurrent mutation scenarios.
- Guarantee correct rollback sequence on failures.
- Add tests for stale rollback edge cases.

3. Query invalidation correctness under concurrent writes
- Ensure invalidation and refetch do not produce stale cache states.
- Add regression tests around rapid mutation/refetch loops.

4. Error handling hardening
- Normalize mutation/query error flow.
- Improve retry behavior boundaries.
- Document recommended app-level handling patterns.

5. Test coverage for critical flows
- Add focused tests for cache, mutation concurrency, invalidation, rollback.
- Gate release on passing critical-path tests.

Definition of done for M1:
- all critical issues closed
- tests green in CI
- changelog updated
- release notes published

## Milestone M2: Developer Experience
Target: v0.2.0

### Issues to create
1. Devtools improvements
- Better mutation timeline visibility.
- Highlight concurrency strategy behavior.

2. Request deduplication
- Add dedupe window/config for repeated queries.

3. Retry and backoff strategy customization
- Expose configurable retry policies.

4. Documentation upgrades
- Add advanced guides and architecture notes.
- Add migration guide from ad-hoc state solutions.

## Milestone M3: Ecosystem and Growth
Target: v0.3.0

### Issues to create
1. Landing page (high priority)
- Build a public landing page for ng-signal-query.
- Include value proposition, feature highlights, install steps, API preview, examples, roadmap, and sponsor/contribute links.
- Add benchmark or comparison section (TanStack Query / RxResource context).
- Add "Get Started" and "View Docs" clear CTAs.
- Make fully responsive and SEO friendly.

2. Live examples playground
- Host real examples and recipes.
- Link directly from docs and npm page.

3. Community growth assets
- Contribution quick-start page.
- Good first issue section.
- Public roadmap visibility.

## Issue Creation Template (Recommended)

Title format:
- [Feature] MutationConcurrencyStrategy: add concat/switch/exhaust modes
- [Bug] Fix optimistic rollback ordering with concurrent mutations
- [Docs] Add mutation concurrency guide

Issue body template:
- Problem
- Proposed solution
- Acceptance criteria
- Out of scope
- Test plan
- Docs impact

## Branching and Delivery Rules

- Never develop directly on main.
- Always create an issue first.
- Always create a branch from latest main.
- Keep PR small (single concern).
- Squash merge with clean commit message.
- Delete branch after merge.

## Suggested Weekly Execution Loop

1. Pick 1 critical issue from current milestone.
2. Create branch from issue.
3. Implement + test + docs in same PR.
4. Open PR, review, merge.
5. Update roadmap progress.
6. Move to next issue.

## Immediate Next 5 Issues (Create These Now)

1. [Feature] MutationConcurrencyStrategy core API
2. [Feature] Concurrency executors: merge/concat/switch/exhaust
3. [Test] Concurrency race-condition coverage
4. [Docs] Mutation concurrency strategy guide + examples
5. [Web] Landing page v1

## Progress Tracking

Use this status format in GitHub Projects:
- Backlog
- Ready
- In Progress
- In Review
- Done

This roadmap should be updated at the end of each merged PR.
