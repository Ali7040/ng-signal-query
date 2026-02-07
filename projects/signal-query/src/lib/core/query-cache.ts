import { signal, WritableSignal } from '@angular/core';
import { QueryState } from '../query/types';

export class QueryCache {
  private cache = new Map<string, WritableSignal<QueryState<any>>>();

  get<T>(key: string): WritableSignal<QueryState<T>> | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, state: WritableSignal<QueryState<T>>) {
    this.cache.set(key, state);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
