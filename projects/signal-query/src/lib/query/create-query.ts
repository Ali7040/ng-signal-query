import {
  signal,
  computed,
  inject,
  DestroyRef,
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

function createInitialState<T>(): QueryState<T> {
  return {
    data: null,
    error: null,
    status: 'idle',
    updatedAt: 0,
  };
}

export function createQuery<T>(
  options: CreateQueryOptions<T>
): QueryResult<T> {
  const client = inject(QueryClient);
  const destroyRef = inject(DestroyRef);
  const cache = client.getCache();

  const staleTime = options.staleTime ?? 0;
  const cacheTime = options.cacheTime ?? 5 * 60 * 1000;
  const refetchOnWindowFocus = options.refetchOnWindowFocus ?? true;
  const refetchOnReconnect = options.refetchOnReconnect ?? true;
  const refetchInterval = options.refetchInterval ?? 0;
  const retry = options.retry ?? 3;
  const retryDelay = options.retryDelay ?? defaultRetryDelay;

  // Resolve (or create) the shared cache entry for this key.
  let entry = cache.get<T>(options.key);
  if (!entry) {
    cache.set(options.key, signal<QueryState<T>>(createInitialState<T>()), cacheTime);
    entry = cache.get<T>(options.key)!;
  }
  const activeEntry: CacheEntry<T> = entry;

  const isStale = () => Date.now() - activeEntry.state().updatedAt > staleTime;

  const fetchData = (force = false) =>
    executeQueryFetch(activeEntry, {
      fetcher: options.fetcher,
      retry,
      retryDelay,
      force,
    });

  // Initial fetch — deduped against any concurrent subscriber on the same key.
  if (activeEntry.state().status === 'idle' || isStale()) {
    fetchData();
  }

  // --- Refetch Strategies ---

  // Refetch on window focus (only if stale)
  if (refetchOnWindowFocus && typeof window !== 'undefined') {
    const onFocus = () => {
      if (isStale()) fetchData();
    };
    window.addEventListener('focus', onFocus);
    destroyRef.onDestroy(() => window.removeEventListener('focus', onFocus));
  }

  // Refetch on network reconnect (only if stale)
  if (refetchOnReconnect && typeof window !== 'undefined') {
    const onOnline = () => {
      if (isStale()) fetchData();
    };
    window.addEventListener('online', onOnline);
    destroyRef.onDestroy(() => window.removeEventListener('online', onOnline));
  }

  // Polling interval
  if (refetchInterval > 0) {
    const intervalId = setInterval(() => fetchData(), refetchInterval);
    destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  return {
    data: computed(() => activeEntry.state().data),
    status: computed(() => activeEntry.state().status),
    error: computed(() => activeEntry.state().error),
    isLoading: computed(() => activeEntry.state().status === 'loading'),
    isSuccess: computed(() => activeEntry.state().status === 'success'),
    isError: computed(() => activeEntry.state().status === 'error'),
    refetch: () => fetchData(true),
  };
}
