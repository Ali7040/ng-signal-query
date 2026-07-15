import { Signal } from '@angular/core';
import { RetryValue, RetryDelayValue } from '../core/retry';

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryState<T> {
  data: T | null;
  error: unknown;
  status: QueryStatus;
  updatedAt: number;
}

/**
 * Context passed to a query fetcher. The `signal` is aborted when the query is
 * superseded (e.g. the key changes) or a fresh fetch cancels an in-flight one.
 * Pass it to `fetch`/`HttpClient` to cancel stale requests.
 */
export interface QueryFunctionContext {
  signal: AbortSignal;
}

export interface CreateQueryOptions<T> {
  key: readonly unknown[];

  /**
   * Fetches the data. Receives a {@link QueryFunctionContext} with an
   * `AbortSignal`. Existing zero-argument fetchers remain compatible.
   */
  fetcher: (context: QueryFunctionContext) => Promise<T>;

  /**
   * Number of retry attempts on failure (or a predicate).
   * Default: 3. Use `false` / `0` to disable.
   */
  retry?: RetryValue;

  /**
   * Delay before each retry. Default: exponential backoff (1s, 2s, 4s … max 30s).
   */
  retryDelay?: RetryDelayValue;

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
