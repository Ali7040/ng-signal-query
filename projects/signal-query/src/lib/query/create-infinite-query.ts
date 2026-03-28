import {
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import {
  CreateInfiniteQueryOptions,
  InfiniteQueryResult,
} from './infinite-types';
import { QueryClient } from '../core/query-client';

interface InfiniteState<TData> {
  pages: TData[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: unknown;
  updatedAt: number;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function createInitialState<TData>(): InfiniteState<TData> {
  return {
    pages: [],
    status: 'idle',
    error: null,
    updatedAt: 0,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

export function createInfiniteQuery<TData, TPageParam = number>(
  options: CreateInfiniteQueryOptions<TData, TPageParam>
): InfiniteQueryResult<TData> {
  const client = inject(QueryClient);
  const destroyRef = inject(DestroyRef);

  const state = signal<InfiniteState<TData>>(createInitialState<TData>());

  let pageParams: TPageParam[] = [options.initialPageParam];
  let destroyed = false;

  destroyRef.onDestroy(() => {
    destroyed = true;
  });

  // --- Initial fetch ---
  const fetchInitialPage = async () => {
    state.update(s => ({
      ...s,
      status: 'loading',
      error: null,
    }));

    try {
      const firstPage = await options.queryFn({ pageParam: options.initialPageParam });
      if (destroyed) return;

      const nextParam = options.getNextPageParam(firstPage, [firstPage]);
      const prevParam = options.getPreviousPageParam?.(firstPage, [firstPage]);

      pageParams = [options.initialPageParam];

      state.set({
        pages: [firstPage],
        status: 'success',
        error: null,
        updatedAt: Date.now(),
        isFetchingNextPage: false,
        isFetchingPreviousPage: false,
        hasNextPage: nextParam !== undefined,
        hasPreviousPage: prevParam !== undefined,
      });
    } catch (error) {
      if (!destroyed) {
        state.update(s => ({
          ...s,
          error,
          status: 'error',
        }));
      }
    }
  };

  const fetchNextPage = async () => {
    const current = state();
    if (!current.hasNextPage || current.isFetchingNextPage) return;

    const lastPage = current.pages[current.pages.length - 1];
    const nextParam = options.getNextPageParam(lastPage, current.pages);
    if (nextParam === undefined) return;

    state.update(s => ({ ...s, isFetchingNextPage: true }));

    try {
      const newPage = await options.queryFn({ pageParam: nextParam });
      if (destroyed) return;

      pageParams.push(nextParam);
      const allPages = [...state().pages, newPage];
      const nextNextParam = options.getNextPageParam(newPage, allPages);

      state.update(s => ({
        ...s,
        pages: allPages,
        updatedAt: Date.now(),
        isFetchingNextPage: false,
        hasNextPage: nextNextParam !== undefined,
      }));
    } catch (error) {
      if (!destroyed) {
        state.update(s => ({
          ...s,
          error,
          isFetchingNextPage: false,
        }));
      }
    }
  };

  const fetchPreviousPage = async () => {
    const current = state();
    if (!current.hasPreviousPage || current.isFetchingPreviousPage || !options.getPreviousPageParam) return;

    const firstPage = current.pages[0];
    const prevParam = options.getPreviousPageParam(firstPage, current.pages);
    if (prevParam === undefined) return;

    state.update(s => ({ ...s, isFetchingPreviousPage: true }));

    try {
      const newPage = await options.queryFn({ pageParam: prevParam });
      if (destroyed) return;

      pageParams.unshift(prevParam);
      const allPages = [newPage, ...state().pages];
      const prevPrevParam = options.getPreviousPageParam?.(newPage, allPages);

      state.update(s => ({
        ...s,
        pages: allPages,
        updatedAt: Date.now(),
        isFetchingPreviousPage: false,
        hasPreviousPage: prevPrevParam !== undefined,
      }));
    } catch (error) {
      if (!destroyed) {
        state.update(s => ({
          ...s,
          error,
          isFetchingPreviousPage: false,
        }));
      }
    }
  };

  // Kick off initial fetch
  fetchInitialPage();

  return {
    pages: computed(() => state().pages),
    status: computed(() => state().status),
    error: computed(() => state().error),
    isLoading: computed(() => state().status === 'loading'),
    isSuccess: computed(() => state().status === 'success'),
    isError: computed(() => state().status === 'error'),
    hasNextPage: computed(() => state().hasNextPage),
    hasPreviousPage: computed(() => state().hasPreviousPage),
    isFetchingNextPage: computed(() => state().isFetchingNextPage),
    isFetchingPreviousPage: computed(() => state().isFetchingPreviousPage),
    fetchNextPage,
    fetchPreviousPage,
    refetch: fetchInitialPage,
  };
}
