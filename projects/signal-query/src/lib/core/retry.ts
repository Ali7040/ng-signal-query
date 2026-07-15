/**
 * Retry utilities with exponential backoff.
 *
 * Shared by queries and mutations. Retries are abortable — a triggered
 * `AbortSignal` cancels any pending backoff delay and stops further attempts.
 */

/**
 * Controls whether a failed request is retried.
 * - `number`  — retry up to N times (N retries + 1 initial attempt).
 * - `boolean` — `false` disables retries, `true` retries indefinitely.
 * - function  — decide per-failure from the attempt count and error.
 */
export type RetryValue = number | boolean | ((failureCount: number, error: unknown) => boolean);

/**
 * Delay (ms) before the next retry.
 * - `number`  — fixed delay.
 * - function  — compute from the attempt count and error (e.g. backoff).
 */
export type RetryDelayValue = number | ((failureCount: number, error: unknown) => number);

/**
 * Error thrown when a retry loop is aborted via its `AbortSignal`.
 */
export class AbortError extends Error {
  constructor(message = 'The operation was aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

/**
 * Default backoff: 1s, 2s, 4s, 8s … capped at 30s.
 * `failureCount` is 1-based (1 on the first failure).
 */
export function defaultRetryDelay(failureCount: number): number {
  return Math.min(1000 * 2 ** (failureCount - 1), 30_000);
}

function shouldRetry(retry: RetryValue, failureCount: number, error: unknown): boolean {
  if (typeof retry === 'boolean') return retry;
  if (typeof retry === 'number') return failureCount <= retry;
  return retry(failureCount, error);
}

/** Promise-based delay that rejects with {@link AbortError} if the signal fires. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new AbortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort);
  });
}

/**
 * Run `fn`, retrying on failure according to `retry` / `retryDelay`.
 * Rethrows the last error once retries are exhausted, or an {@link AbortError}
 * if `signal` fires during an attempt or a backoff delay.
 */
export async function runWithRetry<T>(
  fn: (context: { signal: AbortSignal }) => Promise<T>,
  retry: RetryValue,
  retryDelay: RetryDelayValue,
  signal: AbortSignal,
): Promise<T> {
  let failureCount = 0;

  while (true) {
    if (signal.aborted) throw new AbortError();

    try {
      return await fn({ signal });
    } catch (error) {
      failureCount++;

      if (signal.aborted || !shouldRetry(retry, failureCount, error)) {
        throw error;
      }

      const delay =
        typeof retryDelay === 'function' ? retryDelay(failureCount, error) : retryDelay;
      await sleep(delay, signal);
    }
  }
}
