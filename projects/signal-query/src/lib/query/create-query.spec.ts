import { TestBed } from '@angular/core/testing';
import { createQuery } from './create-query';
import { QueryClient } from '../core/query-client';
import { CreateQueryOptions } from './types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flush() {
  // Let queued microtasks (and short retry timers) settle.
  await new Promise<void>((r) => setTimeout(r, 0));
}

async function waitFor(predicate: () => boolean, timeout = 2000) {
  const start = Date.now();
  while (!predicate() && Date.now() - start < timeout) {
    await new Promise<void>((r) => setTimeout(r, 2));
  }
}

/** Defaults that keep focus/reconnect listeners out of the way in tests. */
function setup<T>(opts: Partial<CreateQueryOptions<T>> & { fetcher: CreateQueryOptions<T>['fetcher']; key: readonly unknown[] }) {
  return TestBed.runInInjectionContext(() =>
    createQuery<T>({
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...opts,
    } as CreateQueryOptions<T>)
  );
}

describe('createQuery', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QueryClient] });
  });

  // ─── Basic state transitions ──────────────────────────────────────

  it('transitions idle → loading → success', async () => {
    const d = deferred<string>();
    const q = setup<string>({ key: ['basic'], fetcher: () => d.promise, retry: 0 });

    expect(q.status()).toBe('loading');
    expect(q.isLoading()).toBe(true);

    d.resolve('hello');
    await flush();

    expect(q.status()).toBe('success');
    expect(q.data()).toBe('hello');
    expect(q.isSuccess()).toBe(true);
  });

  it('transitions to error state', async () => {
    const d = deferred<string>();
    const q = setup<string>({ key: ['err'], fetcher: () => d.promise, retry: 0 });

    d.reject(new Error('boom'));
    await flush();

    expect(q.status()).toBe('error');
    expect(q.isError()).toBe(true);
    expect(q.error()).toBeInstanceOf(Error);
  });

  // ─── A1: race-condition guard ─────────────────────────────────────

  describe('race safety (A1)', () => {
    it('a slow older response cannot overwrite a fresher one', async () => {
      const defs = [deferred<string>(), deferred<string>()];
      let idx = 0;
      const q = setup<string>({
        key: ['race'],
        fetcher: () => defs[idx++].promise,
        retry: 0,
      });

      // Initial fetch (gen 1) is in flight on defs[0].
      const refetchP = q.refetch(); // gen 2, in flight on defs[1]

      // The newer request resolves first.
      defs[1].resolve('new');
      await refetchP;
      expect(q.data()).toBe('new');

      // The older request resolves later — must be discarded.
      defs[0].resolve('stale');
      await flush();
      expect(q.data()).toBe('new');
      expect(q.status()).toBe('success');
    });
  });

  // ─── A2: in-flight deduplication ──────────────────────────────────

  describe('deduplication (A2)', () => {
    it('two subscribers on the same key trigger one fetch', async () => {
      const d = deferred<string>();
      let callCount = 0;
      const fetcher = () => {
        callCount++;
        return d.promise;
      };

      const a = setup<string>({ key: ['dedup'], fetcher, retry: 0 });
      const b = setup<string>({ key: ['dedup'], fetcher, retry: 0 });

      expect(callCount).toBe(1);

      d.resolve('shared');
      await flush();

      expect(a.data()).toBe('shared');
      expect(b.data()).toBe('shared');
    });
  });

  // ─── A3: cancellation via AbortSignal ─────────────────────────────

  describe('cancellation (A3)', () => {
    it('passes an AbortSignal and aborts the superseded request on refetch', async () => {
      const signals: AbortSignal[] = [];
      const defs = [deferred<string>(), deferred<string>()];
      let idx = 0;
      const q = setup<string>({
        key: ['abort'],
        fetcher: ({ signal }) => {
          signals.push(signal);
          return defs[idx++].promise;
        },
        retry: 0,
      });

      expect(signals[0]).toBeInstanceOf(AbortSignal);
      expect(signals[0].aborted).toBe(false);

      const refetchP = q.refetch();

      // The first request's signal is aborted by the forced refetch.
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);

      defs[1].resolve('fresh');
      await refetchP;
      expect(q.data()).toBe('fresh');
    });
  });

  // ─── A4: retry with backoff ───────────────────────────────────────

  describe('retry (A4)', () => {
    it('retries a failing fetcher until it succeeds', async () => {
      let attempts = 0;
      const q = setup<string>({
        key: ['retry-ok'],
        retry: 3,
        retryDelay: () => 1,
        fetcher: async () => {
          attempts++;
          if (attempts < 3) throw new Error('transient');
          return 'recovered';
        },
      });

      await waitFor(() => q.status() === 'success');

      expect(attempts).toBe(3);
      expect(q.status()).toBe('success');
      expect(q.data()).toBe('recovered');
    });

    it('does not retry when retry is 0', async () => {
      let attempts = 0;
      const q = setup<string>({
        key: ['retry-off'],
        retry: 0,
        fetcher: async () => {
          attempts++;
          throw new Error('fail');
        },
      });

      await flush();

      expect(attempts).toBe(1);
      expect(q.status()).toBe('error');
    });
  });
});
