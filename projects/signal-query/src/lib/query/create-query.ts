import {
  signal,
  computed,
  inject,
  WritableSignal,
} from '@angular/core';
import {
  CreateQueryOptions,
  QueryResult,
  QueryState,
} from './types';
import { QueryClient } from '../core/query-client';

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
  const cache = client.getCache();

  const serializedKey = JSON.stringify(options.key);
  const staleTime = options.staleTime ?? 0;

  let state: WritableSignal<QueryState<T>>;

  if (cache.has(serializedKey)) {
    state = cache.get<T>(serializedKey)!;
  } else {
    state = signal<QueryState<T>>(createInitialState<T>());
    cache.set(serializedKey, state);
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

  return {
    data: computed(() => state().data),
    status: computed(() => state().status),
    error: computed(() => state().error),
    isLoading: computed(() => state().status === 'loading'),
    refetch: fetchData,
  };
}
