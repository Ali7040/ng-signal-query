import { signal, WritableSignal } from '@angular/core';
import { QueryState } from '../query/types';
import { hashKey, matchKeyPrefix } from './query-key';

export interface CacheEntry<T = any> {
  key: readonly unknown[];
  state: WritableSignal<QueryState<T>>;
  createdAt: number;
  lastAccessedAt: number;
  cacheTime: number;
}

export class QueryCache {
  private cache = new Map<string, CacheEntry>();

  get<T>(key: readonly unknown[]): CacheEntry<T> | undefined {
    const hash = hashKey(key);
    const entry = this.cache.get(hash);
    if (entry) {
      entry.lastAccessedAt = Date.now();
    }
    return entry as CacheEntry<T> | undefined;
  }

  set<T>(
    key: readonly unknown[],
    state: WritableSignal<QueryState<T>>,
    cacheTime: number = 5 * 60 * 1000
  ) {
    const hash = hashKey(key);
    this.cache.set(hash, {
      key,
      state,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      cacheTime,
    });
  }

  has(key: readonly unknown[]): boolean {
    return this.cache.has(hashKey(key));
  }

  invalidate(key: readonly unknown[]) {
    this.cache.delete(hashKey(key));
  }

  /**
   * Invalidate all cache entries whose key starts with the given prefix.
   * Example: invalidateByPrefix(['users']) removes ['users'], ['users', 1], etc.
   */
  invalidateByPrefix(partialKey: readonly unknown[]) {
    for (const [hash, entry] of this.cache) {
      if (matchKeyPrefix(partialKey, entry.key)) {
        this.cache.delete(hash);
      }
    }
  }

  /**
   * Returns all cache entries. Used by DevTools.
   */
  getAll(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Garbage collect entries that have exceeded their cacheTime
   * since they were last accessed.
   */
  gc() {
    const now = Date.now();
    for (const [hash, entry] of this.cache) {
      if (now - entry.lastAccessedAt > entry.cacheTime) {
        this.cache.delete(hash);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}
