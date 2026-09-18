import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const band = (id: string): Node => ({ id, isGroup: true }) as Node;
const box = (id: string): Node =>
  ({ id, isGroup: false, width: 100, height: 50, parentId: 'L' }) as Node;

/** One band holding a split into two branches that rejoin: A to B and C, both to D. */
function splitAndJoin(laneLayering?: string): LayoutData {
  const layout = {
    nodes: [band('L'), box('A'), box('B'), box('C'), box('D')],
    edges: [
      { id: 'e1', start: 'A', end: 'B', type: 'normal' },
      { id: 'e2', start: 'A', end: 'C', type: 'normal' },
      { id: 'e3', start: 'B', end: 'D', type: 'normal' },
      { id: 'e4', start: 'C', end: 'D', type: 'normal' },
    ],
    config: { flowchart: { nodeSpacing: 40, rankSpacing: 80 } },
    direction: 'LR',
    ...(laneLayering ? { laneLayering } : {}),
  } as unknown as LayoutData;
  runSwimlaneLayoutCore(layout);
  return layout;
}

const at = (layout: LayoutData, id: string) => layout.nodes?.find((node) => node.id === id);
const alongProcess = (layout: LayoutData) => {
  const xs = (layout.nodes ?? []).filter((n) => !n.isGroup).map((n) => n.x ?? 0);
  return Math.max(...xs) - Math.min(...xs);
};

describe('lane layering', () => {
  it('sets concurrent branches side by side when a diagram asks for branches', () => {
    const layout = splitAndJoin('branches');
    // The same step of the process, so the same distance along it and apart across it.
    expect(at(layout, 'B')?.x).toBe(at(layout, 'C')?.x);
    expect(at(layout, 'B')?.y).not.toBe(at(layout, 'C')?.y);
  });

  it('keeps a band one node deep by default, which is what a role band wants', () => {
    const layout = splitAndJoin();
    expect(at(layout, 'B')?.x).not.toBe(at(layout, 'C')?.x);
    expect(at(layout, 'B')?.y).toBe(at(layout, 'C')?.y);
  });

  it('draws the same process in less length when its branches are side by side', () => {
    expect(alongProcess(splitAndJoin('branches'))).toBeLessThan(alongProcess(splitAndJoin()));
  });
});

describe('spacing', () => {
  const chain = (own?: { nodeSpacing?: number; rankSpacing?: number }) => {
    const layout = {
      nodes: [band('L'), box('A'), box('B'), box('C')],
      edges: [
        { id: 'e1', start: 'A', end: 'B', type: 'normal' },
        { id: 'e2', start: 'B', end: 'C', type: 'normal' },
      ],
      // The flowchart keys carry schema defaults, so they are always present.
      config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
      direction: 'LR',
      ...own,
    } as unknown as LayoutData;
    runSwimlaneLayoutCore(layout);
    return alongProcess(layout);
  };

  // A diagram that sets its own spacing had it silently shadowed by the flowchart
  // defaults, which always exist - the same order dagre was corrected to in #7932.
  it('prefers the spacing the diagram asked for over the generic fallback', () => {
    expect(chain({ rankSpacing: 200 })).toBeGreaterThan(chain());
  });

  it('still falls back to the flowchart config when the diagram says nothing', () => {
    expect(chain()).toBeGreaterThan(0);
  });
});

describe('room across a lane', () => {
  // A box whose label has wrapped is tall and narrow. Laid on its side, the room it
  // needs across the lane is its height, and reserving its width instead left the two
  // branches of a gateway sitting on top of each other.
  const tall = (id: string): Node =>
    ({ id, isGroup: false, width: 90, height: 190, parentId: 'L' }) as Node;

  const branches = (laneLayering?: string): LayoutData => {
    const layout = {
      nodes: [band('L'), box('A'), tall('B'), tall('C'), box('D')],
      edges: [
        { id: 'e1', start: 'A', end: 'B', type: 'normal' },
        { id: 'e2', start: 'A', end: 'C', type: 'normal' },
        { id: 'e3', start: 'B', end: 'D', type: 'normal' },
        { id: 'e4', start: 'C', end: 'D', type: 'normal' },
      ],
      config: { flowchart: { nodeSpacing: 40, rankSpacing: 80 } },
      direction: 'LR',
      ...(laneLayering ? { laneLayering } : {}),
    } as unknown as LayoutData;
    runSwimlaneLayoutCore(layout);
    return layout;
  };

  it('keeps two tall branches off each other', () => {
    const layout = branches('branches');
    const b = at(layout, 'B');
    const c = at(layout, 'C');
    const gap = Math.abs((b?.y ?? 0) - (c?.y ?? 0));
    expect(gap).toBeGreaterThanOrEqual(((b?.height ?? 0) + (c?.height ?? 0)) / 2);
  });
});
