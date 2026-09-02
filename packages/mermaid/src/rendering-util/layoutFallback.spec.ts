/**
 * A diagram type may name a layout as its default, but `elk` ships as a separate package
 * and `cose-bilkent` only in large-feature builds, so the resolution every renderer runs
 * before `render()` has to terminate at something always registered.
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
    // Mindmap's fallback is `cose-bilkent`, absent from tiny. Before the chain ended at
    // dagre this threw, so a `mindmap.layout` of `elk` would have taken tiny down.
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(getRegisteredLayoutAlgorithm('elk', { fallback: 'not-registered-either' })).toBe(
      'dagre'
    );
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'falls back for %s rather than reading it off the prototype',
    (inherited) => {
      // `layout` is settable from front matter, and on a plain registry object these pass a
      // membership test and reach `loader()` as a TypeError.
      vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      expect(getRegisteredLayoutAlgorithm(inherited)).toBe('dagre');
    }
  );

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
