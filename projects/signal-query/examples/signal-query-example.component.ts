import { Component, signal } from '@angular/core';
import { createSignalQuery } from '../src/lib/query/create-signal-query';

interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Demonstrates createSignalQuery — the query re-runs automatically
 * whenever the `userId` signal changes. No manual refetch needed.
 */
@Component({
  standalone: true,
  template: `
    <div>
      <label>User ID:
        <input type="number" [value]="userId()" (input)="userId.set(+$any($event.target).value)" min="1" />
      </label>
    </div>

    @if (user.isLoading()) {
      <p>Loading user {{ userId() }}...</p>
    }
    @if (user.isError()) {
      <p style="color: red">Failed to load user</p>
    }
    @if (user.isSuccess()) {
      <dl>
        <dt>Name</dt><dd>{{ user.data()?.name }}</dd>
        <dt>Email</dt><dd>{{ user.data()?.email }}</dd>
      </dl>
    }
  `,
})
export class SignalQueryExampleComponent {
  userId = signal(1);

  // 🔥 Query key includes userId() → auto re-fetches when it changes
  user = createSignalQuery<User>(() => ({
    key: ['user', this.userId()],
    fetcher: () =>
      fetch(`https://jsonplaceholder.typicode.com/users/${this.userId()}`)
        .then(res => res.json()),
    staleTime: 60_000,
  }));
}
