/* eslint-disable no-loss-of-precision */
import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge, NonClusterNode } from '../../types.js';
import edgeRouting, {
  calculateOptimalSides,
  nodesAligned,
  sortEdgesByDistance,
  initializeSideUsage,
  initializeSideSlots,
  assignSidesToEdges,
} from './edgeRouting.js';
import type { Side } from './edgeRouting.js';

describe('edgeRouting - assignSidesToEdges', () => {
  const createNode = (
    id: string,
    x: number,
    y: number,
    width = 50,
    height = 50
  ): NonClusterNode => ({
    id,
    x,
    y,
    width,
    height,
    isGroup: false,
    label: id,
    padding: 15,
  });

  const createEdge = (id: string, start: string, end: string): Edge => ({
    id,
    start,
    end,
    type: 'arrow_point',
    isUserDefinedId: false,
  });

  const baseConfig = {} as LayoutData['config'];

  it('should assign correct sides for cyclic flowchart: a→b→c→a, b→d', () => {
    const nodes: NonClusterNode[] = [
      {
        id: 'a',
        x: 100.06511069968796,
        y: 0,
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'a',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'b',
        x: 170.1319446564114,
        y: 0,
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'b',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'c',
        x: 239.80294464390067,
        y: 0,
        width: 39,
        height: 45,
        isGroup: false,
        label: 'c',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'd',
        x: 300,
        y: 0,
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'd',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
    ];

    const edges: Edge[] = [
      createEdge('L_a_b_0', 'a', 'b'),
      createEdge('L_b_c_0', 'b', 'c'),
      createEdge('L_c_a_0', 'c', 'a'),
      createEdge('L_b_d_0', 'b', 'd'),
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const result = edgeRouting(layoutData);

    expect(result.edges.length).toBe(4);

    for (const edge of result.edges) {
      expect(edge.startSide).toBeDefined();
      expect(edge.endSide).toBeDefined();
      expect(['left', 'right', 'top', 'bottom']).toContain(edge.startSide);
      expect(['left', 'right', 'top', 'bottom']).toContain(edge.endSide);
    }

    const edgeAB = result.edges.find((e) => e.id === 'L_a_b_0');
    expect(edgeAB).toBeDefined();

    const edgeBC = result.edges.find((e) => e.id === 'L_b_c_0');
    expect(edgeBC).toBeDefined();

    const edgeCA = result.edges.find((e) => e.id === 'L_c_a_0');
    expect(edgeCA).toBeDefined();

    const edgeBD = result.edges.find((e) => e.id === 'L_b_d_0');
    expect(edgeBD).toBeDefined();
    expect(edgeBD?.startSide).toBe('left');
    expect(edgeBD?.endSide).toBe('right');

    for (const edge of result.edges) {
      expect(edge.points).toBeDefined();
      expect(edge.points?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should assign correct sides for simple linear flow: a→b→c', () => {
    const nodes: NonClusterNode[] = [
      createNode('a', 100, 100),
      createNode('b', 200, 100),
      createNode('c', 300, 100),
    ];

    const edges: Edge[] = [createEdge('L_a_b_0', 'a', 'b'), createEdge('L_b_c_0', 'b', 'c')];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const result = edgeRouting(layoutData);

    const edgeAB = result.edges.find((e) => e.id === 'L_a_b_0');
    const edgeBC = result.edges.find((e) => e.id === 'L_b_c_0');

    expect(edgeAB?.startSide).toBe('right');
    expect(edgeAB?.endSide).toBe('left');
    expect(edgeBC?.startSide).toBe('right');
    expect(edgeBC?.endSide).toBe('left');

    const nodeA = nodes.find((n) => n.id === 'a')!;
    const nodeB = nodes.find((n) => n.id === 'b')!;
    const aligned = nodesAligned(nodeA, nodeB, 'right', 'left', nodes);
    expect(aligned.aligned).toBe(true);
  });

  it('should assign complementary sides for bidirectional edges', () => {
    const nodes: NonClusterNode[] = [createNode('a', 100, 100), createNode('b', 200, 100)];

    const edges: Edge[] = [createEdge('L_a_b_0', 'a', 'b'), createEdge('L_b_a_0', 'b', 'a')];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const result = edgeRouting(layoutData);

    const edgeAB = result.edges.find((e) => e.id === 'L_a_b_0');
    const edgeBA = result.edges.find((e) => e.id === 'L_b_a_0');

    expect(edgeAB?.startSide).toBeDefined();
    expect(edgeAB?.endSide).toBeDefined();

    expect(edgeBA?.startSide).toBeDefined();
    expect(edgeBA?.endSide).toBeDefined();

    expect(['left', 'right', 'top', 'bottom']).toContain(edgeAB?.startSide);
    expect(['left', 'right', 'top', 'bottom']).toContain(edgeBA?.startSide);
  });

  it('should return top 2 optimal side combinations', () => {
    const node1 = createNode('a', 100, 100);
    const node2 = createNode('b', 200, 100);

    const sideUsage = new Map<string, Map<Side, number>>();
    sideUsage.set(
      'a',
      new Map([
        ['left', 0],
        ['right', 0],
        ['top', 0],
        ['bottom', 0],
      ])
    );
    sideUsage.set(
      'b',
      new Map([
        ['left', 0],
        ['right', 0],
        ['top', 0],
        ['bottom', 0],
      ])
    );

    const result = calculateOptimalSides(node1, node2, sideUsage, [node1, node2], [], 'L_a_b_0');

    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('startSide');
    expect(result[0]).toHaveProperty('endSide');
    expect(result[1]).toHaveProperty('startSide');
    expect(result[1]).toHaveProperty('endSide');

    expect(result[0].startSide).toBe('right');
    expect(result[0].endSide).toBe('left');
  });

  it('should avoid congested sides when assigning edges', () => {
    const nodes: NonClusterNode[] = [
      createNode('a', 100, 100),
      createNode('b', 200, 100),
      createNode('c', 200, 200),
      createNode('d', 200, 300),
      createNode('e', 200, 400),
      createNode('f', 200, 500),
    ];

    const edges: Edge[] = [
      createEdge('L_a_b_0', 'a', 'b'),
      createEdge('L_b_c_0', 'b', 'c'),
      createEdge('L_b_d_0', 'b', 'd'),
      createEdge('L_b_e_0', 'b', 'e'),
      createEdge('L_b_f_0', 'b', 'f'),
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const result = edgeRouting(layoutData);

    const edgesFromB = result.edges.filter((e) => e.start === 'b');
    const sidesUsed = new Set(edgesFromB.map((e) => e.startSide));

    expect(sidesUsed.size).toBeGreaterThan(1);
  });
  it('should sort edges by distance (shorter edges first, self-loops last)', () => {
    const nodes: NonClusterNode[] = [
      {
        id: 'L1',
        x: 1,
        y: 0,
        width: 47.57,
        height: 44.98,
        isGroup: false,
        label: 'L1',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'L2',
        x: 1,
        y: 150,
        width: 47.57,
        height: 44.98,
        isGroup: false,
        label: 'L2',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'C',
        x: 1,
        y: 300,
        width: 42.12,
        height: 44.98,
        isGroup: false,
        label: 'C',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'M1',
        x: -417.74,
        y: 450,
        width: 51.44,
        height: 44.98,
        isGroup: false,
        label: 'M1',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'R1',
        x: -138,
        y: 600,
        width: 49.89,
        height: 44.98,
        isGroup: false,
        label: 'R1',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'R2',
        x: -138,
        y: 450,
        width: 49.89,
        height: 44.98,
        isGroup: false,
        label: 'R2',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'E1',
        x: 1,
        y: 600,
        width: 49.11,
        height: 44.98,
        isGroup: false,
        label: 'E1',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'E2',
        x: 419,
        y: 600,
        width: 49.11,
        height: 44.98,
        isGroup: false,
        label: 'E2',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'E3',
        x: -277.46,
        y: 450,
        width: 49.11,
        height: 44.98,
        isGroup: false,
        label: 'E3',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'E4',
        x: 140.67,
        y: 450,
        width: 49.11,
        height: 44.98,
        isGroup: false,
        label: 'E4',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'E5',
        x: 279.78,
        y: 450,
        width: 49.11,
        height: 44.98,
        isGroup: false,
        label: 'E5',
        padding: 15,
        shape: 'squareRect',
      } as NonClusterNode,
      {
        id: 'edge-label-C-E1-L_C_E1_0',
        x: 1,
        y: 450,
        width: 45.92,
        height: 20.98,
        isGroup: false,
        label: 'Label 1',
        isLabelNode: true,
        shape: 'labelRect',
      } as NonClusterNode,
      {
        id: 'edge-label-C-E2-L_C_E2_0',
        x: 419,
        y: 450,
        width: 45.92,
        height: 20.98,
        isGroup: false,
        label: 'Label 2',
        isLabelNode: true,
        shape: 'labelRect',
      } as NonClusterNode,
    ];

    const edges: Edge[] = [
      { id: 'L_L1_L2_0', start: 'L1', end: 'L2', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_L2_C_0', start: 'L2', end: 'C', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_R1_R2_0', start: 'R1', end: 'R2', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_R2_C_0', start: 'R2', end: 'C', type: 'double_arrow_point', isUserDefinedId: false },
      { id: 'L_C_E4_0', start: 'C', end: 'E4', type: 'double_arrow_point', isUserDefinedId: false },
      {
        id: 'L_C_E1_0-to-label',
        start: 'C',
        end: 'edge-label-C-E1-L_C_E1_0',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_C_E1_0-from-label',
        start: 'edge-label-C-E1-L_C_E1_0',
        end: 'E1',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_C_E2_0-from-label',
        start: 'edge-label-C-E2-L_C_E2_0',
        end: 'E2',
        type: 'double_arrow_point',
        isUserDefinedId: false,
      },
      { id: 'L_C_E3_0', start: 'C', end: 'E3', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_C_E5_0', start: 'C', end: 'E5', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_M1_C_0', start: 'M1', end: 'C', type: 'arrow_point', isUserDefinedId: false },
      {
        id: 'L_C_E2_0-to-label',
        start: 'C',
        end: 'edge-label-C-E2-L_C_E2_0',
        type: 'double_arrow_point',
        isUserDefinedId: false,
      },
    ];

    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    sortEdgesByDistance(layoutData);

    expect(layoutData.edges.length).toBe(12);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const dist = (a: string, b: string) => {
      const na = nodeMap.get(a);
      const nb = nodeMap.get(b);

      if (!na || !nb || na.x == null || na.y == null || nb.x == null || nb.y == null) {
        throw new Error(`Missing coordinates for ${a} or ${b}`);
      }

      return Math.hypot(na.x - nb.x, na.y - nb.y);
    };

    const distances = layoutData.edges.map((e) => {
      if (!e.start || !e.end) {
        throw new Error(`Edge ${e.id} missing start or end`);
      }
      return dist(e.start, e.end);
    });

    const idxM1C = layoutData.edges.findIndex((e) => e.id === 'L_M1_C_0');

    expect(layoutData.edges.findIndex((e) => e.id === 'L_C_E3_0')).toBeLessThan(idxM1C);
    expect(layoutData.edges.findIndex((e) => e.id === 'L_C_E4_0')).toBeLessThan(idxM1C);
    expect(layoutData.edges.findIndex((e) => e.id === 'L_C_E5_0')).toBeLessThan(idxM1C);

    expect(layoutData.edges.findIndex((e) => e.id === 'L_C_E1_0-to-label')).toBeLessThan(idxM1C);
    expect(layoutData.edges.findIndex((e) => e.id === 'L_C_E1_0-from-label')).toBeLessThan(idxM1C);

    const lastFew = layoutData.edges.slice(-3).map((e) => e.id);
    expect(lastFew).toContain('L_M1_C_0');
  });

  it('should assign sides correctly for CI/CD pipeline with subgraphs and decision nodes', () => {
    const nodes: Node[] = [
      {
        id: 'A',
        x: 0,
        y: 443,
        width: 96.56597900390625,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Start Build',
        padding: 15,
        shape: 'squareRect',
      } as Node,
      {
        id: 'B',
        x: 0,
        y: 277,
        width: 131.56597900390625,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Compile Source',
        padding: 15,
        shape: 'squareRect',
      } as Node,
      {
        id: 'C',
        x: 0,
        y: 111,
        width: 93.45833587646484,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Test Suite',
        padding: 15,
        shape: 'squareRect',
      } as Node,
      {
        id: 'D',
        x: 166,
        y: 111,
        width: 151.00694274902344,
        height: 151.00694274902344,
        isGroup: false,
        label: 'Tests Passed?',
        padding: 15,
        shape: 'diamond',
      } as Node,
      {
        id: 'E',
        x: 166,
        y: 443,
        width: 135.45486450195312,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Notify Developer',
        padding: 15,
        shape: 'squareRect',
      } as Node,
      {
        id: 'F',
        x: 452.4550653030025,
        y: 111,
        width: 154.11807250976562,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Build Docker Image',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'squareRect',
      } as Node,
      {
        id: 'G',
        x: 632.8737527483572,
        y: 111,
        width: 142.46875,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Deploy to Staging',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'squareRect',
      } as Node,
      {
        id: 'H',
        x: 820.4644532656762,
        y: 111,
        width: 163.9791717529297,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Run Integration Tests',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'squareRect',
      } as Node,
      {
        id: 'I',
        x: 1010.8612372124103,
        y: 111,
        width: 151.00694274902344,
        height: 151.00694274902344,
        isGroup: false,
        label: 'Tests Passed?',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'diamond',
      } as Node,
      {
        id: 'J',
        x: 1302.32226228714,
        y: 202,
        width: 130.78472900390625,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Rollback & Alert',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'squareRect',
      } as Node,
      {
        id: 'K',
        x: 1302.32226228714,
        y: 0,
        width: 161.9132080078125,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Deploy to Production',
        padding: 15,
        parentId: 'subGraph0',
        shape: 'squareRect',
      } as Node,
      {
        id: 'L',
        x: 1539.7285199165344,
        y: 0,
        width: 92.89930725097656,
        height: 44.98958206176758,
        isGroup: false,
        label: 'Success',
        padding: 15,
        shape: 'stadium',
      } as Node,
      {
        id: 'edge-label-D-E-L_D_E_0',
        x: 166,
        y: 277,
        width: 17.899309158325195,
        height: 20.98958396911621,
        isGroup: false,
        label: 'No',
        isLabelNode: true,
        shape: 'labelRect',
      } as Node,
      {
        id: 'edge-label-D-F-L_D_F_0',
        x: 331.3454914705538,
        y: 111,
        width: 22.829862594604492,
        height: 20.98958396911621,
        isGroup: false,
        label: 'Yes',
        isLabelNode: true,
        shape: 'labelRect',
      } as Node,
      {
        id: 'edge-label-I-J-L_I_J_0',
        x: 1156,
        y: 202,
        width: 17.899309158325195,
        height: 20.98958396911621,
        isGroup: false,
        label: 'No',
        parentId: 'subGraph0',
        isLabelNode: true,
        shape: 'labelRect',
      } as Node,
      {
        id: 'edge-label-I-K-L_I_K_0',
        x: 1156,
        y: 0,
        width: 22.829862594604492,
        height: 20.98958396911621,
        isGroup: false,
        label: 'Yes',
        parentId: 'subGraph0',
        isLabelNode: true,
        shape: 'labelRect',
      } as Node,
      {
        id: 'subGraph0',
        x: 879.337447669583,
        y: 101,
        width: 1067.8828372429264,
        height: 306.9895820617676,
        isGroup: true,
        label: 'Deploy Pipeline',
        padding: 8,
        shape: 'rect',
      } as Node,
    ];

    const edges: Edge[] = [
      { id: 'L_F_G_0', isUserDefinedId: false, start: 'F', end: 'G', type: 'arrow_point' },
      { id: 'L_H_I_0', isUserDefinedId: false, start: 'H', end: 'I', type: 'arrow_point' },
      { id: 'L_G_H_0', isUserDefinedId: false, start: 'G', end: 'H', type: 'arrow_point' },
      { id: 'L_C_D_0', isUserDefinedId: false, start: 'C', end: 'D', type: 'arrow_point' },
      { id: 'L_E_A_0', isUserDefinedId: false, start: 'E', end: 'A', type: 'arrow_point' },
      { id: 'L_K_L_0', isUserDefinedId: false, start: 'K', end: 'L', type: 'arrow_point' },
      { id: 'L_A_B_0', isUserDefinedId: false, start: 'A', end: 'B', type: 'arrow_point' },
      { id: 'L_B_C_0', isUserDefinedId: false, start: 'B', end: 'C', type: 'arrow_point' },
      {
        id: 'L_D_F_0-from-label',
        isUserDefinedId: false,
        start: 'edge-label-D-F-L_D_F_0',
        end: 'F',
        type: 'arrow_point',
      },
      {
        id: 'L_I_J_0-from-label',
        isUserDefinedId: false,
        start: 'edge-label-I-J-L_I_J_0',
        end: 'J',
        type: 'arrow_point',
      },
      {
        id: 'L_I_K_0-from-label',
        isUserDefinedId: false,
        start: 'edge-label-I-K-L_I_K_0',
        end: 'K',
        type: 'arrow_point',
      },
      {
        id: 'L_D_F_0-to-label',
        isUserDefinedId: false,
        start: 'D',
        end: 'edge-label-D-F-L_D_F_0',
        type: 'arrow_point',
      },
      {
        id: 'L_D_E_0-to-label',
        isUserDefinedId: false,
        start: 'D',
        end: 'edge-label-D-E-L_D_E_0',
        type: 'arrow_point',
      },
      {
        id: 'L_D_E_0-from-label',
        isUserDefinedId: false,
        start: 'edge-label-D-E-L_D_E_0',
        end: 'E',
        type: 'arrow_point',
      },
      {
        id: 'L_I_J_0-to-label',
        isUserDefinedId: false,
        start: 'I',
        end: 'edge-label-I-J-L_I_J_0',
        type: 'arrow_point',
      },
      {
        id: 'L_I_K_0-to-label',
        isUserDefinedId: false,
        start: 'I',
        end: 'edge-label-I-K-L_I_K_0',
        type: 'arrow_point',
      },
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    sortEdgesByDistance(layoutData);

    const nodeMap = new Map<string, Node>();
    for (const node of layoutData.nodes) {
      nodeMap.set(node.id, node);
    }

    const sideUsage = initializeSideUsage(layoutData.nodes);
    const sideSlots = initializeSideSlots(layoutData.nodes);
    const connectionSides = new Map<
      string,
      {
        startSide: string;
        endSide: string;
        canDrawStraight: boolean;
        nodeWhichCovered: Node | null;
        overlapCenter: { x: number; y: number } | null;
        coveragePercent: number;
      }
    >();

    assignSidesToEdges(layoutData, nodeMap, sideUsage, sideSlots, connectionSides);

    expect(layoutData.edges.length).toBe(16);

    for (const edge of layoutData.edges) {
      expect(edge.startSide).toBeDefined();
      expect(edge.endSide).toBeDefined();
      expect(['left', 'right', 'top', 'bottom']).toContain(edge.startSide);
      expect(['left', 'right', 'top', 'bottom']).toContain(edge.endSide);
    }

    expect(connectionSides.size).toBeGreaterThan(0);

    const edgeAB = layoutData.edges.find((e) => e.id === 'L_A_B_0');
    expect(edgeAB).toBeDefined();
    expect(edgeAB?.startSide).toBe('top');
    expect(edgeAB?.endSide).toBe('bottom');

    const edgeBC = layoutData.edges.find((e) => e.id === 'L_B_C_0');
    expect(edgeBC).toBeDefined();
    expect(edgeBC?.startSide).toBe('top');
    expect(edgeBC?.endSide).toBe('bottom');

    const edgeFG = layoutData.edges.find((e) => e.id === 'L_F_G_0');
    expect(edgeFG).toBeDefined();
    expect(edgeFG?.startSide).toBe('right');
    expect(edgeFG?.endSide).toBe('left');

    const edgeGH = layoutData.edges.find((e) => e.id === 'L_G_H_0');
    expect(edgeGH).toBeDefined();
    expect(edgeGH?.startSide).toBe('right');
    expect(edgeGH?.endSide).toBe('left');

    const edgeHI = layoutData.edges.find((e) => e.id === 'L_H_I_0');
    expect(edgeHI).toBeDefined();
    expect(edgeHI?.startSide).toBe('right');
    expect(edgeHI?.endSide).toBe('left');

    const edgeCD = layoutData.edges.find((e) => e.id === 'L_C_D_0');
    expect(edgeCD).toBeDefined();
    expect(edgeCD?.startSide).toBe('right');
    expect(edgeCD?.endSide).toBe('left');

    const edgeDToLabelF = layoutData.edges.find((e) => e.id === 'L_D_F_0-to-label');
    expect(edgeDToLabelF).toBeDefined();
    expect(edgeDToLabelF?.startSide).toBeDefined();
    expect(edgeDToLabelF?.endSide).toBeDefined();

    const edgeLabelToF = layoutData.edges.find((e) => e.id === 'L_D_F_0-from-label');
    expect(edgeLabelToF).toBeDefined();
    expect(edgeLabelToF?.startSide).toBeDefined();
    expect(edgeLabelToF?.endSide).toBeDefined();

    const edgeEA = layoutData.edges.find((e) => e.id === 'L_E_A_0');
    expect(edgeEA).toBeDefined();
    expect(edgeEA?.startSide).toBe('left');
    expect(edgeEA?.endSide).toBe('right');

    const edgeKL = layoutData.edges.find((e) => e.id === 'L_K_L_0');
    expect(edgeKL).toBeDefined();
    expect(edgeKL?.startSide).toBe('right');
    expect(edgeKL?.endSide).toBe('left');

    const nodeBUsage = sideUsage.get('B');
    expect(nodeBUsage).toBeDefined();
    expect(nodeBUsage?.get('top')).toBeGreaterThan(0);
    expect(nodeBUsage?.get('bottom')).toBeGreaterThan(0);

    const nodeCSlots = sideSlots.get('C');
    expect(nodeCSlots).toBeDefined();
    expect(nodeCSlots?.get('top')).toBeDefined();
    expect(nodeCSlots?.get('right')).toBeDefined();
    expect(nodeCSlots?.get('bottom')).toBeDefined();
    expect(nodeCSlots?.get('left')).toBeDefined();
  });

  it('should assign sides correctly for Class Diagram: Controller->Model(notifyChange)->View', () => {
    const nodes: Node[] = [
      {
        id: 'Controller',
        x: 51.41979730129242,
        y: 20.62743890285492,
        width: 214.1822967529297,
        height: 119.97917175292969,
        isGroup: false,
        label: 'Controller',
        shape: 'classBox',
      } as Node,
      {
        id: 'View',
        x: 51.41979730129242,
        y: 171.37256109714508,
        width: 142.8802032470703,
        height: 119.97917175292969,
        isGroup: false,
        label: 'View',
        shape: 'classBox',
      } as Node,
      {
        id: 'Model',
        x: 295.5802026987076,
        y: 20.62743890285492,
        width: 212.6197967529297,
        height: 140.96875,
        isGroup: false,
        label: 'Model',
        shape: 'classBox',
      } as Node,
      {
        id: 'edge-label-Model-View-id_Model_View_3',
        x: 295.5802026987076,
        y: 171.37256109714508,
        width: 91.78820037841797,
        height: 20.98958396911621,
        isGroup: false,
        label: 'notifyChange()',
        isLabelNode: true,
        shape: 'labelRect',
      } as Node,
    ];

    const edges: Edge[] = [
      { id: 'id_Controller_Model_1', start: 'Controller', end: 'Model', type: 'normal' },
      { id: 'id_Controller_View_2', start: 'Controller', end: 'View', type: 'normal' },
      {
        id: 'id_Model_View_3-to-label',
        start: 'Model',
        end: 'edge-label-Model-View-id_Model_View_3',
        type: 'normal',
      },
      {
        id: 'id_Model_View_3-from-label',
        start: 'edge-label-Model-View-id_Model_View_3',
        end: 'View',
        type: 'normal',
      },
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    sortEdgesByDistance(layoutData);

    const nodeMap = new Map<string, Node>();
    for (const node of layoutData.nodes) {
      nodeMap.set(node.id, node);
    }

    const sideUsage = initializeSideUsage(layoutData.nodes);
    const sideSlots = initializeSideSlots(layoutData.nodes);
    const connectionSides = new Map<
      string,
      {
        startSide: string;
        endSide: string;
        canDrawStraight: boolean;
        nodeWhichCovered: Node | null;
        overlapCenter: { x: number; y: number } | null;
        coveragePercent: number;
      }
    >();

    assignSidesToEdges(layoutData, nodeMap, sideUsage, sideSlots, connectionSides);

    const edgeControllerView = layoutData.edges.find((e) => e.id === 'id_Controller_View_2');
    expect(edgeControllerView).toBeDefined();
    expect(edgeControllerView?.startSide).toBe('bottom');
    expect(edgeControllerView?.endSide).toBe('top');

    const edgeControllerModel = layoutData.edges.find((e) => e.id === 'id_Controller_Model_1');
    expect(edgeControllerModel).toBeDefined();
    expect(edgeControllerModel?.startSide).toBe('right');
    expect(edgeControllerModel?.endSide).toBe('left');

    const edgeModelLabel = layoutData.edges.find((e) => e.id === 'id_Model_View_3-to-label');
    expect(edgeModelLabel).toBeDefined();
    expect(edgeModelLabel?.startSide).toBe('bottom');
    expect(edgeModelLabel?.endSide).toBe('top');

    const edgeLabelView = layoutData.edges.find((e) => e.id === 'id_Model_View_3-from-label');
    expect(edgeLabelView).toBeDefined();
    expect(edgeLabelView?.startSide).toBeDefined();
    expect(edgeLabelView?.endSide).toBe('right');
  });
});
