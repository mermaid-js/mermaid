import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { prepareGridLayout, positionGridEdgeLabels } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';

function node(id: string): Node {
  return {
    id,
    isGroup: false,
    shape: 'rect',
    width: 80,
    height: 40,
  } as Node;
}

function edge(id: string, label?: string): Edge {
  return {
    id,
    start: 'a',
    end: 'b',
    label,
    labelStyle: ['fill:red'],
  } as Edge;
}

function manualNode(id: string, x: number, y: number, width = 80, height = 40): Node {
  return {
    id,
    x,
    y,
    width,
    height,
    isGroup: false,
    shape: 'rect',
  } as Node;
}

function manualEdge(
  id: string,
  start: string,
  end: string,
  points: { x: number; y: number }[],
  label?: string
): Edge {
  return {
    id,
    start,
    end,
    points,
    label,
    arrowTypeStart: 'none',
    arrowTypeEnd: 'arrow_point',
    curve: 'linear',
    type: 'arrow_point',
  } as Edge;
}

describe('grid edge label helpers', () => {
  it('creates measurable label nodes without leaving duplicate edge labels behind', () => {
    const data: LayoutData = {
      nodes: [node('a'), node('b')],
      edges: [edge('e1', 'hello')],
      config: {} as LayoutData['config'],
    };

    prepareGridLayout(data);

    expect(data.edges[0].label).toBeUndefined();
    expect(data.edges[0].labelNodeId).toBeDefined();
    const labelNode = data.nodes.find((item) => item.id === data.edges[0].labelNodeId);
    expect(labelNode).toMatchObject({
      isEdgeLabel: true,
      label: 'hello',
      shape: 'labelRect',
    });
  });

  it('creates missing label helpers per edge even when helper-shaped ids already exist', () => {
    const existingHelperId = 'edge-label-a-b-prepared';
    const data: LayoutData = {
      nodes: [
        node('a'),
        node('b'),
        node('edge-label-user-node'),
        {
          id: existingHelperId,
          label: 'existing',
          edgeStart: 'a',
          edgeEnd: 'b',
          shape: 'labelRect',
          width: 0,
          height: 0,
          isEdgeLabel: true,
          isDummy: true,
          isGroup: false,
        } as Node,
      ],
      edges: [
        {
          ...edge('prepared', 'updated'),
          labelNodeId: existingHelperId,
        } as Edge,
        {
          id: 'fresh',
          start: 'a',
          end: 'edge-label-user-node',
          label: 'new label',
          labelStyle: ['fill:blue'],
        } as Edge,
      ],
      config: {} as LayoutData['config'],
    };

    prepareGridLayout(data);

    expect(data.edges[0]).toMatchObject({ labelNodeId: existingHelperId, label: undefined });
    expect(data.nodes.find((item) => item.id === existingHelperId)).toMatchObject({
      id: existingHelperId,
      isEdgeLabel: true,
      label: 'updated',
    });

    const freshLabelId = data.edges[1].labelNodeId;
    expect(freshLabelId).toBeDefined();
    expect(freshLabelId).not.toBe('edge-label-user-node');
    expect(data.nodes.find((item) => item.id === freshLabelId)).toMatchObject({
      isEdgeLabel: true,
      label: 'new label',
      shape: 'labelRect',
    });
    expect(
      data.nodes.filter((item) => (item as { isEdgeLabel?: boolean }).isEdgeLabel)
    ).toHaveLength(2);
  });

  it('throws GRID_ROUTE_NOT_FOUND when no safe label placement exists', () => {
    const data: LayoutData = {
      nodes: [
        manualNode('a', 200, 200),
        manualNode('left', 95, 200, 110, 180),
        manualNode('right', 305, 200, 110, 180),
        manualNode('top', 200, 95, 180, 110),
        manualNode('bottom', 200, 305, 180, 110),
      ],
      edges: [
        manualEdge(
          'loop',
          'a',
          'a',
          [
            { x: 240, y: 190 },
            { x: 280, y: 190 },
            { x: 280, y: 160 },
            { x: 320, y: 160 },
            { x: 320, y: 240 },
            { x: 280, y: 240 },
            { x: 280, y: 210 },
            { x: 240, y: 210 },
          ],
          'loop label'
        ),
      ],
      config: {
        layout: 'grid',
      } as LayoutData['config'],
    };

    prepareGridLayout(data);
    const labelNode = data.nodes.find((item) => item.id === data.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 260;
      labelNode.height = 180;
    }

    expect(() => positionGridEdgeLabels(data)).toThrowError(
      expect.objectContaining({ code: 'GRID_ROUTE_NOT_FOUND' })
    );
  });

  it('reroutes crossing vertical foreign edges around a safe horizontal label gutter detour', () => {
    const data: LayoutData = {
      nodes: [
        manualNode('start', 50, 150),
        manualNode('target', 450, 150),
        manualNode('top-1', 150, 50, 20, 20),
        manualNode('bottom-1', 150, 250, 20, 20),
        manualNode('top-2', 200, 50, 20, 20),
        manualNode('bottom-2', 200, 250, 20, 20),
        manualNode('top-3', 250, 50, 20, 20),
        manualNode('bottom-3', 250, 250, 20, 20),
        manualNode('top-4', 300, 50, 20, 20),
        manualNode('bottom-4', 300, 250, 20, 20),
        manualNode('top-5', 350, 50, 20, 20),
        manualNode('bottom-5', 350, 250, 20, 20),
      ],
      edges: [
        manualEdge(
          'labelled-horizontal',
          'start',
          'target',
          [
            { x: 90, y: 150 },
            { x: 410, y: 150 },
          ],
          'g1'
        ),
        manualEdge('v-1', 'top-1', 'bottom-1', [
          { x: 150, y: 60 },
          { x: 150, y: 240 },
        ]),
        manualEdge('v-2', 'top-2', 'bottom-2', [
          { x: 200, y: 60 },
          { x: 200, y: 240 },
        ]),
        manualEdge('v-3', 'top-3', 'bottom-3', [
          { x: 250, y: 60 },
          { x: 250, y: 240 },
        ]),
        manualEdge('v-4', 'top-4', 'bottom-4', [
          { x: 300, y: 60 },
          { x: 300, y: 240 },
        ]),
        manualEdge('v-5', 'top-5', 'bottom-5', [
          { x: 350, y: 60 },
          { x: 350, y: 240 },
        ]),
      ],
      config: {
        layout: 'grid',
      } as LayoutData['config'],
    };

    prepareGridLayout(data);
    const labelNode = data.nodes.find((node) => node.id === data.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 52;
      labelNode.height = 20;
    }

    positionGridEdgeLabels(data);

    const report = validateLayout(data);
    expect(report).toMatchObject({ ok: true, issues: [] });
    expect(
      data.edges
        .filter((item) => item.id.startsWith('v-'))
        .some((item) => (item.points?.length ?? 0) > 2)
    ).toBe(true);
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
  });

  it('handles crowded vertical segments deterministically without invalid fallback overlap', () => {
    const data: LayoutData = {
      nodes: [
        manualNode('top', 250, 40),
        manualNode('bottom', 250, 390),
        manualNode('left-1', 50, 130, 20, 20),
        manualNode('right-1', 450, 130, 20, 20),
        manualNode('left-2', 50, 180, 20, 20),
        manualNode('right-2', 450, 180, 20, 20),
        manualNode('left-3', 50, 230, 20, 20),
        manualNode('right-3', 450, 230, 20, 20),
        manualNode('left-4', 50, 280, 20, 20),
        manualNode('right-4', 450, 280, 20, 20),
        manualNode('left-5', 50, 330, 20, 20),
        manualNode('right-5', 450, 330, 20, 20),
      ],
      edges: [
        manualEdge(
          'labelled-vertical',
          'top',
          'bottom',
          [
            { x: 250, y: 60 },
            { x: 250, y: 370 },
          ],
          'm10'
        ),
        manualEdge('h-1', 'left-1', 'right-1', [
          { x: 60, y: 130 },
          { x: 440, y: 130 },
        ]),
        manualEdge('h-2', 'left-2', 'right-2', [
          { x: 60, y: 210 },
          { x: 440, y: 210 },
        ]),
        manualEdge('h-3', 'left-3', 'right-3', [
          { x: 60, y: 290 },
          { x: 440, y: 290 },
        ]),
      ],
      config: {
        layout: 'grid',
      } as LayoutData['config'],
    };

    prepareGridLayout(data);
    const labelNode = data.nodes.find((node) => node.id === data.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 42;
      labelNode.height = 24;
    }

    positionGridEdgeLabels(data);

    const report = validateLayout(data);
    expect(report).toMatchObject({ ok: true, issues: [] });
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
  });

  it('routes a short horizontal label outside tall endpoint nodes using inset connector legs', () => {
    const data: LayoutData = {
      nodes: [manualNode('source', 260, 240, 220, 260), manualNode('target', 523, 240, 180, 220)],
      edges: [
        manualEdge(
          'narrow-gap',
          'source',
          'target',
          [
            { x: 370, y: 240 },
            { x: 433, y: 240 },
          ],
          'CWM'
        ),
      ],
      config: {
        layout: 'grid',
      } as LayoutData['config'],
    };

    prepareGridLayout(data);
    const labelNode = data.nodes.find((node) => node.id === data.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 66;
      labelNode.height = 39;
    }

    positionGridEdgeLabels(data);

    expect(data.edges[0].points?.length).toBeGreaterThan(2);
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
    expect(Math.abs((labelNode?.y ?? 0) - 240)).toBeGreaterThan(100);
  });

  it('considers terminal dogleg segments when the interior segment is too short for the label', () => {
    const data: LayoutData = {
      nodes: [manualNode('start', 80, 120, 40, 40), manualNode('end', 520, 180, 40, 40)],
      edges: [
        manualEdge(
          'dogleg-label',
          'start',
          'end',
          [
            { x: 100, y: 120 },
            { x: 320, y: 120 },
            { x: 320, y: 180 },
            { x: 500, y: 180 },
          ],
          'terminal segment'
        ),
      ],
      config: {
        layout: 'grid',
      } as LayoutData['config'],
    };

    prepareGridLayout(data);
    const labelNode = data.nodes.find((node) => node.id === data.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 140;
      labelNode.height = 78;
    }

    positionGridEdgeLabels(data);

    const report = validateLayout(data);
    expect(report).toMatchObject({ ok: true, issues: [] });
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
    expect(labelNode?.x).not.toBeCloseTo(320, 0);
  });
});
