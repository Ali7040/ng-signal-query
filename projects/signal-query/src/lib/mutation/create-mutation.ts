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
  const strategy = options.concurrencyStrategy ?? 'merge';

  const state = signal<MutationState<TOutput>>(
    createInitialState<TOutput>()
  );

  let running = false;
  let generation = 0;
  const concatQueue: Array<() => void> = [];

  /**
   * Core execution pipeline shared by all strategies.
   * The `gen` parameter allows the switch strategy to discard
   * results from superseded mutations.
   */
  const executeMutation = async (input: TInput, gen: number): Promise<void> => {
    const isActive = () => strategy !== 'switch' || gen === generation;

    if (isActive()) {
      state.set({
        data: null,
        error: null,
        status: 'loading',
      });
    }

    let snapshot: Map<string, any> | undefined;

    if (options.optimisticUpdate && isActive()) {
      snapshot = new Map<string, any>();
      for (const entry of cache.getAll()) {
        snapshot.set(hashKey(entry.key), {
          key: entry.key,
          data: structuredClone(entry.state()),
        });
      }
      options.optimisticUpdate(input);
    }

    try {
      const result = await options.mutationFn(input);

      if (!isActive()) return;

      state.set({
        data: result,
        error: null,
        status: 'success',
      });

      options.onSuccess?.(result);

      options.invalidateQueries?.forEach(key => {
        client.invalidate(key);
      });
    } catch (error) {
      if (!isActive()) return;

      if (snapshot) {
        if (options.rollback) {
          const context: MutationContext = { previousData: snapshot };
          options.rollback(context);
        } else {
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

  const mutate = async (input: TInput): Promise<void> => {
    switch (strategy) {
      case 'merge': {
        const gen = ++generation;
        await executeMutation(input, gen);
        break;
      }

      case 'concat': {
        return new Promise<void>((resolve) => {
          const run = async () => {
            running = true;
            const gen = ++generation;
            try {
              await executeMutation(input, gen);
            } finally {
              running = false;
              resolve();
              queueMicrotask(() => {
                const next = concatQueue.shift();
                if (next) next();
              });
            }
          };

          if (!running) {
            run();
          } else {
            concatQueue.push(run);
          }
        });
      }

      case 'switch': {
        const gen = ++generation;
        running = true;
        try {
          await executeMutation(input, gen);
        } finally {
          if (gen === generation) {
            running = false;
          }
        }
        break;
      }

      case 'exhaust': {
        if (running) return;
        running = true;
        const gen = ++generation;
        try {
          await executeMutation(input, gen);
        } finally {
          running = false;
        }
        break;
      }
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
