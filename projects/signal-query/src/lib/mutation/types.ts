import { Signal } from '@angular/core';

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

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
}

export interface MutationResult<TInput, TOutput> {
  data: Signal<TOutput | null>;
  error: Signal<unknown>;
  status: Signal<MutationStatus>;
  isLoading: Signal<boolean>;
  mutate: (input: TInput) => Promise<void>;
}
