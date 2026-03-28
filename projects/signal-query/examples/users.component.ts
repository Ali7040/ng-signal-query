import { Component } from '@angular/core';
import { createQuery } from '../src/lib/query/create-query';

@Component({
  standalone: true,
  template: `
    @if (users.isLoading()) {
      <div>Loading...</div>
    }
    @if (users.isError()) {
      <div>Error: {{ users.error() }}</div>
    }
    @if (users.isSuccess()) {
      <ul>
        @for (user of users.data(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
      <button (click)="users.refetch()">Refresh</button>
    }
  `,
})
export class UsersComponent {
  users = createQuery({
    key: ['users'],
    fetcher: () => fetch('/api/users').then(res => res.json()),
    staleTime: 30_000, // 30s
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
