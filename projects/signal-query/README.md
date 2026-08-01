# 🎯 ng-signal-query

[![npm version](https://img.shields.io/npm/v/@ali7040/ng-signal-query?style=flat-square)](https://www.npmjs.com/package/@ali7040/ng-signal-query)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-lightpink?style=flat-square)](https://github.com/sponsors/ali7040)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21.1.0-red.svg?style=flat-square)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

A powerful, type-safe querying library for Angular applications built with signals. Manage server state, infinite queries, mutations, and caching with elegance and performance.

## ✨ Features

- 🚀 **Signal-Driven Architecture** - Leverage Angular signals for reactive state management
- 🔄 **Server State Management** - Queries, mutations, and automatic caching
- ∞ **Infinite Queries** - Seamless pagination with automatic data accumulation
- 🎯 **Type-Safe** - Full TypeScript support with strict typing
- 🛠️ **DevTools Integration** - Built-in debugging component for development
- 📦 **Lightweight** - Minimal bundle size with zero external dependencies (except Angular & RxJS)
- 🔌 **Adapter Pattern** - Custom adapters for different HTTP clients
- 💾 **Smart Caching** - Automatic query result caching with configurable strategies
- 🌐 **SSR Ready** - Server-side rendering support with hydration

## 📦 Installation

```bash
npm install @ali7040/ng-signal-query
```

Or with yarn:

```bash
yarn add @ali7040/ng-signal-query
```

Or with pnpm:

```bash
pnpm add @ali7040/ng-signal-query
```

## 🐙 GitHub Packages

You can also publish/install this package from GitHub Packages.

### Publish to GitHub Packages

1. Create a GitHub Personal Access Token (classic) with:
- `write:packages`
- `read:packages`
- `repo` (only if repository is private)

2. Login to GitHub npm registry:

```bash
npm login --scope=@ali7040 --auth-type=legacy --registry=https://npm.pkg.github.com
```

3. Publish:

```bash
npm run release:github
```

### Install from GitHub Packages

```bash
npm install @ali7040/ng-signal-query --registry=https://npm.pkg.github.com
```

### Requirements

- Angular >= 21.1.0
- TypeScript >= 5.9
- RxJS >= 7.8

## 🚀 Quick Start

### 1. Import the Module

```typescript
import { QueryClient } from '@ali7040/ng-signal-query';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="users(); else loading">
      <div *ngFor="let user of users()">{{ user.name }}</div>
    </div>
    <ng-template #loading>Loading...</ng-template>
  `,
  standalone: true,
})
export class AppComponent {
  private queryClient = inject(QueryClient);

