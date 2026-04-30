import { Component } from '@angular/core';
import { SignalQueryDevtoolsComponent } from '../src/lib/devtools/signal-query-devtools.component';
import { createQuery } from '../src/lib/query/create-query';

/**
 * Example showing how to add the DevTools panel to your app.
 * Simply include <signal-query-devtools /> in your root component.
 * It only renders in development mode (isDevMode() === true).
 */
@Component({
  standalone: true,
  imports: [SignalQueryDevtoolsComponent],
  template: `
    <h1>My App</h1>
    <p>Open the DevTools panel in the bottom-right corner</p>
    <p>Status: {{ example.status() }}</p>

    <signal-query-devtools />
  `,
})
export class DevtoolsExampleComponent {
  // A sample query so there's something to see in DevTools
  example = createQuery({
    key: ['example', 'devtools-demo'],
    fetcher: () =>
      fetch('https://jsonplaceholder.typicode.com/todos/1').then(r => r.json()),
    staleTime: 10_000,
  });
}
