import { TestBed } from '@angular/core/testing';
import { createMutation } from './create-mutation';
import { QueryClient } from '../core/query-client';
import { CreateMutationOptions, MutationConcurrencyStrategy } from './types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup<TInput = string, TOutput = string>(
  opts: Partial<CreateMutationOptions<TInput, TOutput>> & {
    mutationFn: (input: TInput) => Promise<TOutput>;
  }
) {
  return TestBed.runInInjectionContext(() => createMutation<TInput, TOutput>(opts));
}

async function flushMicrotasks() {
  await new Promise<void>((r) => queueMicrotask(r));
}

describe('createMutation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QueryClient] });
  });

  // ─── Basic state transitions ──────────────────────────────────────

  it('starts in idle state', () => {
    const mutation = setup({ mutationFn: () => Promise.resolve('ok') });
    expect(mutation.status()).toBe('idle');
    expect(mutation.data()).toBeNull();
    expect(mutation.error()).toBeNull();
    expect(mutation.isLoading()).toBe(false);
  });

  it('transitions through loading → success', async () => {
    const d = deferred<string>();
    const mutation = setup({ mutationFn: () => d.promise });

    const p = mutation.mutate('go');
    expect(mutation.status()).toBe('loading');
    expect(mutation.isLoading()).toBe(true);

    d.resolve('done');
    await p;

    expect(mutation.status()).toBe('success');
    expect(mutation.data()).toBe('done');
    expect(mutation.error()).toBeNull();
    expect(mutation.isLoading()).toBe(false);
  });

  it('transitions through loading → error', async () => {
    const d = deferred<string>();
    const mutation = setup({ mutationFn: () => d.promise });

    const p = mutation.mutate('go');
    expect(mutation.status()).toBe('loading');

    d.reject(new Error('fail'));
    await p;

    expect(mutation.status()).toBe('error');
    expect(mutation.data()).toBeNull();
    expect(mutation.error()).toBeInstanceOf(Error);
  });

  it('defaults to merge strategy', async () => {
    let callCount = 0;
    const mutation = setup({
      mutationFn: async () => {
        callCount++;
        return 'ok';
      },
    });

    await Promise.all([mutation.mutate('a'), mutation.mutate('b')]);
    expect(callCount).toBe(2);
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const mutation = setup({
      mutationFn: async () => 'result',
      onSuccess,
    });

    await mutation.mutate('x');
    expect(onSuccess).toHaveBeenCalledWith('result');
  });

  it('calls onError callback', async () => {
    const onError = vi.fn();
    const mutation = setup({
      mutationFn: async () => { throw new Error('boom'); },
      onError,
    });

    await mutation.mutate('x');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  // ─── merge strategy ───────────────────────────────────────────────

  describe('merge strategy', () => {
    it('runs all mutations in parallel', async () => {
      const calls: number[] = [];
      let callIndex = 0;
      const deferreds = [deferred<string>(), deferred<string>(), deferred<string>()];

      const mutation = setup({
        concurrencyStrategy: 'merge',
        mutationFn: () => {
          const idx = callIndex++;
          calls.push(idx);
          return deferreds[idx].promise;
        },
      });

      const p1 = mutation.mutate('a');
      const p2 = mutation.mutate('b');
      const p3 = mutation.mutate('c');

      expect(calls).toEqual([0, 1, 2]);

      deferreds[0].resolve('r0');
      deferreds[1].resolve('r1');
      deferreds[2].resolve('r2');

      await Promise.all([p1, p2, p3]);
      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('r2');
    });

    it('last to resolve determines final state', async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const mutation = setup({
        concurrencyStrategy: 'merge',
        mutationFn: () => (idx++ === 0 ? d1.promise : d2.promise),
      });

      const p1 = mutation.mutate('a');
      const p2 = mutation.mutate('b');

      d2.resolve('second');
      await p2;
      expect(mutation.data()).toBe('second');

      d1.resolve('first');
      await p1;
      expect(mutation.data()).toBe('first');
    });

    it('preserves current behavior as the default strategy', async () => {
      let callCount = 0;
      const mutation = setup({
        mutationFn: async () => {
          callCount++;
          return `call-${callCount}`;
        },
      });

      await Promise.all([mutation.mutate('a'), mutation.mutate('b'), mutation.mutate('c')]);
      expect(callCount).toBe(3);
    });
  });

  // ─── concat strategy ──────────────────────────────────────────────

  describe('concat strategy', () => {
    it('queues mutations and executes sequentially', async () => {
      const executionOrder: string[] = [];
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const d3 = deferred<string>();
      let idx = 0;
      const defs = [d1, d2, d3];

      const mutation = setup({
        concurrencyStrategy: 'concat',
        mutationFn: async (input: string) => {
          const d = defs[idx++];
          const result = await d.promise;
          executionOrder.push(input);
          return result;
        },
      });

      const p1 = mutation.mutate('first');
      const p2 = mutation.mutate('second');
      const p3 = mutation.mutate('third');

      expect(mutation.status()).toBe('loading');

      d1.resolve('r1');
      await p1;
      executionOrder.push('--after-p1--');

      d2.resolve('r2');
      await p2;
      executionOrder.push('--after-p2--');

      d3.resolve('r3');
      await p3;

      expect(executionOrder).toEqual([
        'first', '--after-p1--',
        'second', '--after-p2--',
        'third',
      ]);
    });

    it('does not start second mutation until first completes', async () => {
      let activeCount = 0;
      let maxActive = 0;

      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const mutation = setup({
        concurrencyStrategy: 'concat',
        mutationFn: async () => {
          activeCount++;
          maxActive = Math.max(maxActive, activeCount);
          const result = await [d1, d2][idx++].promise;
          activeCount--;
          return result;
        },
      });

      const p1 = mutation.mutate('a');
      const p2 = mutation.mutate('b');

      d1.resolve('r1');
      await p1;
      d2.resolve('r2');
      await p2;

      expect(maxActive).toBe(1);
    });

    it('processes error in queue without stopping subsequent mutations', async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const onError = vi.fn();
      const onSuccess = vi.fn();
      const statusLog: string[] = [];

      const mutation = setup({
        concurrencyStrategy: 'concat',
        mutationFn: () => [d1, d2][idx++].promise,
        onError: (err) => {
          statusLog.push('onError');
          onError(err);
        },
        onSuccess: (data) => {
          statusLog.push('onSuccess');
          onSuccess(data);
        },
      });

      const p1 = mutation.mutate('a');
      const p2 = mutation.mutate('b');

      d1.reject(new Error('fail'));
      await p1;

      expect(onError).toHaveBeenCalledTimes(1);

      d2.resolve('success');
      await p2;
      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('success');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(statusLog).toEqual(['onError', 'onSuccess']);
    });
  });

  // ─── switch strategy ──────────────────────────────────────────────

  describe('switch strategy', () => {
    it('ignores result of superseded mutation', async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const onSuccess = vi.fn();

      const mutation = setup({
        concurrencyStrategy: 'switch',
        mutationFn: () => [d1, d2][idx++].promise,
        onSuccess,
      });

      const p1 = mutation.mutate('old');
      const p2 = mutation.mutate('new');

      d1.resolve('old-result');
      await p1;
      expect(onSuccess).not.toHaveBeenCalledWith('old-result');

      d2.resolve('new-result');
      await p2;
      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('new-result');
      expect(onSuccess).toHaveBeenCalledWith('new-result');
    });

    it('ignores error of superseded mutation', async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const onError = vi.fn();

      const mutation = setup({
        concurrencyStrategy: 'switch',
        mutationFn: () => [d1, d2][idx++].promise,
        onError,
      });

      const p1 = mutation.mutate('old');
      const p2 = mutation.mutate('new');

      d1.reject(new Error('old-error'));
      await p1;
      expect(onError).not.toHaveBeenCalled();

      d2.resolve('new-result');
      await p2;
      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('new-result');
    });

    it('only applies state from the latest call in rapid succession', async () => {
      const deferreds = Array.from({ length: 5 }, () => deferred<string>());
      let idx = 0;

      const onSuccess = vi.fn();

      const mutation = setup({
        concurrencyStrategy: 'switch',
        mutationFn: () => deferreds[idx++].promise,
        onSuccess,
      });

      const promises = deferreds.map((_, i) => mutation.mutate(`call-${i}`));

      for (let i = 0; i < 4; i++) {
        deferreds[i].resolve(`result-${i}`);
        await promises[i];
      }

      expect(onSuccess).not.toHaveBeenCalled();

      deferreds[4].resolve('result-4');
      await promises[4];

      expect(mutation.data()).toBe('result-4');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith('result-4');
    });
  });

  // ─── exhaust strategy ─────────────────────────────────────────────

  describe('exhaust strategy', () => {
    it('ignores new mutations while one is running', async () => {
      let callCount = 0;
      const d = deferred<string>();

      const mutation = setup({
        concurrencyStrategy: 'exhaust',
        mutationFn: async () => {
          callCount++;
          return d.promise;
        },
      });

      const p1 = mutation.mutate('first');
      mutation.mutate('ignored-1');
      mutation.mutate('ignored-2');

      expect(callCount).toBe(1);

      d.resolve('result');
      await p1;

      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('result');
      expect(callCount).toBe(1);
    });

    it('allows a new mutation after the running one completes', async () => {
      let callCount = 0;
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;

      const mutation = setup({
        concurrencyStrategy: 'exhaust',
        mutationFn: async () => {
          callCount++;
          return [d1, d2][idx++].promise;
        },
      });

      const p1 = mutation.mutate('first');
      mutation.mutate('ignored');
      expect(callCount).toBe(1);

      d1.resolve('r1');
      await p1;
      expect(mutation.data()).toBe('r1');

      const p2 = mutation.mutate('second');
      expect(callCount).toBe(2);

      d2.resolve('r2');
      await p2;
      expect(mutation.data()).toBe('r2');
    });

    it('allows a new mutation after the running one errors', async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let idx = 0;
      let callCount = 0;

      const mutation = setup({
        concurrencyStrategy: 'exhaust',
        mutationFn: () => {
          callCount++;
          return [d1, d2][idx++].promise;
        },
      });

      const p1 = mutation.mutate('first');
      mutation.mutate('ignored');
      expect(callCount).toBe(1);

      d1.reject(new Error('boom'));
      await p1;
      expect(mutation.status()).toBe('error');

      const p2 = mutation.mutate('second');
      expect(callCount).toBe(2);

      d2.resolve('recovered');
      await p2;
      expect(mutation.status()).toBe('success');
      expect(mutation.data()).toBe('recovered');
    });
  });

  // ─── Race-condition tests (rapid consecutive calls) ───────────────

  describe('race-condition safety', () => {
    it('merge: rapid calls all fire and state settles', async () => {
      let counter = 0;
      const mutation = setup({
        concurrencyStrategy: 'merge',
        mutationFn: async () => {
          const val = ++counter;
          await new Promise((r) => setTimeout(r, Math.random() * 10));
          return `r-${val}`;
        },
      });

      const promises = Array.from({ length: 10 }, (_, i) => mutation.mutate(`m${i}`));
      await Promise.all(promises);

      expect(counter).toBe(10);
      expect(mutation.status()).toBe('success');
    });

    it('concat: rapid calls all execute in order', async () => {
      const order: number[] = [];
      let callIdx = 0;

      const mutation = setup({
        concurrencyStrategy: 'concat',
        mutationFn: async () => {
          const idx = callIdx++;
          await new Promise((r) => setTimeout(r, 5));
          order.push(idx);
          return `r-${idx}`;
        },
      });

      const promises = Array.from({ length: 5 }, (_, i) => mutation.mutate(`m${i}`));
      await Promise.all(promises);

      expect(order).toEqual([0, 1, 2, 3, 4]);
      expect(mutation.data()).toBe('r-4');
    });

    it('switch: rapid calls — only the last result sticks', async () => {
      const deferreds = Array.from({ length: 5 }, () => deferred<string>());
      let idx = 0;
      const onSuccess = vi.fn();

      const mutation = setup({
        concurrencyStrategy: 'switch',
        mutationFn: () => deferreds[idx++].promise,
        onSuccess,
      });

      const promises = deferreds.map((_, i) => mutation.mutate(`c-${i}`));

      for (let i = 0; i < 5; i++) {
        deferreds[i].resolve(`res-${i}`);
        await promises[i];
      }

      expect(mutation.data()).toBe('res-4');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('exhaust: rapid calls — only first executes', async () => {
      let callCount = 0;

      const mutation = setup({
        concurrencyStrategy: 'exhaust',
        mutationFn: async () => {
          callCount++;
          await new Promise((r) => setTimeout(r, 20));
          return 'done';
        },
      });

      const p1 = mutation.mutate('a');
      mutation.mutate('b');
      mutation.mutate('c');
      mutation.mutate('d');
      mutation.mutate('e');

      await p1;

      expect(callCount).toBe(1);
      expect(mutation.data()).toBe('done');
    });
  });

  // ─── Optimistic update compatibility ──────────────────────────────

  describe('optimistic update compatibility', () => {
    it('merge: optimistic update + rollback on error', async () => {
      const client = TestBed.inject(QueryClient);
      client.setQueryData<string[]>(['items'], ['a', 'b']);

      const d = deferred<string>();

      const mutation = setup({
        concurrencyStrategy: 'merge',
        mutationFn: () => d.promise,
        optimisticUpdate: (input: string) => {
          client.setQueryData<string[]>(['items'], (old) => [...(old ?? []), input]);
        },
        invalidateQueries: [['items']],
      });

      const p = mutation.mutate('c');
      expect(client.getQueryData<string[]>(['items'])).toEqual(['a', 'b', 'c']);

      d.reject(new Error('server error'));
      await p;

      expect(client.getQueryData<string[]>(['items'])).toEqual(['a', 'b']);
    });

    it('exhaust: optimistic update with ignored calls', async () => {
      const client = TestBed.inject(QueryClient);
      client.setQueryData<string[]>(['items'], ['x']);

      const d = deferred<string>();
      let callCount = 0;

      const mutation = setup({
        concurrencyStrategy: 'exhaust',
        mutationFn: () => {
          callCount++;
          return d.promise;
        },
        optimisticUpdate: () => {
          client.setQueryData<string[]>(['items'], (old) => [...(old ?? []), 'new']);
        },
      });

      const p1 = mutation.mutate('a');
      mutation.mutate('b');

      expect(callCount).toBe(1);
      expect(client.getQueryData<string[]>(['items'])).toEqual(['x', 'new']);

      d.resolve('ok');
      await p1;
      expect(mutation.status()).toBe('success');
    });
  });
});
