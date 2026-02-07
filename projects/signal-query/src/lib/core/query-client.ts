import { Injectable } from '@angular/core';
import { QueryCache } from './query-cache';

@Injectable({ providedIn: 'root' })
export class QueryClient {
  private cache = new QueryCache();

  getCache() {
    return this.cache;
  }

  invalidate(key: readonly unknown[]) {
    const serializedKey = JSON.stringify(key);
    this.cache.invalidate(serializedKey);
  }

  clear() {
    this.cache.clear();
  }
}
