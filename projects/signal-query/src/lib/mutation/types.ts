import { Signal } from '@angular/core';

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MutationContext {
  /** Snapshot of all cache entries before the optimistic update was applied. */
  previousData: Map<string, any>;
}

export interface MutationState<TData> {
  data: TData | null;
  error: unknown;
  status: MutationStatus;
}

export interface CreateMutationOptions<TInput, TOutput> {
  mutationFn: (input: TInput) => Promise<TOutput>;
  onSuccess?: (data: TOutput) => void;
  onError?: (error: unknown) => void;
  invalidateQueries?: readonly unknown[][];

  /**
   * Called before the mutation runs. Use `queryClient.setQueryData()`
   * inside to apply optimistic changes to cached data.
   */
  optimisticUpdate?: (variables: TInput) => void;

  /**
   * Custom rollback logic. If not provided, automatic rollback
   * restores all cache entries that were modified during `optimisticUpdate`.
   */
  rollback?: (context: MutationContext) => void;
}

export interface MutationResult<TInput, TOutput> {
  data: Signal<TOutput | null>;
  error: Signal<unknown>;
  status: Signal<MutationStatus>;
  isLoading: Signal<boolean>;
  mutate: (input: TInput) => Promise<void>;
}
