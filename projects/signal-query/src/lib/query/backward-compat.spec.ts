import { TestBed } from '@angular/core/testing';
import { createQuery } from './create-query';
import { createMutation } from '../mutation/create-mutation';
import { QueryClient } from '../core/query-client';
import { CreateQueryOptions } from './types';

/**
 * Backward-compatibility guarantees.
 *
 * These tests pin the public behavior that existed before the fetch-core
 * rewrite (race guard, deduplication, cancellation, retry). Existing apps
 * upgrading to 0.1.0 must observe no behavioral change unless they opt in.
 *
 * If a change here fails, it is a breaking change for published users —
 * fix the change, don't "fix" the test.
 */
describe('backward compatibility', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QueryClient] });
  });

  const run = <T>(opts: CreateQueryOptions<T>) =>
    TestBed.runInInjectionContext(() =>
      createQuery<T>({ refetchOnWindowFocus: false, refetchOnReconnect: false, ...opts })
    );

  it('a failing query reports its error immediately (retry is opt-in)', async () => {
    let attempts = 0;
    const q = run<string>({
      key: ['compat', 'no-retry-by-default'],
      fetcher: async () => {
        attempts++;
        throw new Error('fail');
      },
    });

    await new Promise<void>((r) => setTimeout(r, 20));

    // Pre-0.1.0 behavior: one attempt, error surfaces right away.
    expect(attempts).toBe(1);
    expect(q.status()).toBe('error');
    expect(q.error()).toBeInstanceOf(Error);
  });

  it('accepts a zero-argument fetcher (pre-AbortSignal signature)', async () => {
    // Existing user code written as `fetcher: () => fetch(...)` must still
    // compile and run now that the fetcher receives a context argument.
    const legacyFetcher = () => Promise.resolve('legacy');

    const q = run<string>({ key: ['compat', 'legacy-fetcher'], fetcher: legacyFetcher });
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(q.status()).toBe('success');
    expect(q.data()).toBe('legacy');
  });

  it('exposes the original QueryResult surface', () => {
    const q = run<string>({ key: ['compat', 'surface'], fetcher: async () => 'x' });

    for (const k of ['data', 'status', 'error', 'isLoading', 'isSuccess', 'isError']) {
      expect(typeof (q as any)[k]).toBe('function');
    }
    expect(typeof q.refetch).toBe('function');
  });

  it('mutations still do not retry by default', async () => {
    let attempts = 0;
    const m = TestBed.runInInjectionContext(() =>
      createMutation<string, string>({
        mutationFn: async () => {
          attempts++;
          throw new Error('fail');
        },
      })
    );

    await m.mutate('x');

    expect(attempts).toBe(1);
    expect(m.status()).toBe('error');
  });

  it('opting in to retry still works', async () => {
    let attempts = 0;
    const q = run<string>({
      key: ['compat', 'opt-in-retry'],
      retry: 2,
      retryDelay: () => 1,
      fetcher: async () => {
        attempts++;
        if (attempts < 3) throw new Error('transient');
        return 'ok';
      },
    });

    const start = Date.now();
    while (q.status() !== 'success' && Date.now() - start < 2000) {
      await new Promise<void>((r) => setTimeout(r, 2));
    }

    expect(attempts).toBe(3);
    expect(q.data()).toBe('ok');
  });
});
