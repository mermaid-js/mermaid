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
