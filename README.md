# ng-signal-query

[![npm version](https://img.shields.io/npm/v/@ali7040/ng-signal-query?style=flat-square)](https://www.npmjs.com/package/@ali7040/ng-signal-query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./projects/signal-query/LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg?style=flat-square)](https://angular.dev/)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-lightpink?style=flat-square)](https://github.com/sponsors/ali7040)

Server state for Angular, built on signals. Queries, mutations, infinite scroll,
caching and SSR hydration — with no observer layer underneath, because the cache
entry *is* a signal.

**📖 [Docs and interactive playground →](https://ali7040.github.io/ng-signal-query-site/)**

```bash
npm i @ali7040/ng-signal-query
```

## What's distinctive

**Mutation concurrency strategies.** Overlapping `mutate()` calls resolve the way
you choose, with semantics borrowed from the RxJS flattening operators:

```ts
// Double-click proof. No disabled flag, no debounce.
const submit = createMutation({
  mutationFn: (order: Order) => api.place(order),
  concurrencyStrategy: 'exhaust',
});
```

| Strategy | RxJS | Behaviour |
|----------|------|-----------|
| `merge` | `mergeMap` | Every call runs, in parallel (default) |
| `concat` | `concatMap` | Queued, and kept in order |
| `switch` | `switchMap` | Latest wins, earlier discarded |
| `exhaust` | `exhaustMap` | First wins, the rest ignored |

[See them run on a live timeline →](https://ali7040.github.io/ng-signal-query-site/#playground)

**Request cancellation.** Every fetcher receives an `AbortSignal`, and superseded
requests are actually aborted:

```ts
const users = createQuery({
  key: ['users'],
  fetcher: ({ signal }) => fetch('/api/users', { signal }).then(r => r.json()),
});
```

Queries sharing a key also share a single in-flight request.

## How it compares to TanStack Query

TanStack Query is the reference implementation for this problem and, for most
teams, still the right answer. The
[comparison table](https://ali7040.github.io/ng-signal-query-site/#compare) is
honest about both directions — including `enabled`, `select`, `placeholderData`,
persistence and offline support, which it has and this does not yet.

## Documentation

- [Full API documentation](./projects/signal-query/README.md)
- [Guides and details](./projects/signal-query/DOCS.md)
- [Changelog](./projects/signal-query/CHANGELOG.md)
- [Roadmap](./projects/signal-query/ROADMAP.md) · [Issue backlog](./projects/signal-query/ISSUES.md)
- [Releasing](./RELEASING.md)

## Contributing

Issues and pull requests are welcome — several are tagged
[`good first issue`](https://github.com/Ali7040/ng-signal-query/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
See the [contributing guide](./projects/signal-query/CONTRIBUTING.md).

## Repository layout

```
projects/signal-query/     the published library
projects/signal-query/examples/   runnable examples
src/                       demo application shell
```

Common commands:

```bash
npm start          # serve the demo app
npm run build:lib  # build the publishable library
npm test           # run the test suite
```

The website lives in a separate repository:
[ng-signal-query-site](https://github.com/Ali7040/ng-signal-query-site).

## License

MIT — see [LICENSE](./LICENSE).
