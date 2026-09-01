/**
 * A diagram type may name a layout as its default, but the layout it names is
 * not guaranteed to be there: `elk` ships as a separate package the embedder
 * registers, and `cose-bilkent` is only bundled into builds that include the
 * large features, so `@mermaid-js/tiny` has neither. Every renderer therefore
 * resolves the layout before handing it to `render()`, and the resolution has
 * to terminate at something that is always registered.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRegisteredLayoutAlgorithm, registerLayoutLoaders } from './render.js';
import { log } from '../logger.js';

describe('layout fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a registered layout unchanged', () => {
    expect(getRegisteredLayoutAlgorithm('dagre')).toBe('dagre');
    expect(getRegisteredLayoutAlgorithm('swimlane')).toBe('swimlane');
  });

  it('falls back to dagre for a layout nobody registered', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(getRegisteredLayoutAlgorithm('elk')).toBe('dagre');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('elk'));
  });

  it('prefers the caller-supplied fallback when it is registered', () => {
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(getRegisteredLayoutAlgorithm('elk', { fallback: 'swimlane' })).toBe('swimlane');
  });

  it('falls through to dagre when the caller-supplied fallback is absent too', () => {
    // Mindmap asks for `cose-bilkent`, which a build without the large features
    // never registers. Before the chain ended at dagre this threw, so a
    // `mindmap.layout` default of `elk` would have taken tiny down rather than
    // quietly rendering with dagre.
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(getRegisteredLayoutAlgorithm('elk', { fallback: 'not-registered-either' })).toBe(
      'dagre'
    );
  });

  it('resolves a layout the moment it is registered', () => {
    // What `@mermaid-js/layout-elk` does, and what tiny users do by hand.
    registerLayoutLoaders([
      {
        name: 'test-only-layout',
        loader: () => Promise.resolve({ render: () => Promise.resolve() }),
      },
    ]);
    expect(getRegisteredLayoutAlgorithm('test-only-layout')).toBe('test-only-layout');
  });
});
