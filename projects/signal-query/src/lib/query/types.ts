import { Signal } from '@angular/core';

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryState<T> {
  data: T | null;
  error: unknown;
  status: QueryStatus;
  updatedAt: number;
}

export interface CreateQueryOptions<T> {
  key: readonly unknown[];
  fetcher: () => Promise<T>;
  staleTime?: number;
}

export interface QueryResult<T> {
  data: Signal<T | null>;
  status: Signal<QueryStatus>;
  error: Signal<unknown>;
  isLoading: Signal<boolean>;
  refetch: () => Promise<void>;
}
