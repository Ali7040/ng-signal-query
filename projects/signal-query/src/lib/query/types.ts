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

  /**
   * Time in ms that data is considered fresh.
   * During this window, cache hits won't trigger a refetch.
   * Default: 0 (always refetch)
   */
  staleTime?: number;

  /**
   * Time in ms that unused cache entries are kept before garbage collection.
   * Default: 300000 (5 minutes)
   */
  cacheTime?: number;

  /**
   * Refetch data when the browser window regains focus.
   * Only refetches if data is stale.
   * Default: true
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Refetch data when the browser comes back online.
   * Only refetches if data is stale.
   * Default: true
   */
  refetchOnReconnect?: boolean;

  /**
   * Polling interval in ms. 0 or undefined = no polling.
   * Default: 0
   */
  refetchInterval?: number;
}

export interface QueryResult<T> {
  data: Signal<T | null>;
  status: Signal<QueryStatus>;
  error: Signal<unknown>;
  isLoading: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
  refetch: () => Promise<void>;
}
