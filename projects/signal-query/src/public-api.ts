/*
 * Public API Surface of signal-query
 */

// Core
export { QueryClient } from './lib/core/query-client';
export { QueryCache } from './lib/core/query-cache';
export type { CacheEntry } from './lib/core/query-cache';
export { serializeKey, hashKey, matchKey, matchKeyPrefix } from './lib/core/query-key';

// Query
export { createQuery } from './lib/query/create-query';
export { createSignalQuery } from './lib/query/create-signal-query';
export { createInfiniteQuery } from './lib/query/create-infinite-query';
export type { QueryState, QueryStatus, CreateQueryOptions, QueryResult } from './lib/query/types';
export type { CreateInfiniteQueryOptions, InfiniteQueryResult } from './lib/query/infinite-types';

// Mutation
export { createMutation } from './lib/mutation/create-mutation';
export type {
  MutationState,
  MutationStatus,
  MutationContext,
  CreateMutationOptions,
  MutationResult,
} from './lib/mutation/types';

// DevTools
export { SignalQueryDevtoolsComponent } from './lib/devtools/signal-query-devtools.component';

// SSR / Hydration
export {
  dehydrate,
  hydrate,
  provideSignalQueryHydration,
} from './lib/ssr/hydration';
export type { DehydratedState } from './lib/ssr/hydration';

// Adapters (optional RxJS bridge)
export { toObservable$, fromObservable } from './lib/adapters/rxjs-adapter';
