import { QueryClient } from '../core/query-client';
import { QueryState } from '../query/types';

/**
 * Serialized cache state for transfer between server and client.
 */
export interface DehydratedState {
  queries: Array<{
    key: readonly unknown[];
    state: QueryState<unknown>;
  }>;
}

/**
 * Serialize all cache state from a QueryClient into a JSON-safe object.
 * Run this on the server after prefetching queries.
 *
 * ```ts
 * const client = new QueryClient();
 * await client.prefetchQuery({ key: ['users'], fetcher: fetchUsers });
 * const state = dehydrate(client);
 * // Transfer `state` to the client via TransferState, window.__STATE__, etc.
 * ```
 */
export function dehydrate(client: QueryClient): DehydratedState {
  const entries = client.getCache().getAll();
  return {
    queries: entries.map(entry => ({
      key: entry.key,
      state: entry.state(),
    })),
  };
}

/**
 * Restore cache state from a dehydrated state object.
 * Run this on the client before rendering to populate the cache with server-fetched data.
 *
 * ```ts
 * const client = inject(QueryClient);
 * hydrate(client, window.__SIGNAL_QUERY_STATE__);
 * ```
 */
export function hydrate(client: QueryClient, dehydratedState: DehydratedState) {
  for (const query of dehydratedState.queries) {
    client.setQueryData(query.key, query.state.data);
  }
}

/**
 * Angular provider function for SSR hydration support.
 * Integrates with Angular's TransferState for Universal apps.
 *
 * Usage in app.config.server.ts:
 * ```ts
 * import { provideSignalQueryHydration } from 'signal-query';
 *
 * export const config = {
 *   providers: [provideSignalQueryHydration()]
 * };
 * ```
 */
export function provideSignalQueryHydration() {
  return {
    provide: 'SIGNAL_QUERY_HYDRATION',
    useFactory: () => ({ dehydrate, hydrate }),
  };
}
