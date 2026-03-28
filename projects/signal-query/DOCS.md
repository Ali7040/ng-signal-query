# Signal Query — DOCS

## Quick Start

```ts
import { createQuery, QueryClient } from 'signal-query';
```

All functions must be called inside an **injection context** (constructor, field initializer, `inject()`).

---

## createQuery

```ts
users = createQuery({
  key: ['users'],
  fetcher: () => fetch('/api/users').then(r => r.json()),
  staleTime: 30_000,           // 30s — data considered fresh
  cacheTime: 300_000,          // 5min — unused cache TTL
  refetchOnWindowFocus: true,  // default
  refetchOnReconnect: true,    // default
  refetchInterval: 0,          // polling ms (0 = off)
});
```

Returns: `{ data, status, error, isLoading, isSuccess, isError, refetch }`

---

## createSignalQuery

Reactive query that **auto re-fetches** when signal dependencies change.

```ts
userId = signal(1);

user = createSignalQuery(() => ({
  key: ['user', this.userId()],
  fetcher: () => fetch(`/api/users/${this.userId()}`).then(r => r.json()),
}));
```

---

## createInfiniteQuery

For "Load More" / infinite scroll patterns.

```ts
posts = createInfiniteQuery({
  key: ['posts'],
  initialPageParam: 1,
  queryFn: ({ pageParam }) =>
    fetch(`/api/posts?page=${pageParam}`).then(r => r.json()),
  getNextPageParam: (lastPage, allPages) =>
    lastPage.length === 10 ? allPages.length + 1 : undefined,
});
```

Returns: `{ pages, hasNextPage, hasPreviousPage, fetchNextPage, fetchPreviousPage, isFetchingNextPage, ... }`

---

## createMutation

```ts
mutation = createMutation({
  mutationFn: (user: User) =>
    fetch('/api/users', { method: 'POST', body: JSON.stringify(user) })
      .then(r => r.json()),
  invalidateQueries: [['users']],
  onSuccess: (data) => console.log(data),
  onError: (err) => console.error(err),
});

mutation.mutate({ name: 'Ali' });
```

### Optimistic Updates

```ts
mutation = createMutation({
  mutationFn: (user) => api.createUser(user),
  optimisticUpdate: (variables) => {
    this.client.setQueryData(['users'], (old) => [...old, variables]);
  },
  // On error → cache auto-rolls back to snapshot
});
```

---

## QueryClient

```ts
client = inject(QueryClient);

client.getQueryData(['users']);                    // read cache
client.setQueryData(['users'], updatedList);       // write cache
client.invalidate(['users', 1]);                   // exact key
client.invalidatePrefix(['users']);                 // prefix match
await client.prefetchQuery({ key, fetcher });      // SSR prefetch
client.gc();                                       // garbage collect
```

---

## Query Keys

```ts
import { hashKey, matchKey, matchKeyPrefix } from 'signal-query';

hashKey(['users', { role: 'admin' }]); // stable JSON string
matchKey(['a', 1], ['a', 1]);          // true
matchKeyPrefix(['users'], ['users', 1]); // true
```

---

## DevTools

```ts
import { SignalQueryDevtoolsComponent } from 'signal-query';

@Component({
  imports: [SignalQueryDevtoolsComponent],
  template: `
    <signal-query-devtools />
  `,
})
```

Renders a floating panel (dev mode only) showing all cached queries, status, data preview, and staleness.

---

## SSR / Hydration

```ts
import { dehydrate, hydrate, QueryClient } from 'signal-query';

// Server
const client = new QueryClient();
await client.prefetchQuery({ key: ['users'], fetcher: fetchUsers });
const state = dehydrate(client);

// Client
const client = inject(QueryClient);
hydrate(client, transferredState);
```

---

## RxJS Adapter

```ts
import { toObservable$, fromObservable } from 'signal-query';

// Signal → Observable
const users$ = toObservable$(usersQuery);

// Observable → Fetcher
const query = createQuery({
  key: ['users'],
  fetcher: fromObservable(httpClient.get('/api/users')),
});
```
