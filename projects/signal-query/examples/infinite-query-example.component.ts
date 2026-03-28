import { Component } from '@angular/core';
import { createInfiniteQuery } from '../src/lib/query/create-infinite-query';

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * Demonstrates createInfiniteQuery for "Load More" pagination.
 * Uses JSONPlaceholder as a mock API.
 */
@Component({
  standalone: true,
  template: `
    @if (posts.isLoading()) {
      <p>Loading posts...</p>
    }

    @for (page of posts.pages(); track $index) {
      @for (post of page; track post.id) {
        <article>
          <h3>{{ post.title }}</h3>
          <p>{{ post.body }}</p>
        </article>
      }
    }

    @if (posts.hasNextPage()) {
      <button
        (click)="posts.fetchNextPage()"
        [disabled]="posts.isFetchingNextPage()">
        {{ posts.isFetchingNextPage() ? 'Loading...' : 'Load More' }}
      </button>
    } @else if (posts.isSuccess()) {
      <p>No more posts.</p>
    }
  `,
})
export class InfiniteQueryExampleComponent {
  posts = createInfiniteQuery<Post[], number>({
    key: ['posts'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetch(`https://jsonplaceholder.typicode.com/posts?_page=${pageParam}&_limit=10`)
        .then(res => res.json()),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
  });
}
