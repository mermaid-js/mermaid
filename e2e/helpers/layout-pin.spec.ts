import { describe, expect, it } from 'vitest';
import { mermaidUrl } from './util.ts';

/**
 * The suite pins `dagre` so screenshots stay comparable now that ELK is
 * mermaid's default. Getting this wrong is invisible locally — baselines live
 * in Argos — and would silently move every diagram in the suite at once, so the
 * pin's precedence is asserted here rather than left to a screenshot diff.
 */
const layoutOf = (
  options: Record<string, unknown>,
  graph: string | string[] = 'flowchart TD\n A-->B'
): string | undefined => {
  const url = mermaidUrl(graph, { ...options } as never, false);
  // Read the raw value: base64 can contain `+`, which URLSearchParams would
  // decode to a space and corrupt.
  const encoded = url.slice(url.indexOf('?graph=') + '?graph='.length);
  return JSON.parse(Buffer.from(encoded, 'base64').toString()).mermaid.layout;
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

  // A diagram whose *type* picks its layout loses to a user-supplied one, so
  // pinning would quietly render it with the wrong engine — swimlanes without
  // lanes, `flowchart-elk` as dagre — and a screenshot-only test would just
  // bake in the wrong baseline.
  it.each([
    ['swimlane-beta LR\n  subgraph A\n    B-->C\n  end'],
    ['flowchart-elk TD\n A-->B'],
    ['graph-elk TD\n A-->B'],
  ])('leaves a diagram that selects its own layout unpinned: %s', (graph) => {
    expect(layoutOf({}, graph)).toBeUndefined();
  });

  it('detects a self-selecting diagram anywhere in a multi-graph render', () => {
    expect(layoutOf({}, ['flowchart TD\n A-->B', 'swimlane-beta LR\n  X-->Y'])).toBeUndefined();
  });

  it('still pins an ordinary flowchart that merely mentions swimlanes', () => {
    expect(layoutOf({}, 'flowchart TD\n A[swimlane-beta] --> B')).toBe('dagre');
  });
});
