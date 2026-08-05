import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge, NonClusterNode } from '../../../types.js';
import { tweakAlignment } from './index.js';
import { LayoutRotation } from './layoutRotation.js';

describe('tweakAlignment', () => {
  const createNode = (id: string, x: number, y: number): NonClusterNode => ({
    id,
    x,
    y,
    width: 50,
    height: 50,
    isGroup: false,
  });

  const createEdge = (id: string, start: string, end: string): Edge => ({
    id,
    start,
    end,
    type: 'line',
  });

  const baseConfig = {} as LayoutData['config'];

  it('should rotate portrait layout to landscape', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 0, 100), createNode('C', 0, 300)],
      edges: [createEdge('E1', 'A', 'B'), createEdge('E2', 'B', 'C')],
      config: baseConfig,
    };
    const rotator = new LayoutRotation(layoutData.nodes, layoutData.edges || [], layoutData);
    const wasRotated = rotator.rotate();
    expect(wasRotated).toBe(true);
    const nodeB = layoutData.nodes.find((N) => N.id === 'B');
    const nodeC = layoutData.nodes.find((N) => N.id === 'C');
    expect(nodeB).toBeDefined();
    expect(nodeC).toBeDefined();
    expect(nodeB!.x).toBe(100);
    expect(nodeC!.x).toBe(300);
  });

  it('should evenly distribute vertically spaced nodes', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 0, 200), createNode('C', 0, 500)],
      edges: [createEdge('E1', 'A', 'B'), createEdge('E2', 'B', 'C')],
      config: baseConfig,
    };

    const result = tweakAlignment(layoutData, {
      enableRotation: false,
      enableFinalCleanup: false,
      neighborStressIterations: 50,
    });

    const ys = result.nodes.map((n) => n.y ?? 0).sort((a, b) => a - b);
    const spacing1 = ys[1] - ys[0];
    const spacing2 = ys[2] - ys[1];

    expect(Math.abs(spacing1 - spacing2)).toBeLessThan(120);
  });

  it('should align nearly aligned nodes horizontally', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 2, 0), createNode('C', 50, 50)],
      edges: [createEdge('E1', 'A', 'C'), createEdge('E2', 'B', 'C')],
      config: baseConfig,
    };

    const result = tweakAlignment(layoutData, {
      enableRotation: false,
      enableFinalCleanup: false,
      alignmentThreshold: 5,
    });

    const yCoords = result.nodes.filter((n) => n.id === 'A' || n.id === 'B').map((n) => n.y ?? 0);
    expect(yCoords[0]).toBe(yCoords[1]);
  });

  it('should not rotate an already landscape layout', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 0, 200), createNode('C', 0, 500)],
      edges: [createEdge('E1', 'A', 'B'), createEdge('E2', 'B', 'C')],
      config: baseConfig,
    };

    const rotator = new LayoutRotation(layoutData.nodes, layoutData.edges || [], layoutData);
    const bbox = rotator.getBoundingBox();
    expect(bbox.height > bbox.width).toBe(true);

    if (bbox.height > bbox.width) {
      const wasRotated = rotator.rotate();
      expect(wasRotated).toBe(true);
      const xs = layoutData.nodes.map((n) => n.x);
      expect(xs).toEqual([0, 200, 500]);

      const ys = layoutData.nodes.map((n) => n.y);
      expect(ys).toEqual([-0, -0, -0]);
    }
  });

  it('should rotate flowchart TD layout to landscape', () => {
    const layoutData: LayoutData = {
      nodes: [
        createNode('Start', 0, 0),
        createNode('Prep', 0, 100),
        createNode('Split', 0, 200),
        createNode('T1', 0, 300),
        createNode('T2', 0, 300),
        createNode('Merge', 0, 400),
        createNode('Finalize', 0, 500),
        createNode('End', 0, 600),
      ],
      edges: [
        createEdge('E1', 'Start', 'Prep'),
        createEdge('E2', 'Prep', 'Split'),
        createEdge('E3', 'Split', 'T1'),
        createEdge('E4', 'Split', 'T2'),
        createEdge('E5', 'T1', 'Merge'),
        createEdge('E6', 'T2', 'Merge'),
        createEdge('E7', 'Merge', 'Finalize'),
        createEdge('E8', 'Finalize', 'End'),
      ],
      config: baseConfig,
    };

    const rotator = new LayoutRotation(layoutData.nodes, layoutData.edges || [], layoutData);
    const wasRotated = rotator.rotate();

    expect(wasRotated).toBe(true);

    const splitNode = layoutData.nodes.find((n) => n.id === 'Split');
    const mergeNode = layoutData.nodes.find((n) => n.id === 'Merge');
    const finalizeNode = layoutData.nodes.find((n) => n.id === 'Finalize');

    expect(splitNode).toBeDefined();
    expect(mergeNode).toBeDefined();
    expect(finalizeNode).toBeDefined();

    expect(splitNode!.x).toBe(200);
    expect(mergeNode!.x).toBe(400);
    expect(finalizeNode!.x).toBe(500);

    expect(splitNode!.y).toBe(-0);
  });

  it('should apply final cleanup when enabled', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 100, 100)],
      edges: [createEdge('E1', 'A', 'B')],
      config: baseConfig,
    };

    const resultWithCleanup = tweakAlignment(layoutData, { enableFinalCleanup: true });
    const resultWithoutCleanup = tweakAlignment(layoutData, { enableFinalCleanup: false });

    expect(resultWithCleanup.nodes.length).toBe(resultWithoutCleanup.nodes.length);
  });

  it('should handle empty layout safely', () => {
    const layoutData: LayoutData = { nodes: [], edges: [], config: baseConfig };
    const result = tweakAlignment(layoutData);

    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should not rotate an already landscape layout', () => {
    const layoutData: LayoutData = {
      nodes: [createNode('A', 0, 0), createNode('B', 200, 0), createNode('C', 500, 0)],
      edges: [createEdge('E1', 'A', 'B'), createEdge('E2', 'B', 'C')],
      config: baseConfig,
    };

    const rotator = new LayoutRotation(layoutData.nodes, layoutData.edges || [], layoutData);
    const wasRotated = rotator.rotate();

    expect(wasRotated).toBe(false);

    const xs = layoutData.nodes.map((n) => n.x);
    expect(xs).toEqual([0, 200, 500]);

    const ys = layoutData.nodes.map((n) => n.y);
    expect(ys).toEqual([0, 0, 0]);
  });

  it('should rotate a complex flowchart with subgraphs to landscape and update bounding boxes', () => {
    const nat: Node = {
      id: 'nat',
      x: 76.72916793823242,
      y: 239.98958206176758,
      width: 51.46181106567383,
      height: 44.98958206176758,
      isGroup: false,
      label: 'nat',
      parentId: 'project',
      shape: 'squareRect',
    };

    const internet: Node = {
      id: 'internet',
      x: 76.72916793823242,
      y: 389.9895820617676,
      width: 78.68402099609375,
      height: 44.98958206176758,
      isGroup: false,
      label: 'internet',
      parentId: undefined,
      shape: 'squareRect',
    };

    const routeur: Node = {
      id: 'routeur',
      x: 76.72916793823242,
      y: 539.9895820617676,
      width: 76.34027099609375,
      height: 44.98958206176758,
      isGroup: false,
      label: 'routeur',
      parentId: 'project',
      shape: 'squareRect',
    };

    const subnet1: Node = {
      id: 'subnet1',
      x: 76.72916793823242,
      y: 779.9791641235352,
      width: 153.45833587646484,
      height: 254.98958206176758,
      isGroup: true,
      label: 'subnet1',
      parentId: 'project',
      shape: 'rect',
      padding: 8,
    };

    const subnet2: Node = {
      id: 'subnet2',
      x: 76.72916793823242,
      y: 0,
      width: 153.45833587646484,
      height: 254.98958206176758,
      isGroup: true,
      label: 'subnet2',
      parentId: 'project',
      shape: 'rect',
      padding: 8,
    };

    const project: Node = {
      id: 'project',
      x: 258.45833587646484,
      y: 0,
      width: 60,
      height: undefined,
      isGroup: true,
      label: 'project',
      parentId: undefined,
      shape: 'rect',
      padding: 8,
    };

    const compute1: Node = {
      id: 'compute1',
      x: 410.18750381469727,
      y: 150,
      width: 93.45833587646484,
      height: 44.98958206176758,
      isGroup: false,
      label: 'compute1',
      parentId: 'subnet1',
      shape: 'squareRect',
    };

    const lb1: Node = {
      id: 'lb1',
      x: 410.18750381469727,
      y: 0,
      width: 50.68056106567383,
      height: 44.98958206176758,
      isGroup: false,
      label: 'lb1',
      parentId: 'subnet1',
      shape: 'squareRect',
    };

    const compute2: Node = {
      id: 'compute2',
      x: 603.6458396911621,
      y: 150,
      width: 93.45833587646484,
      height: 44.98958206176758,
      isGroup: false,
      label: 'compute2',
      parentId: 'subnet2',
      shape: 'squareRect',
    };

    const lb2: Node = {
      id: 'lb2',
      x: 603.6458396911621,
      y: 0,
      width: 50.68056106567383,
      height: 44.98958206176758,
      isGroup: false,
      label: 'lb2',
      parentId: 'subnet2',
      shape: 'squareRect',
    };

    const nodes: Node[] = [
      nat,
      internet,
      routeur,
      subnet1,
      subnet2,
      project,
      compute1,
      lb1,
      compute2,
      lb2,
    ];

    const edges: Edge[] = [];

    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    const rotator = new LayoutRotation(nodes, edges, layoutData);

    const bboxBefore = rotator.getBoundingBox();
    expect(bboxBefore.width).toBeLessThan(bboxBefore.height);

    const internetOriginalX = internet.x!;
    const internetOriginalY = internet.y!;
    const subnet1OriginalWidth = subnet1.width!;
    const subnet1OriginalHeight = subnet1.height!;

    const wasRotated = rotator.rotate();
    expect(wasRotated).toBe(true);

    const bboxAfter = rotator.getBoundingBox();
    expect(bboxAfter.width).toBeGreaterThan(bboxAfter.height);

    expect(internet.x).not.toBe(internetOriginalX);
    expect(internet.y).not.toBe(internetOriginalY);

    expect(subnet1.width!).toBeCloseTo(subnet1OriginalHeight, 1);
    expect(subnet1.height!).toBeCloseTo(subnet1OriginalWidth, 1);
    expect(subnet1.width!).toBeGreaterThan(subnet1.height!);

    expect(subnet2.width!).toBeCloseTo(254.98958206176758, 1);
    expect(subnet2.height!).toBeCloseTo(153.45833587646484, 1);
    expect(subnet2.width!).toBeGreaterThan(subnet2.height!);

    expect(compute1.x).toBeDefined();
    expect(lb1.x).toBeDefined();
    expect(compute1.y).toBeDefined();
    expect(lb1.y).toBeDefined();
  });
});
