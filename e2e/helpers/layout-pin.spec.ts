import { describe, expect, it } from 'vitest';
import { mermaidUrl } from './util.ts';

/**
 * The suite pins `dagre` so screenshots stay comparable now that ELK is
 * mermaid's default. Getting this wrong is invisible locally — baselines live
 * in Argos — and would silently move every diagram in the suite at once, so the
 * pin's precedence is asserted here rather than left to a screenshot diff.
 */
const layoutOf = (options: Record<string, unknown>): string | undefined => {
  const url = mermaidUrl('flowchart TD\n A-->B', { ...options } as never, false);
  const graph = new URL(url, 'http://localhost').searchParams.get('graph');
  return JSON.parse(Buffer.from(graph!, 'base64').toString()).mermaid.layout;
};

describe('e2e baseline layout pin', () => {
  it('pins dagre when the spec configures no layout', () => {
    expect(layoutOf({})).toBe('dagre');
  });

  it('leaves an explicitly requested layout alone', () => {
    expect(layoutOf({ layout: 'elk' })).toBe('elk');
    expect(layoutOf({ layout: 'elk.mrtree' })).toBe('elk.mrtree');
  });

  it('applies no layout at all when the diagram opts out', () => {
    // `useDiagramLayout` must leave the key unset rather than set 'elk', so the
    // diagram sees mermaid's real default and a regression in it would show.
    expect(layoutOf({ useDiagramLayout: true })).toBeUndefined();
  });

  it('still honours an explicit layout alongside the opt-out', () => {
    expect(layoutOf({ useDiagramLayout: true, layout: 'elk' })).toBe('elk');
  });
});
