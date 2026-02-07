import { signal, computed, inject } from '@angular/core';
import {
  CreateMutationOptions,
  MutationResult,
  MutationState,
} from './types';
import { QueryClient } from '../core/query-client';

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

  const state = signal<MutationState<TOutput>>(
    createInitialState<TOutput>()
  );

  const mutate = async (input: TInput) => {
    state.set({
      data: null,
      error: null,
      status: 'loading',
    });

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
