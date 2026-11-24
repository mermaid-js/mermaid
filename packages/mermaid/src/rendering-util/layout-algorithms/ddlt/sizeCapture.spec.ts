import { afterEach, describe, expect, it } from 'vitest';
import type { LayoutData } from '../../types.js';
import { captureNodeSizes } from './sizeCapture.js';

interface Captured {
  nodes: { id: string; width: number; height: number }[];
}
const g = globalThis as unknown as { mermaidLastCapturedSizes?: { sizes: Captured } };

// A stand-in for the d3 selection the diagram was rendered into.
const element = { node: () => null } as unknown as Parameters<typeof captureNodeSizes>[0];

function measured(): LayoutData {
  return {
    nodes: [
      { id: 'G', isGroup: true, label: 'Group', labelBBox: { width: 48, height: 24 } },
      { id: 'a', isGroup: false, parentId: 'G', width: 60, height: 40 },
      { id: 'b', isGroup: false, width: 70, height: 40 },
    ],
    edges: [
      { id: 'e1', start: 'a', end: 'b', label: 'yes', width: 30, height: 18 },
      { id: 'e2', start: 'b', end: 'a', label: '' },
    ],
    config: {},
  } as unknown as LayoutData;
}

describe('captureNodeSizes', () => {
  afterEach(() => {
    delete g.mermaidLastCapturedSizes;
    delete (globalThis as { mermaidCapturedSizes?: unknown }).mermaidCapturedSizes;
  });

  it('records leaf nodes, centre edge labels and subgraph titles under their fixture ids', () => {
    captureNodeSizes(element, measured());
    expect(g.mermaidLastCapturedSizes?.sizes.nodes).toEqual([
      { id: 'a', width: 60, height: 40 },
      { id: 'b', width: 70, height: 40 },
      { id: 'edge-label-a-b-e1', width: 30, height: 18 },
      { id: 'group-title-G', width: 48, height: 24 },
    ]);
  });

  it('keeps an edge-label entry the layout already measured as a node', () => {
    const data = measured();
    data.nodes.push({
      id: 'edge-label-a-b-e1',
      isGroup: false,
      isEdgeLabel: true,
      width: 31,
      height: 19,
    } as LayoutData['nodes'][number]);
    captureNodeSizes(element, data);
    const labels = g.mermaidLastCapturedSizes?.sizes.nodes.filter(
      (n) => n.id === 'edge-label-a-b-e1'
    );
    expect(labels).toEqual([{ id: 'edge-label-a-b-e1', width: 31, height: 19 }]);
  });
});
