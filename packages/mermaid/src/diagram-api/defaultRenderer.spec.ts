import { describe, expect, it } from 'vitest';
import { resolveDefaultRenderer } from './defaultRenderer.js';

describe('resolveDefaultRenderer', () => {
  it('resolves dagre to itself', () => {
    expect(resolveDefaultRenderer('dagre')).toBe('dagre');
  });

  it.each(['dagre-wrapper', 'dagre-d3'])('treats %s as an alias of dagre', (alias) => {
    expect(resolveDefaultRenderer(alias)).toBe('dagre');
  });

  it('resolves elk to itself', () => {
    expect(resolveDefaultRenderer('elk')).toBe('elk');
  });

  it('returns undefined when nothing is configured', () => {
    expect(resolveDefaultRenderer(undefined)).toBeUndefined();
  });

  it('returns undefined for unknown values', () => {
    expect(resolveDefaultRenderer('cytoscape')).toBeUndefined();
  });
});
