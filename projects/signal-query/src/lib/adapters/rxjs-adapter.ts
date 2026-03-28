import { Signal, effect } from '@angular/core';
import { Observable, Subscriber, from } from 'rxjs';
import { QueryResult } from '../query/types';

/**
 * Convert a signal-based QueryResult into an RxJS Observable that emits data changes.
 *
 * The core library has zero RxJS dependency — this adapter is optional
 * and only imported when needed.
 *
 * ```ts
 * import { toObservable$ } from 'signal-query/adapters';
 *
 * const users = createQuery({ key: ['users'], fetcher: fetchUsers });
 * const users$ = toObservable$(users);
 * users$.subscribe(data => console.log('Users changed:', data));
 * ```
 */
export function toObservable$<T>(queryResult: QueryResult<T>): Observable<T | null> {
  return new Observable<T | null>((subscriber: Subscriber<T | null>) => {
    const ref = effect(() => {
      const data = queryResult.data();
      subscriber.next(data);
    });

    return () => ref.destroy();
  });
}

/**
 * Wrap an RxJS Observable as a Promise-based query fetcher.
 *
 * ```ts
 * const users = createQuery({
 *   key: ['users'],
 *   fetcher: fromObservable(httpClient.get<User[]>('/api/users')),
 * });
 * ```
 */
export function fromObservable<T>(obs$: Observable<T>): () => Promise<T> {
  return () =>
    new Promise<T>((resolve, reject) => {
      let resolved = false;
      const subscription = obs$.subscribe({
        next: (val) => {
          if (!resolved) {
            resolved = true;
            resolve(val);
            subscription.unsubscribe();
          }
        },
        error: reject,
        complete: () => {
          if (!resolved) {
            reject(new Error('Observable completed without emitting a value'));
          }
        },
      });
    });
}