  users = this.queryClient.createQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });
}
```

### 2. Create Queries

```typescript
// Simple query
const users = this.queryClient.createQuery({
  queryKey: ['users'],
  queryFn: () => this.http.get('/api/users'),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Parametized query
const user = signal('1');
const userDetails = this.queryClient.createSignalQuery({
  queryKey: computed(() => ['user', user()]),
  queryFn: async () => this.http.get(`/api/users/${user()}`),
});
```

### 3. Create Mutations

```typescript
const createUser = createMutation({
  mutationFn: (data: User) => this.http.post('/api/users', data),
  invalidateQueries: [['users']],
  onSuccess: (data) => console.log('Created:', data),
});

// Use in template
<button (click)="createUser.mutate({ name: 'John' })">
  {{ createUser.isLoading() ? 'Creating...' : 'Create User' }}
</button>
```

### 3b. Mutation Concurrency Strategy

Control how overlapping `mutate()` calls are handled — inspired by RxJS flattening operators:

```typescript
import { createMutation } from '@ali7040/ng-signal-query';

// Prevent duplicate form submissions
const submitForm = createMutation({
  mutationFn: (form: FormData) => api.submit(form),
  concurrencyStrategy: 'exhaust', // ignore clicks while submitting
});

// Auto-save: only keep the latest
const autoSave = createMutation({
  mutationFn: (draft: Draft) => api.saveDraft(draft),
  concurrencyStrategy: 'switch', // discard stale saves
});

// Ordered steps: execute one at a time
const processStep = createMutation({
  mutationFn: (step: Step) => api.process(step),
  concurrencyStrategy: 'concat', // queue in order
});
```

| Strategy | RxJS equivalent | Behavior |
|----------|-----------------|----------|
| `merge` | `mergeMap` | Run all in parallel (default) |
| `concat` | `concatMap` | Queue and run sequentially |
| `switch` | `switchMap` | Discard previous, keep latest |
| `exhaust` | `exhaustMap` | Ignore new while running |

### 3c. Retry & Cancellation (opt-in)

Fetchers receive an `AbortSignal` so superseded requests are cancelled automatically:

```typescript
const users = createQuery({
  key: ['users'],
  fetcher: ({ signal }) => fetch('/api/users', { signal }).then(r => r.json()),
});
```

Retries are **opt-in** — by default a failed request reports its error immediately:

```typescript
const users = createQuery({
  key: ['users'],
  fetcher: ({ signal }) => fetch('/api/users', { signal }).then(r => r.json()),
  retry: 3,                          // default: 0 (no retries)
  retryDelay: (attempt) => attempt * 1000, // default: 1s → 2s → 4s, max 30s
});
```

`retry` also accepts a predicate for conditional retries:

```typescript
retry: (failureCount, error) => failureCount < 3 && !isAuthError(error),
```

Queries using the same key **share a single in-flight request**, so mounting several
components that read `['users']` performs one fetch.

### 4. Infinite Queries

```typescript
const infiniteUsers = this.queryClient.createInfiniteQuery({
  queryKey: ['users', 'infinite'],
  queryFn: ({ pageParam = 0 }) =>
    this.http.get(`/api/users?page=${pageParam}`),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// Load more
<button (click)="infiniteUsers.fetchNextPage()">
  Load More
</button>
```

## 📚 API Documentation

### QueryClient

Main service for managing all queries and mutations.

```typescript
// Create a query
createQuery(options: CreateQueryOptions)

// Create a signal-based query
createSignalQuery(options: CreateSignalQuery)

// Create an infinite query
createInfiniteQuery(options: CreateInfiniteQueryOptions)

// Create a mutation
createMutation(options: CreateMutationOptions)

// Invalidate queries
invalidateQueries(queryKey: QueryKey)

// Refetch queries
refetchQueries(queryKey: QueryKey)

// Clear all caches
clearCache()
```

### Query State

```typescript
interface QueryState {
  data: TData | null;
  error: Error | null;
  status: 'pending' | 'error' | 'success';
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}
```

### Mutation State

```typescript
type MutationConcurrencyStrategy = 'merge' | 'concat' | 'switch' | 'exhaust';

interface MutationState<TData> {
  data: TData | null;
  error: unknown;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface MutationResult<TInput, TOutput> {
  data: Signal<TOutput | null>;
  error: Signal<unknown>;
  status: Signal<MutationStatus>;
  isLoading: Signal<boolean>;
  mutate: (input: TInput) => Promise<void>;
}
```

## 🔧 Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

### Running Examples

```bash
npm run start
```

Browse to `http://localhost:4200`

## 🛠️ Examples

Check the [examples directory](./examples) for complete working examples:

- [Simple Query Example](./examples/signal-query-example.component.ts)
- [Infinite Query Example](./examples/infinite-query-example.component.ts)
- [Create User Mutation](./examples/create-user.component.ts)
- [DevTools Integration](./examples/devtools-example.component.ts)

## 📖 DevTools

Monitor your queries and mutations in real-time:

```typescript
import { SignalQueryDevtoolsComponent } from '@ali7040/ng-signal-query';

@Component({
  selector: 'app-root',
  template: `
    <app-main></app-main>
    <signal-query-devtools *ngIf="isDev"></signal-query-devtools>
  `,
  imports: [SignalQueryDevtoolsComponent],
})
export class AppComponent {
  isDev = !environment.production;
}
```

## 🚀 Live Testing

Try the library in action:

- **StackBlitz Demo**: [Coming Soon]
- **CodeSandbox**: [Coming Soon]
- **Documentation**: [https://github.com/ali7040/ng-signal-query](https://github.com/ali7040/ng-signal-query)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for detailed instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Angular 21.1](https://angular.io/)
- Inspired by [TanStack Query](https://tanstack.com/query)
- Type-safe with [TypeScript 5.9](https://www.typescriptlang.org/)

## �️ Roadmap & Future Features

We're committed to evolving ng-signal-query to meet production-grade requirements. Here are planned features:

### High Priority ⭐
- ~~**MutationConcurrencyStrategy**~~ ✅ **Shipped!** Control mutation execution with `concurrencyStrategy: 'merge' | 'concat' | 'switch' | 'exhaust'`. See [DOCS.md](./DOCS.md) for details.
  
- **Better Error Handling** - Enhanced error boundaries and recovery patterns
- **Advanced Cache Invalidation Strategies** - More granular control over cache lifecycle
- **Offline Support** - Queue mutations while offline, sync when reconnected

### Medium Priority 📋
- **Request Deduplication** - Automatic duplicate request elimination within a time window
- **Pause/Resume Queries** - Ability to pause and resume query execution
- **Query Dependencies** - Automatic refetch when dependent query data changes
- **Custom Retry Strategies** - Plugin system for complex retry logic

### Community Feedback Welcome
Have ideas? [Open an issue](https://github.com/ali7040/ng-signal-query/issues) or [submit a PR](./CONTRIBUTING.md)!

## �📮 Support

- 🐛 [Report Bugs](https://github.com/ali7040/ng-signal-query/issues)
- 💡 [Request Features](https://github.com/ali7040/ng-signal-query/issues)
- 📧 [Email Support](mailto:support@example.com)

## ❤️ Sponsor

If you want to support this project, you can sponsor ongoing development:

- [GitHub Sponsors](https://github.com/sponsors/ali7040)

## 🔗 Useful Links

- [NPM Package](https://www.npmjs.com/package/@ali7040/ng-signal-query)
- [GitHub Repository](https://github.com/ali7040/ng-signal-query)
- [Project Roadmap](./ROADMAP.md)
- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)

---

**Made with ❤️ by Ali**

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
