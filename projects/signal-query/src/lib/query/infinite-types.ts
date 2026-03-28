import { Signal } from '@angular/core';
import { QueryStatus } from './types';

export interface CreateInfiniteQueryOptions<TData, TPageParam = number> {
  key: readonly unknown[];
  queryFn: (params: { pageParam: TPageParam }) => Promise<TData>;

  /** Extract the next page parameter from the last page. Return undefined to signal no more pages. */
  getNextPageParam: (lastPage: TData, allPages: TData[]) => TPageParam | undefined;

  /** Extract the previous page parameter from the first page. Optional. */
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => TPageParam | undefined;

  /** The page parameter for the first page. */
  initialPageParam: TPageParam;

  staleTime?: number;
  cacheTime?: number;
}

export interface InfiniteQueryResult<TData> {
  /** All fetched pages in order. */
  pages: Signal<TData[]>;
  status: Signal<QueryStatus>;
  error: Signal<unknown>;
  isLoading: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
  hasNextPage: Signal<boolean>;
  hasPreviousPage: Signal<boolean>;
  isFetchingNextPage: Signal<boolean>;
  isFetchingPreviousPage: Signal<boolean>;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
}
