import {
  signal,
  computed,
  inject,
  effect,
  WritableSignal,
  DestroyRef,
  untracked,
} from '@angular/core';
import {
  CreateQueryOptions,
  QueryResult,
  QueryState,
} from './types';
import { QueryClient } from '../core/query-client';
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
 *   fetcher: () => fetchUser(userId()),
 * }));
 * ```
 *
 * When `userId` changes, the query automatically re-executes with the new key/fetcher.
 */
export function createSignalQuery<T>(
  optionsFn: () => CreateQueryOptions<T>
): QueryResult<T> {
  const client = inject(QueryClient);
  const destroyRef = inject(DestroyRef);
  const cache = client.getCache();

  const state = signal<QueryState<T>>(createInitialState<T>());
  let currentKey: string | null = null;
  let destroyed = false;

  destroyRef.onDestroy(() => {
    destroyed = true;
  });

  const fetchData = async (opts: CreateQueryOptions<T>, targetState: WritableSignal<QueryState<T>>) => {
    targetState.update(s => ({
      ...s,
      status: 'loading',
      error: null,
    }));

    try {
      const data = await opts.fetcher();
      if (!destroyed) {
        targetState.set({
          data,
          error: null,
          status: 'success',
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      if (!destroyed) {
        targetState.update(s => ({
          ...s,
          error,
          status: 'error',
        }));
      }
    }
  };

  // Use effect to track signal dependencies inside the options factory
  effect(() => {
    // This call reads signals inside optionsFn — Angular tracks them
    const opts = optionsFn();
    const newKey = hashKey(opts.key);

    untracked(() => {
      // Key changed → re-run the query
      if (newKey !== currentKey) {
        currentKey = newKey;

        // Check if we have cached data for this key
        const existing = cache.get<T>(opts.key);
        if (existing) {
          state.set(existing.state());
          const staleTime = opts.staleTime ?? 0;
          const { updatedAt } = existing.state();
          if (Date.now() - updatedAt > staleTime) {
            fetchData(opts, state);
          }
        } else {
          state.set(createInitialState<T>());
          cache.set(opts.key, state, opts.cacheTime ?? 5 * 60 * 1000);
          fetchData(opts, state);
        }
      }
    });
  });

  return {
    data: computed(() => state().data),
    status: computed(() => state().status),
    error: computed(() => state().error),
    isLoading: computed(() => state().status === 'loading'),
    isSuccess: computed(() => state().status === 'success'),
    isError: computed(() => state().status === 'error'),
    refetch: async () => {
      const opts = untracked(() => optionsFn());
      await fetchData(opts, state);
    },
  };
}
