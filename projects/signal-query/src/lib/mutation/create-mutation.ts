import { signal, computed, inject } from '@angular/core';
import {
  CreateMutationOptions,
  MutationContext,
  MutationResult,
  MutationState,
} from './types';
import { QueryClient } from '../core/query-client';
import { hashKey } from '../core/query-key';

function createInitialState<T>(): MutationState<T> {
  return {
    data: null,
    error: null,
    status: 'idle',
  };
}

export function createMutation<TInput, TOutput>(
  options: CreateMutationOptions<TInput, TOutput>
): MutationResult<TInput, TOutput> {
  const client = inject(QueryClient);
  const cache = client.getCache();

  const state = signal<MutationState<TOutput>>(
    createInitialState<TOutput>()
  );

  const mutate = async (input: TInput) => {
    state.set({
      data: null,
      error: null,
      status: 'loading',
    });

    // 🔥 Snapshot cache state for auto-rollback
    let snapshot: Map<string, any> | undefined;

    if (options.optimisticUpdate) {
      // Take snapshot of ALL current cache entries before optimistic update
      snapshot = new Map<string, any>();
      for (const entry of cache.getAll()) {
        snapshot.set(hashKey(entry.key), {
          key: entry.key,
          data: structuredClone(entry.state()),
        });
      }

      // Apply the optimistic update (user calls client.setQueryData inside)
      options.optimisticUpdate(input);
    }

    try {
      const result = await options.mutationFn(input);

      state.set({
        data: result,
        error: null,
        status: 'success',
      });

      options.onSuccess?.(result);

      // 🔥 Invalidate queries after success
      options.invalidateQueries?.forEach(key => {
        client.invalidate(key);
      });
    } catch (error) {
      // 🔥 Auto-rollback on error
      if (snapshot) {
        if (options.rollback) {
          // Custom rollback
          const context: MutationContext = { previousData: snapshot };
          options.rollback(context);
        } else {
          // Automatic rollback — restore all cache entries to their pre-mutation state
          for (const [_hash, { key, data }] of snapshot) {
            const entry = cache.get(key);
            if (entry) {
              entry.state.set(data);
            }
          }
        }
      }

      state.set({
        data: null,
        error,
        status: 'error',
      });

      options.onError?.(error);
    }
  };

  return {
    data: computed(() => state().data),
    error: computed(() => state().error),
    status: computed(() => state().status),
    isLoading: computed(() => state().status === 'loading'),
    mutate,
  };
}
