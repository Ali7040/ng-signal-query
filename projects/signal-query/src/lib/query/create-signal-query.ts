import {
  signal,
  computed,
  inject,
  effect,
  untracked,
} from '@angular/core';
import {
  CreateQueryOptions,
  QueryResult,
  QueryState,
} from './types';
import { QueryClient } from '../core/query-client';
import { CacheEntry } from '../core/query-cache';
import { executeQueryFetch } from '../core/fetch-query';
import { defaultRetryDelay } from '../core/retry';
import { hashKey } from '../core/query-key';

function createInitialState<T>(): QueryState<T> {
  return {
    data: null,
    error: null,
    status: 'idle',
    updatedAt: 0,
  };
}

/**
 * A signal-native query that reactively re-runs when signal dependencies change.
 *
 * Usage:
 * ```ts
 * const userId = signal(1);
 * const user = createSignalQuery(() => ({
 *   key: ['user', userId()],
 *   fetcher: ({ signal }) => fetchUser(userId(), { signal }),
 * }));
 * ```
 *
 * When `userId` changes, the query switches to the new key's shared cache entry,
 * aborts the previous key's in-flight request, and fetches if the data is stale.
 */
export function createSignalQuery<T>(
  optionsFn: () => CreateQueryOptions<T>
): QueryResult<T> {
  const client = inject(QueryClient);
  const cache = client.getCache();

  // The cache entry for the current key. Swapped when the key changes.
  const activeEntry = signal<CacheEntry<T> | null>(null);
  let currentKey: string | null = null;

  const resolveEntry = (opts: CreateQueryOptions<T>): CacheEntry<T> => {
    let entry = cache.get<T>(opts.key);
    if (!entry) {
      cache.set(
        opts.key,
        signal<QueryState<T>>(createInitialState<T>()),
        opts.cacheTime ?? 5 * 60 * 1000
      );
      entry = cache.get<T>(opts.key)!;
    }
    return entry;
  };

  const fetchEntry = (entry: CacheEntry<T>, opts: CreateQueryOptions<T>, force = false) =>
    executeQueryFetch(entry, {
      fetcher: opts.fetcher,
      retry: opts.retry ?? 0,
      retryDelay: opts.retryDelay ?? defaultRetryDelay,
      force,
    });

  // Track signal dependencies read inside optionsFn; re-run on key change.
  effect(() => {
    const opts = optionsFn();
    const newKey = hashKey(opts.key);

    untracked(() => {
      if (newKey === currentKey) return;

      // Cancel the previous key's in-flight request before switching.
      const previous = activeEntry();
      previous?.abortController?.abort();

      currentKey = newKey;
      const entry = resolveEntry(opts);
      activeEntry.set(entry);

      const staleTime = opts.staleTime ?? 0;
      const isStale = Date.now() - entry.state().updatedAt > staleTime;
      if (entry.state().status === 'idle' || isStale) {
        fetchEntry(entry, opts);
      }
    });
  });

  const currentState = computed<QueryState<T>>(
    () => activeEntry()?.state() ?? createInitialState<T>()
  );

  return {
    data: computed(() => currentState().data),
    status: computed(() => currentState().status),
    error: computed(() => currentState().error),
    isLoading: computed(() => currentState().status === 'loading'),
    isSuccess: computed(() => currentState().status === 'success'),
    isError: computed(() => currentState().status === 'error'),
    refetch: async () => {
      const entry = activeEntry();
      if (!entry) return;
      const opts = untracked(() => optionsFn());
      await fetchEntry(entry, opts, true);
    },
  };
}
