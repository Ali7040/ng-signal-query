# ng-signal-query — Issue Backlog

This file is the working backlog. Every item here should become a GitHub issue
(1 issue = 1 branch = 1 PR, per the [ROADMAP](./ROADMAP.md)).

Issues are grouped by theme and ordered by priority within each group.

Legend:
- 🔴 **P0 / Critical** — correctness bugs or blockers. Ship first.
- 🟠 **P1 / High** — core parity users expect from a "TanStack-like" library.
- 🟡 **P2 / Medium** — developer experience & polish.
- 🟣 **AI** — the features that make this library *different* from TanStack Query.
- 🔵 **Ecosystem** — growth, docs, tooling.

---

## ✅ Already shipped (close these on GitHub)

- **#1 — MutationConcurrencyStrategy** (`merge` / `concat` / `switch` / `exhaust`).
  Implemented in [create-mutation.ts](./src/lib/mutation/create-mutation.ts) with tests.
  → **Action: close issue #1 as completed** and link the commit.

---

## 🔴 Group A — Correctness & Stability (P0)

These are real defects I can point to in the current code. They should be fixed
before any new features, because they undermine trust in the cache.

> **Status: A1–A4 shipped** ✅ (branch work). Implemented a shared fetch core
> ([fetch-query.ts](./src/lib/core/fetch-query.ts)) with a generation guard,
> in-flight deduplication, and `AbortSignal` cancellation, plus a retry/backoff
> helper ([retry.ts](./src/lib/core/retry.ts)) wired into queries (default 3
> retries) and mutations (default 0). Covered by
> [create-query.spec.ts](./src/lib/query/create-query.spec.ts). A5 remains open.

### A1. `createQuery` has no race-condition guard (out-of-order responses) — ✅ Done
**Problem:** Unlike `createMutation` (which tracks a `generation` counter),
[create-query.ts](./src/lib/query/create-query.ts) and
[create-signal-query.ts](./src/lib/query/create-signal-query.ts) have no guard
against out-of-order fetch resolution. If a refetch is triggered while a previous
fetch is still in flight, the **slower/older** response can overwrite the newer one,
leaving stale data in the cache.

**Scope:**
- Add a per-query `generation` (or `fetchId`) counter.
- On resolve/reject, discard the result if `gen !== currentGen`.
- Mirror the pattern already proven in `create-mutation.ts`.

**Acceptance:** Test that fires two fetches where the first resolves *after* the
second confirms the second's data wins.

---

### A2. No in-flight request deduplication — ✅ Done
**Problem:** Every `createQuery` instance calls `fetchData()` on init. Two
components mounting the same `['users']` key fire **two network requests** even
though the cache entry is shared. TanStack dedupes these into one in-flight promise.

**Scope:**
- Store the in-flight `Promise` on the cache entry.
- If a fetch is already running for a key, subscribers await the same promise.
- Clear it on settle.

**Acceptance:** Mount N components with the same key → assert `fetcher` called once.

---

### A3. No query cancellation / `AbortSignal` — ✅ Done
**Problem:** `fetcher: () => Promise<T>` receives no `AbortSignal`, so requests
can't be cancelled when a component is destroyed or a key changes. This wastes
bandwidth and can cause the A1 race.

**Scope:**
- Change fetcher signature to `(ctx: { signal: AbortSignal }) => Promise<T>`
  (keep the old signature working via overload for backward compat).
- Abort on `DestroyRef` teardown and on key change in `createSignalQuery`.
- Wire the signal into the HttpClient adapter and RxJS adapter.

**Acceptance:** Destroying a component mid-fetch aborts the underlying request.

---

### A4. Retry with exponential backoff — ✅ Done
**Problem:** The README roadmap and DOCS imply retry support, but
[types.ts](./src/lib/query/types.ts) has **no `retry` option** and neither query
nor mutation retries on failure.

**Scope:**
- Add `retry?: number | boolean | (failureCount, error) => boolean`.
- Add `retryDelay?: number | (attempt, error) => number` (default: exponential
  backoff, capped, with jitter).
- Apply to both queries and mutations.
- Respect `AbortSignal` (A3) — don't retry a cancelled request.

**Acceptance:** A fetcher that fails twice then succeeds resolves after 3 attempts
with increasing delays; `retry: false` fails immediately.

---

### A5. Error-handling normalization
**Problem:** Errors are typed `unknown` and flow inconsistently. There's no
global `onError` and no typed error surface.

**Scope:**
- Normalize error propagation across query/mutation.
- Add optional global `onError` in QueryClient default options (see B7).
- Document recommended app-level handling.

---

## 🟠 Group B — Core Parity with TanStack Query (P1)

The features users coming from TanStack will immediately look for and not find.

### B1. `enabled` — conditional / dependent queries
**Problem:** No way to say "don't run until X is ready". Today the query always
fires on init. This is one of the most-used TanStack options.

**Scope:** `enabled?: boolean | Signal<boolean>`. When false, stay `idle` and skip
fetching; when it flips true, fetch. Integrates naturally with signals.

---

