import { Injectable, signal } from '@angular/core';
import { QueryCache } from './query-cache';
import { hashKey } from './query-key';
import { CreateQueryOptions, QueryState } from '../query/types';

@Injectable({ providedIn: 'root' })
export class QueryClient {
  private cache = new QueryCache();

  getCache() {
    return this.cache;
  }

  /**
   * Invalidate a specific query by its exact key.
   */
  invalidate(key: readonly unknown[]) {
    this.cache.invalidate(key);
  }

  /**
   * Invalidate all queries whose key starts with the given prefix.
   * Example: invalidatePrefix(['users']) invalidates ['users'], ['users', 1], etc.
   */
  invalidatePrefix(partialKey: readonly unknown[]) {
    this.cache.invalidateByPrefix(partialKey);
  }

  /**
   * Read cached data for a given query key without triggering a fetch.
   */
  getQueryData<T>(key: readonly unknown[]): T | null {
    const entry = this.cache.get<T>(key);
    return entry ? entry.state().data : null;
  }

  /**
   * Directly set cache data for a given query key.
   * Useful for optimistic updates.
   */
  setQueryData<T>(key: readonly unknown[], updater: T | ((old: T | null) => T)) {
    const entry = this.cache.get<T>(key);
    if (entry) {
      const currentData = entry.state().data;
      const newData =
        typeof updater === 'function'
          ? (updater as (old: T | null) => T)(currentData)
          : updater;

      entry.state.set({
        data: newData,
        error: null,
        status: 'success',
        updatedAt: Date.now(),
      });
    } else {
      // Create a new cache entry if none exists
      const newData =
        typeof updater === 'function'
          ? (updater as (old: T | null) => T)(null)
          : updater;

      const state = signal<QueryState<T>>({
        data: newData,
        error: null,
        status: 'success',
        updatedAt: Date.now(),
      });
      this.cache.set(key, state);
    }
  }

  /**
   * Prefetch a query and store the result in cache.
   * Useful for SSR or preloading data.
   */
  async prefetchQuery<T>(options: Pick<CreateQueryOptions<T>, 'key' | 'fetcher' | 'staleTime'>) {
    const existing = this.cache.get<T>(options.key);
    const staleTime = options.staleTime ?? 0;

    // Skip if data is fresh
    if (existing) {
      const { updatedAt } = existing.state();
      if (Date.now() - updatedAt <= staleTime) return;
    }

    try {
      const data = await options.fetcher();
      this.setQueryData<T>(options.key, data);
    } catch {
      // Silently fail — prefetch is best-effort
    }
  }

  /**
   * Run garbage collection on the cache.
   */
  gc() {
    this.cache.gc();
  }

  clear() {
    this.cache.clear();
  }
}
