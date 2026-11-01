import { Component, inject } from '@angular/core';
import { createMutation } from '../src/lib/mutation/create-mutation';
import { QueryClient } from '../src/lib/core/query-client';

interface User {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  template: `
    <button (click)="createUser()" [disabled]="mutation.isLoading()">
      {{ mutation.isLoading() ? 'Saving...' : 'Create User' }}
    </button>
    @if (mutation.error()) {
      <p style="color: red">Error creating user</p>
    }
    @if (mutation.status() === 'success') {
      <p style="color: green">User created!</p>
    }
  `,
})
export class CreateUserComponent {
  private client = inject(QueryClient);

  mutation = createMutation<{ name: string }, User>({
    mutationFn: (user) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).then(res => res.json()),

    // 🔥 Optimistic update: immediately add user to cache
    optimisticUpdate: (variables) => {
      this.client.setQueryData<User[]>(['users'], (old) => [
        ...(old ?? []),
        { id: Date.now(), name: variables.name },
      ]);
    },

    // Auto-invalidate users list on success (server returns real data)
    invalidateQueries: [['users']],

    onSuccess: (data) => console.log('Created:', data),
    onError: (err) => console.error('Failed:', err),
  });

  createUser() {
    this.mutation.mutate({ name: 'Ali' });
  }
}