### B2. `isFetching` vs `isLoading` (background refetch state)
**Problem:** `QueryResult` exposes `isLoading` but not `isFetching`. There's no way
to show a subtle "revalidating" spinner while stale data is on screen — the core
stale-while-revalidate UX.

**Scope:** Add `isFetching` (any fetch in flight) separate from `isLoading`
(first load, no data yet). Add `isStale` signal too.

---

### B3. `select` — data transformation / derived selectors
**Problem:** No `select` to derive/transform cached data without extra `computed()`
boilerplate, and without re-running on unrelated cache changes.

**Scope:** `select?: (data: T) => S`; result `data` signal reflects the selected shape.

---

### B4. `placeholderData` / `keepPreviousData` / `initialData`
**Problem:** No way to seed a query or keep the previous page's data visible while
the next loads. Paginated UIs flicker to empty on every key change.

**Scope:**
- `initialData` — seed cache synchronously.
- `placeholderData` — value or `keepPreviousData` sentinel.
- Wire `keepPreviousData` into `createSignalQuery` key changes.

---

### B5. Query-level lifecycle callbacks (`onSuccess` / `onError` / `onSettled`)
**Problem:** Mutations have callbacks; queries don't.

**Scope:** Add the three callbacks to `CreateQueryOptions`, fired on each settle.

---

### B6. `mutateAsync` + richer mutation context (`onMutate` → context)
**Problem:** `mutate` returns `Promise<void>` — you can't await the result value.
Optimistic updates use `optimisticUpdate(input)` but callbacks don't receive a
typed context object like TanStack's `onMutate` → `context`.

**Scope:**
- Add `mutateAsync(input): Promise<TOutput>`.
- Let `onMutate` return a context passed to `onError`/`onSettled`.
- Pass `variables` into all mutation callbacks.

---

### B7. QueryClient global default options
**Problem:** Every query repeats `staleTime`, `retry`, etc. No central config.

**Scope:** `provideQueryClient({ defaultOptions: { queries, mutations } })`.
Per-query options override defaults.

---

### B8. Cache persistence (localStorage / IndexedDB)
**Problem:** Cache is memory-only; a refresh loses everything. TanStack has
`persistQueryClient`.

**Scope:** Pluggable persister interface + built-in localStorage and IndexedDB
persisters. Serialize/restore with `dehydrate`/`hydrate` (already present for SSR).

---

### B9. Offline support / network mode
**Problem:** Roadmap promises offline mutation queueing; nothing exists.

**Scope:**
- `networkMode: 'online' | 'always' | 'offlineFirst'`.
- Queue mutations while offline, flush on reconnect (reuse the `online` listener
  already wired in `create-query.ts`).

---

## 🟡 Group C — Developer Experience (P2)

### C1. DevTools upgrade
Timeline view of queries/mutations, concurrency-strategy visualization, cache
inspector with manual invalidate/refetch buttons, and a "why did this refetch?"
explainer. Build on the existing
[devtools component](./src/lib/devtools/signal-query-devtools.component.ts).

### C2. Request deduplication config
Expose a dedupe window (builds on A2) so identical queries within N ms coalesce.

### C3. Pause / resume queries
Manual `pause()` / `resume()` on a query handle for wizards and modals.

### C4. Query dependencies / auto-refetch chains
Declaratively refetch query B when query A's data changes (beyond `enabled`).

### C5. Structural sharing
Preserve object references across refetches when data is deep-equal, to avoid
needless downstream recomputation.

### C6. Test utilities package
`provideTestQueryClient()`, fake timers helpers, and a mock fetcher so consumers
can test components using the library easily.

---

## 🟣 Group D — AI-Native Features (the differentiator)

TanStack Query is designed for REST/GraphQL request/response. It has **no
first-class story for LLM streaming, semantic caching, or token/cost tracking.**
This is the wedge that makes ng-signal-query worth choosing over "just use TanStack".
Angular signals are an excellent fit for streaming token updates.

### D1. `createStreamingQuery` — first-class LLM/SSE token streaming ⭐
**Problem:** LLM responses stream token-by-token. TanStack has no native
streaming primitive. A signal that accumulates streamed chunks is a perfect fit.

**Scope:**
- `createStreamingQuery({ key, stream: (ctx) => AsyncIterable<Chunk> | ReadableStream })`.
- Exposes `data` (accumulated), `chunks`, `isStreaming`, `isComplete`, plus
  `cancel()` wired to `DestroyRef`.
- Handles SSE, `ReadableStream`, and async iterables.

**Why it wins:** Nobody in the Angular ecosystem has a clean signals-native
streaming-query primitive. This alone is a headline feature.

### D2. Semantic cache for prompts ⭐
**Problem:** Exact-key caching misses "What's the weather?" vs "how's the weather?".
For LLM calls, near-duplicate prompts should hit cache.

**Scope:**
- Optional embedding-based key matching with a similarity threshold.
- Pluggable embedder (bring-your-own: Anthropic/OpenAI/local).
- Falls back to exact-key when no embedder configured.

