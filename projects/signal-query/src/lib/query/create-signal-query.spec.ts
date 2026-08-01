import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { createSignalQuery } from './create-signal-query';
import { createQuery } from './create-query';
import { QueryClient } from '../core/query-client';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Flush Angular effects, then let pending microtasks/promises settle. */
async function flush() {
  TestBed.tick();
  await new Promise<void>((r) => setTimeout(r, 0));
}

describe('createSignalQuery', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QueryClient] });
  });

  it('fetches on initialization', async () => {
    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'init'],
        fetcher: async () => 'hello',
      }))
    );

    await flush();

    expect(q.status()).toBe('success');
    expect(q.data()).toBe('hello');
  });

  it('re-fetches when a signal dependency changes the key', async () => {
    const id = signal(1);
    const seen: number[] = [];

    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'user', id()],
        fetcher: async () => {
          seen.push(id());
          return `user-${id()}`;
        },
      }))
    );

    await flush();
    expect(q.data()).toBe('user-1');

    id.set(2);
    await flush();

    expect(seen).toEqual([1, 2]);
    expect(q.data()).toBe('user-2');
  });

  it('does not refetch when the key is unchanged', async () => {
    const tick = signal(0);
    let calls = 0;

    TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => {
        tick(); // track a signal that does not affect the key
        return {
          key: ['sq', 'stable'],
          fetcher: async () => {
            calls++;
            return 'x';
          },
        };
      })
    );

    await flush();
    expect(calls).toBe(1);

    tick.set(1);
    await flush();

    expect(calls).toBe(1);
  });

  it('shares the cache entry with createQuery for the same key', async () => {
    const client = TestBed.inject(QueryClient);

    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'shared'],
        fetcher: async () => 'from-fetch',
      }))
    );

    await flush();
    expect(q.data()).toBe('from-fetch');

    // A cache write must be observed by the signal query (regression test:
    // it previously kept a private copy of state).
    client.setQueryData<string>(['sq', 'shared'], 'from-cache');
    await flush();

    expect(q.data()).toBe('from-cache');
  });

  it('surfaces errors', async () => {
    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'err'],
        fetcher: async () => {
          throw new Error('nope');
        },
      }))
    );

    await flush();

    expect(q.status()).toBe('error');
    expect(q.error()).toBeInstanceOf(Error);
  });

  it('a superseded key does not overwrite the newer key result', async () => {
    const id = signal(1);
    const defs: Record<number, ReturnType<typeof deferred<string>>> = {
      1: deferred<string>(),
      2: deferred<string>(),
    };

    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'race', id()],
        fetcher: () => defs[id()].promise,
      }))
    );

    await flush();

    // Switch to key 2 while key 1 is still in flight.
    id.set(2);
    await flush();

    defs[2].resolve('second');
    await flush();
    expect(q.data()).toBe('second');

    // The stale key-1 response resolves late and must not be shown.
    defs[1].resolve('first');
    await flush();
    expect(q.data()).toBe('second');
  });

  it('refetch() re-runs the current key', async () => {
    let calls = 0;
    const q = TestBed.runInInjectionContext(() =>
      createSignalQuery<string>(() => ({
        key: ['sq', 'refetch'],
        fetcher: async () => `call-${++calls}`,
      }))
    );

    await flush();
    expect(q.data()).toBe('call-1');

    await q.refetch();
    await flush();

    expect(q.data()).toBe('call-2');
  });
});
