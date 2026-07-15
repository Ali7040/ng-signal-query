# ng-signal-query Roadmap

An issue-driven roadmap with clean branching and predictable releases.
For the detailed, actionable backlog see **[ISSUES.md](./ISSUES.md)**.

## Vision

**TanStack Query's ergonomics + Angular signals + a native AI/streaming layer.**

Angular already has server-state libraries. What none of them have is a
first-class, signals-native story for **LLM streaming, semantic caching, and
token/cost tracking**. That AI layer (see Milestone M3) is the reason to choose
ng-signal-query over "just use TanStack Query". Everything before it is about
earning trust: a correct, familiar core that Angular developers can rely on.

## Goal (process)

- 1 issue = 1 branch = 1 pull request
- small, reviewable changes
- milestone-based releases

---

## Where we are today

**Shipped and working:**
- `createQuery`, `createSignalQuery`, `createInfiniteQuery`
- `createMutation` with `concurrencyStrategy` (`merge` / `concat` / `switch` / `exhaust`) ✅ *(closes issue #1)*
- Shared `QueryCache` with prefix invalidation + garbage collection
- Optimistic updates with automatic + custom rollback
- SSR dehydrate / hydrate
- DevTools component
- RxJS adapter (`toObservable$` / `fromObservable`)

**Known gaps we are prioritizing** (details in [ISSUES.md](./ISSUES.md)):
- No race-condition guard on queries (out-of-order responses can overwrite fresh data) — **A1**
- No in-flight request deduplication — **A2**
- No cancellation / `AbortSignal` — **A3**
- Retry/backoff is advertised but not implemented — **A4**
- Missing `enabled`, `isFetching`, `select`, `placeholderData` — **B1–B4**

---

## Release Milestones

### Milestone M1 — Stability Foundation (Critical)  ·  Target v0.1.0

Fix correctness before adding surface area. Nothing new ships until the core is trustworthy.

- ✅ **A1** Race-condition guard for queries (generation counter)
- ✅ **A2** In-flight request deduplication
- ✅ **A3** Query cancellation via `AbortSignal`
- ✅ **A4** Retry with exponential backoff (queries + mutations)
- ⬜ **A5** Error-handling normalization
- ⬜ Critical-path test coverage: cache, invalidation, rollback (query fetch flows ✅)

**Definition of done:** all P0 issues closed · tests green in CI · CHANGELOG + release notes published.

> **Progress:** A1–A4 implemented via a shared fetch core
> ([fetch-query.ts](./src/lib/core/fetch-query.ts)) + retry helper
> ([retry.ts](./src/lib/core/retry.ts)). 32 tests green. A5 next.

### Milestone M2 — Core Parity & DX  ·  Target v0.2.0

The TanStack features users expect and don't yet find.

- **B1** `enabled` / conditional queries
- **B2** `isFetching` vs `isLoading` (+ `isStale`)
- **B3** `select` transform
- **B4** `placeholderData` / `keepPreviousData` / `initialData`
- **B5** Query lifecycle callbacks
- **B6** `mutateAsync` + richer mutation context
- **B7** QueryClient global default options
- **B8** Cache persistence (localStorage / IndexedDB)
- **B9** Offline support / network mode
- **C1** DevTools upgrade (timeline, cache inspector)

**Definition of done:** parity checklist met · migration guide drafted.

### Milestone M3 — AI-Native Layer (the differentiator)  ·  Target v0.3.0 ⭐

The features that make this library unique in the Angular ecosystem.

- **D1** `createStreamingQuery` — signals-native LLM/SSE token streaming ⭐
- **D2** Semantic cache for prompts (embedding-based key matching) ⭐
- **D3** `createAiQuery` — rate-limit-aware retry, token & cost signals
- **D4** Provider adapters (Anthropic / OpenAI / Vercel AI SDK)
- **D5** Predictive prefetching
- **D6** AI-assisted DevTools

**Build & demo D1 and D2 first** — they are the headline features.

### Milestone M4 — Ecosystem & Growth  ·  Target v0.4.0

- **E1** Landing page with a TanStack / `rxResource` comparison table
- **E2** Live playground (StackBlitz / CodeSandbox)
- **E3** Docs site
- **E4** Migration guide from TanStack Query
- **E5** Benchmarks
- **E6** Community assets (`good first issue`, contributing quick-start, project board)
- **E7** One-click starter template + "Deploy to Vercel" button (adoption asset)

---

## Workflow discipline

### Branch protection (do this first)
- Require PR before merge on `main`, ≥1 approval, status checks (build + test), no force-push.

### Issue labels
`type:feature` · `type:bug` · `type:docs` · `type:infra` ·
`priority:high` · `priority:medium` · `priority:low` ·
`status:blocked` · `status:ready` · `status:in-progress` · `ai` · `good first issue`

### Branch naming
`feat/<issue>-<short-name>` · `fix/<issue>-<short-name>` ·
`docs/<issue>-<short-name>` · `chore/<issue>-<short-name>`

### Pull requests
Every PR: linked issue · summary · testing notes · docs/changelog checklist.
Keep PRs single-concern. Squash-merge with a clean message. Delete the branch after merge.

---

## Immediate next steps

1. Close issue **#1** (MutationConcurrencyStrategy is shipped) and link the commit.
2. Open GitHub issues for **A1–A4** (Milestone M1) from [ISSUES.md](./ISSUES.md).
3. Start with **A1** (race guard) — smallest, highest-trust fix.
4. In parallel, spike **D1** (`createStreamingQuery`) as the demo-able differentiator.

## Progress tracking (GitHub Projects)

`Backlog → Ready → In Progress → In Review → Done`

Update this roadmap at the end of each merged PR.
