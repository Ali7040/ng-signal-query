import {
  signal,
  computed,
  inject,
  WritableSignal,
  DestroyRef,
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

export function createQuery<T>(
  options: CreateQueryOptions<T>
): QueryResult<T> {
  const client = inject(QueryClient);
  const destroyRef = inject(DestroyRef);
  const cache = client.getCache();

  const serializedKey = hashKey(options.key);
  const staleTime = options.staleTime ?? 0;
  const cacheTime = options.cacheTime ?? 5 * 60 * 1000;
  const refetchOnWindowFocus = options.refetchOnWindowFocus ?? true;
  const refetchOnReconnect = options.refetchOnReconnect ?? true;
  const refetchInterval = options.refetchInterval ?? 0;

  let state: WritableSignal<QueryState<T>>;

  const existing = cache.get<T>(options.key);
  if (existing) {
    state = existing.state;
  } else {
    state = signal<QueryState<T>>(createInitialState<T>());
    cache.set(options.key, state, cacheTime);
  }

  const isStale = () => {
    const { updatedAt } = state();
    return Date.now() - updatedAt > staleTime;
  };

  const fetchData = async () => {
    state.update(s => ({
      ...s,
      status: 'loading',
      error: null,
    }));

    try {
      const data = await options.fetcher();
      state.set({
        data,
        error: null,
        status: 'success',
        updatedAt: Date.now(),
      });
    } catch (error) {
      state.update(s => ({
        ...s,
        error,
        status: 'error',
      }));
    }
  };

  // Initial fetch
  if (state().status === 'idle' || isStale()) {
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
    data: computed(() => state().data),
    status: computed(() => state().status),
    error: computed(() => state().error),
    isLoading: computed(() => state().status === 'loading'),
    isSuccess: computed(() => state().status === 'success'),
    isError: computed(() => state().status === 'error'),
    refetch: fetchData,
  };
}
