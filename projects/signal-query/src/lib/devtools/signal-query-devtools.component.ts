import {
  Component,
  inject,
  isDevMode,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueryClient } from '../core/query-client';
import { CacheEntry } from '../core/query-cache';

@Component({
  selector: 'signal-query-devtools',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shouldRender) {
      <div class="sqd-panel" [class.sqd-collapsed]="collapsed()">
        <button class="sqd-toggle" (click)="toggle()">
          🔍 Signal Query DevTools
        </button>

        @if (!collapsed()) {
          <div class="sqd-body">
            <div class="sqd-header">
              <span class="sqd-count">{{ entries().length }} queries</span>
              <button class="sqd-btn" (click)="refresh()">↻ Refresh</button>
            </div>

            @for (entry of entries(); track $index) {
              <div class="sqd-entry" [class.sqd-stale]="isStale(entry)">
                <div class="sqd-key">{{ formatKey(entry.key) }}</div>
                <div class="sqd-meta">
                  <span class="sqd-status" [attr.data-status]="entry.state().status">
                    {{ entry.state().status }}
                  </span>
                  <span class="sqd-time">{{ formatTime(entry.state().updatedAt) }}</span>
                </div>
                <details class="sqd-data">
                  <summary>Data</summary>
                  <pre>{{ formatData(entry.state().data) }}</pre>
                </details>
                @if (entry.state().error) {
                  <div class="sqd-error">{{ entry.state().error }}</div>
                }
              </div>
            }

            @if (entries().length === 0) {
              <div class="sqd-empty">No queries in cache</div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .sqd-panel {
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 99999;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      max-width: 420px;
      width: 100%;
      background: #1a1a2e;
      color: #e0e0e0;
      border-top-left-radius: 8px;
      box-shadow: -4px -4px 20px rgba(0,0,0,0.4);
    }

    .sqd-collapsed {
      width: auto;
    }

    .sqd-toggle {
      display: block;
      width: 100%;
      padding: 8px 16px;
      background: #16213e;
      color: #0f3460;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      color: #e94560;
      text-align: left;
      border-top-left-radius: 8px;
    }

    .sqd-body {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px;
    }

    .sqd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px 8px;
      border-bottom: 1px solid #333;
      margin-bottom: 8px;
    }

    .sqd-count { color: #888; }

    .sqd-btn {
      background: #0f3460;
      color: #e0e0e0;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }

    .sqd-entry {
      padding: 8px;
      margin-bottom: 4px;
      background: #16213e;
      border-radius: 4px;
      border-left: 3px solid #0f3460;
    }

    .sqd-entry.sqd-stale {
      border-left-color: #e94560;
    }

    .sqd-key {
      font-weight: 600;
      color: #53d8fb;
      margin-bottom: 4px;
    }

    .sqd-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #888;
    }

    .sqd-status[data-status="success"] { color: #4ecca3; }
    .sqd-status[data-status="loading"] { color: #f9d923; }
    .sqd-status[data-status="error"]   { color: #e94560; }
    .sqd-status[data-status="idle"]    { color: #888; }

    .sqd-data {
      margin-top: 4px;
    }

    .sqd-data summary {
      cursor: pointer;
      color: #888;
      font-size: 11px;
    }

    .sqd-data pre {
      max-height: 150px;
      overflow: auto;
      background: #0e0e1a;
      padding: 6px;
      border-radius: 4px;
      margin: 4px 0 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 11px;
    }

    .sqd-error {
      color: #e94560;
      font-size: 11px;
      margin-top: 4px;
    }

    .sqd-empty {
      color: #555;
      text-align: center;
      padding: 20px;
    }
  `],
})
export class SignalQueryDevtoolsComponent implements OnInit, OnDestroy {
  private client = inject(QueryClient);

  collapsed = signal(true);
  entries = signal<CacheEntry[]>([]);
  shouldRender = isDevMode();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.refresh();
    // Auto-refresh every 2 seconds
    this.intervalId = setInterval(() => this.refresh(), 2000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  toggle() {
    this.collapsed.update(v => !v);
  }

  refresh() {
    this.entries.set(this.client.getCache().getAll());
  }

  formatKey(key: readonly unknown[]): string {
    return JSON.stringify(key);
  }

  formatData(data: any): string {
    try {
      return JSON.stringify(data, null, 2)?.slice(0, 500) ?? 'null';
    } catch {
      return String(data);
    }
  }

  formatTime(ts: number): string {
    if (!ts) return '—';
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.round(diff / 60)}m ago`;
  }

  isStale(entry: CacheEntry): boolean {
    const updatedAt = entry.state().updatedAt;
    return Date.now() - updatedAt > 30000; // 30s default stale indicator
  }
}
