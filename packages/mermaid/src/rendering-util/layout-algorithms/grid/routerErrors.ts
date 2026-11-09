import type { GridRoutingFallbackReason } from './routerInstrumentation.js';

export class GridRoutingResourceLimitError extends Error {
  constructor(
    public readonly reason: GridRoutingFallbackReason,
    message: string,
    public readonly searchStateScope?: 'edge' | 'invocation'
  ) {
    super(message);
    this.name = 'GridRoutingResourceLimitError';
  }
}