### D3. `createAiQuery` — LLM ergonomics wrapper
**Problem:** LLM calls need rate-limit-aware retry (429/`retry-after`), token &
cost accounting, and streaming — bundled.

**Scope:**
- Built on A4 (retry/backoff) + D1 (streaming).
- Exposes `tokensUsed`, `estimatedCost`, `model` signals.
- Respects `retry-after` headers automatically.

### D4. Provider adapters (Anthropic / OpenAI / Vercel AI SDK)
Thin adapters so `stream:` / `queryFn:` accept an Anthropic or OpenAI streaming
client directly, mapping their event shapes to D1's chunk model.

### D5. Predictive prefetching
**Problem:** `prefetchQuery` is manual. Learn navigation/access patterns and
prefetch the *likely next* query.

**Scope:** Opt-in observer that records key-access sequences and pre-warms the
cache for high-probability transitions. Fully local, privacy-preserving.

### D6. AI-assisted DevTools
Natural-language cache queries ("show me all stale user queries"), anomaly
detection (a query refetching far more than its peers), and plain-English
explanations of cache state. Layers onto C1.

> **Positioning:** Market this as *"TanStack Query's ergonomics + Angular signals
> + a native AI/streaming layer."* D1 and D2 are the two features to build and
> demo first — they are genuinely novel in the Angular ecosystem.

---

## 🔵 Group E — Ecosystem & Growth

### E1. Landing page (high priority for stars/adoption)
Value prop, feature grid, install, API preview, live examples, and a
**comparison table vs TanStack Query / `rxResource`** that highlights the AI layer.
Responsive + SEO.

### E2. Live playground (StackBlitz / CodeSandbox)
The README links say "Coming Soon" — ship real embeds and link from npm.

### E3. Docs site
Move DOCS.md into a real docs site with guides: caching, mutations & concurrency,
optimistic updates, SSR, and the AI features.

### E4. Migration guide from TanStack Query
Side-by-side API mapping to lower the switching cost.

### E5. Benchmarks
Bundle size and update-performance benchmarks vs alternatives, published in the repo.

### E6. Community assets
`good first issue` labels, CONTRIBUTING quick-start, and a public GitHub Project board.

### E7. One-click starter template + "Deploy to Vercel" button
**Goal:** Let anyone spin up a working ng-signal-query app in one click, to lower
the barrier to trying the library. This is an **adoption asset, not a library
feature** — deployment is handled entirely by Vercel; we just provide the template
and button.

**Scope:**
- Create a minimal starter repo (e.g. `ng-signal-query-starter`) — a small Angular
  app that demonstrates a query, a mutation, and the DevTools, ready to run.
- Add a **Deploy Button** to the starter README and the main README:
  `[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<STARTER_REPO_URL>)`
- Confirm Angular build settings work on Vercel's zero-config Angular preset
  (output dir, build command). Document any `vercel.json` needed for SPA routing.
- Optionally mirror as a StackBlitz/CodeSandbox link (ties into **E2**).

**Acceptance:** Clicking the button clones the starter and produces a live,
working ng-signal-query demo URL with no manual configuration.

**Note:** No new code in the library itself — this lives in a separate starter repo
plus a README badge. The underlying deploy mechanism already exists (Vercel Deploy
Button); we are packaging it for our library.

---

### E8. Marble diagram generator + interactive playground ⭐ ([#14](https://github.com/Ali7040/ng-signal-query/issues/14))
**Origin:** the v0.1.0 launch post included an animated marble diagram of the four
concurrency strategies. The top comment was *"Always looking for good ways to
illustrate rxjs to people, this is very cool."*

**Part A — open-source the generator.** The diagram is an HTML page rendered to
frames with headless Chrome and stitched with ffmpeg. Ship it as `tools/marble/`,
generic enough to render any operator. Document the platform constraints we hit
(LinkedIn needs ≥75 KB and 10–60 fps, and does not animate GIFs; Reddit does).

**Part B — interactive playground.** Place source events on a timeline, pick an
operator (`mergeMap`/`concatMap`/`switchMap`/`exhaustMap`), watch the output
recompute live, export GIF/MP4 or a permalink. Each operator maps to its
`concurrencyStrategy` equivalent with a copyable snippet.

**Why it outranks a landing page:** RxJS learners vastly outnumber people shopping
for an Angular query library, and teachers *link to* tools. Every diagram it
produces carries our name. Zero backend, so hosting is free and static.

**Acceptance:** generator produces a GIF and a platform-valid MP4 from a schedule
definition; playground supports all four operators with shareable URLs; linked
from README and docs.

> Ship Part A first — it is mostly moving existing code, and validates interest cheaply.

---

## Suggested execution order

1. ✅ **A1, A2, A3, A4** — foundation fixed, shipped in 0.1.0.
2. **B1, B2, B6** — the parity features users hit first.
3. **E8 (Part A)** — cheap, and the launch showed there is demand.
4. **D1** — ship the streaming query and demo it (the differentiator).
5. **E1** — landing page with the comparison table.
6. **D2, D3** — semantic cache + AI query wrapper.
7. Everything else by priority.
