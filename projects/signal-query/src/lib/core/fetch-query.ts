import { CacheEntry } from './query-cache';
import { runWithRetry, RetryValue, RetryDelayValue } from './retry';
import { QueryFunctionContext } from '../query/types';

export interface ExecuteQueryFetchOptions<T> {
  fetcher: (context: QueryFunctionContext) => Promise<T>;
  retry: RetryValue;
  retryDelay: RetryDelayValue;

  /**
   * Force a fresh fetch even if one is already in flight (used by `refetch`).
   * The previous in-flight request is aborted. Automatic fetches leave this
   * `false` so concurrent subscribers share a single request (deduplication).
   */
  force?: boolean;
}

/**
 * Runs a query fetch against a shared cache entry with three guarantees:
 *
 * 1. **Deduplication** — concurrent callers for the same key share one request
 *    unless `force` is set.
 * 2. **Race safety** — each fetch captures a generation; only the latest
 *    generation may commit its result, so a slow older response can never
 *    overwrite fresher data.
 * 3. **Cancellation** — every fetch gets an `AbortSignal`; a forced fetch aborts
 *    the one it supersedes.
 *
 * Returns a promise that settles when this fetch (or the shared in-flight one)
 * completes. It never rejects — errors are written to the entry's state.
 */
export function executeQueryFetch<T>(
  entry: CacheEntry<T>,
  options: ExecuteQueryFetchOptions<T>,
): Promise<void> {
  // (2) Deduplication: reuse the in-flight fetch unless a fresh one is forced.
  if (entry.inFlight && !options.force) {
    return entry.inFlight;
  }

  // (3) A forced fetch cancels the request it supersedes.
  if (options.force && entry.abortController) {
    entry.abortController.abort();
  }

  const controller = new AbortController();
  entry.abortController = controller;
  const generation = ++entry.fetchGeneration;

  const isLatest = () => generation === entry.fetchGeneration;

  // Preserve existing data during a background refetch.
  entry.state.update((s) => ({ ...s, status: 'loading', error: null }));

  const run = (async () => {
    try {
      const data = await runWithRetry(
        options.fetcher,
        options.retry,
        options.retryDelay,
        controller.signal,
      );

      // (1) Only the latest, non-aborted generation commits.
      if (isLatest() && !controller.signal.aborted) {
        entry.state.set({ data, error: null, status: 'success', updatedAt: Date.now() });
      }
    } catch (error) {
      // Aborted fetches (superseded or cancelled) leave state untouched.
      if (controller.signal.aborted) return;
      if (isLatest()) {
        entry.state.update((s) => ({ ...s, error, status: 'error' }));
      }
    } finally {
      // Only clear coordination state if we still own the latest generation.
      if (isLatest()) {
        entry.inFlight = null;
        entry.abortController = null;
      }
    }
  })();

  entry.inFlight = run;
  return run;
}
