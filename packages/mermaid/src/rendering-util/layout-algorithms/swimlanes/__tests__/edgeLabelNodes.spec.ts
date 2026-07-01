import { describe, it, expect } from 'vitest';
import { createEdgeLabelNodes } from '../edgeLabelNodes.js';
import type { LayoutData, Node, Edge } from '../../../types.js';

/**
 * Helper to create a minimal LayoutData for testing
 */
function createTestLayoutData(nodes: Node[], edges: Edge[]): LayoutData {
  return {
    nodes,
    edges,
    config: {},
    type: 'flowchart',
    diagramId: 'test',
  } as LayoutData;
}

describe('createEdgeLabelNodes', () => {
  it('should not modify edges without labels', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false, shape: 'rect' } as Node,
      { id: 'B', isGroup: false, shape: 'rect' } as Node,
    ];
    const edges: Edge[] = [{ id: 'e1', start: 'A', end: 'B', type: 'arrow' } as Edge];

    const data = createTestLayoutData(nodes, edges);
    const result = createEdgeLabelNodes(data);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    // Original edge must not be stamped with a labelNodeId.
    expect((result.edges[0] as Edge & { labelNodeId?: string }).labelNodeId).toBeUndefined();
  });

  it('should create a label node and layout-only virtual edges for a labelled edge', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false, shape: 'rect', parentId: 'lane1' } as Node,
      { id: 'B', isGroup: false, shape: 'rect', parentId: 'lane1' } as Node,
      { id: 'lane1', isGroup: true } as Node,
    ];
    const edges: Edge[] = [
      { id: 'e1', start: 'A', end: 'B', label: 'my label', type: 'arrow' } as Edge,
    ];

    const data = createTestLayoutData(nodes, edges);
    const result = createEdgeLabelNodes(data);

    // Should have 4 nodes: A, B, lane1, and the label node
    expect(result.nodes).toHaveLength(4);

    const labelNode = result.nodes.find((n) => n.isEdgeLabel);
    expect(labelNode).toBeDefined();
    expect(labelNode?.id).toBe('edge-label-A-B-e1');
    expect(labelNode?.label).toBe('my label');
    expect(labelNode?.edgeStart).toBe('A');
    expect(labelNode?.edgeEnd).toBe('B');
    expect(labelNode?.shape).toBe('labelRect');
    expect(labelNode?.isDummy).toBe(true);
    expect(labelNode?.parentId).toBe('lane1'); // Same lane as source

    // The original edge is preserved and stamped with `labelNodeId`. Two
    // layout-only virtual edges are appended so Sugiyama can layer the
    // label between source and target.
    expect(result.edges).toHaveLength(3);

    const original = result.edges.find((e) => e.id === 'e1');
    expect(original).toBeDefined();
    expect((original as Edge & { labelNodeId?: string }).labelNodeId).toBe('edge-label-A-B-e1');
    expect((original as Edge & { isLayoutOnly?: boolean }).isLayoutOnly).toBeUndefined();
    // Endpoints are preserved; the label text has moved to the label node so
    // the edge renderer doesn't draw it a second time.
    expect(original?.start).toBe('A');
    expect(original?.end).toBe('B');
    expect(original?.label).toBeUndefined();

    const toLabelVirtual = result.edges.find((e) => e.id === 'e1-to-label');
    expect(toLabelVirtual).toBeDefined();
    expect(toLabelVirtual?.start).toBe('A');
    expect(toLabelVirtual?.end).toBe('edge-label-A-B-e1');
    expect((toLabelVirtual as Edge & { isLayoutOnly?: boolean }).isLayoutOnly).toBe(true);

    const fromLabelVirtual = result.edges.find((e) => e.id === 'e1-from-label');
    expect(fromLabelVirtual).toBeDefined();
    expect(fromLabelVirtual?.start).toBe('edge-label-A-B-e1');
    expect(fromLabelVirtual?.end).toBe('B');
    expect((fromLabelVirtual as Edge & { isLayoutOnly?: boolean }).isLayoutOnly).toBe(true);
  });

  it('should create label nodes for multiple labelled edges', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false, shape: 'rect' } as Node,
      { id: 'B', isGroup: false, shape: 'rect' } as Node,
      { id: 'C', isGroup: false, shape: 'rect' } as Node,
    ];
    const edges: Edge[] = [
      { id: 'e1', start: 'A', end: 'B', label: 'label1', type: 'arrow' } as Edge,
      { id: 'e2', start: 'B', end: 'C', label: 'label2', type: 'arrow' } as Edge,
    ];

    const data = createTestLayoutData(nodes, edges);
    const result = createEdgeLabelNodes(data);

    // Should have 5 nodes: A, B, C, and 2 label nodes
    expect(result.nodes).toHaveLength(5);

    const labelNodes = result.nodes.filter((n) => n.isEdgeLabel);
    expect(labelNodes).toHaveLength(2);

    // Should have 6 edges: 2 originals + 2 × 2 layout-only virtual edges
    expect(result.edges).toHaveLength(6);

    const layoutOnly = result.edges.filter(
      (e) => (e as Edge & { isLayoutOnly?: boolean }).isLayoutOnly === true
    );
    expect(layoutOnly).toHaveLength(4);
  });

  it('should preserve the original edge intact when stamping a labelNodeId', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false, shape: 'rect' } as Node,
      { id: 'B', isGroup: false, shape: 'rect' } as Node,
    ];
    const edges: Edge[] = [
      {
        id: 'e1',
        start: 'A',
        end: 'B',
        label: 'test',
        type: 'arrow',
        arrowTypeStart: 'arrow_circle',
        arrowTypeEnd: 'arrow_cross',
      } as Edge,
    ];

    const data = createTestLayoutData(nodes, edges);
    const result = createEdgeLabelNodes(data);

    const original = result.edges.find((e) => e.id === 'e1');
    expect(original).toBeDefined();
    // Original arrow types are preserved — routing uses the single polyline.
    expect(original?.arrowTypeStart).toBe('arrow_circle');
    expect(original?.arrowTypeEnd).toBe('arrow_cross');
    expect((original as Edge & { labelNodeId?: string }).labelNodeId).toBe('edge-label-A-B-e1');
  });

  it('should skip edges that already carry a labelNodeId stamp', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false, shape: 'rect' } as Node,
      { id: 'B', isGroup: false, shape: 'rect' } as Node,
    ];
    const edges: Edge[] = [
      {
        id: 'e1',
        start: 'A',
        end: 'B',
        label: 'test',
        type: 'arrow',
        labelNodeId: 'pre-existing-label',
      } as Edge,
    ];

    const data = createTestLayoutData(nodes, edges);
    const result = createEdgeLabelNodes(data);

    // Should not create any label nodes or virtual edges for an already-
    // stamped edge (guards against double-processing).
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });
});
