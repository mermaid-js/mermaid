import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { layoutAndPlaceTrees } from './index.js';
import { SymmetricTreeLayouter } from './symmetricTreeLayouter.js';
import { CorePlanarizer } from './corePlanarizer.js';
import { calculateBaseEdgeLength } from '../coreLayout/graphUtils.js';

describe('treeLayout - layoutAndPlaceTrees and SymmetricTreeLayouter', () => {
  const baseConfig = {} as LayoutData['config'];

  it('should layout a single tree (A -> B) when core is empty', () => {
    const coreWithCoordinates: LayoutData = {
      nodes: [],
      edges: [],
      config: baseConfig,
    };

    const nodes: Node[] = [
      {
        id: 'A',
        label: 'A',
        width: 41.35416793823242,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
      {
        id: 'B',
        label: 'B',
        width: 41.35416793823242,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
    ];

    const edges: Edge[] = [{ id: 'L_A_B_0', start: 'A', end: 'B', type: 'arrow_point' } as Edge];

    const treeData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };
    const uniformEdgeLength = calculateBaseEdgeLength(treeData.nodes, treeData.edges);
    const trees = new Map<string, LayoutData>();
    trees.set('A', treeData);

    const layoutEngine = new SymmetricTreeLayouter(treeData);

    const treeStructure = layoutEngine.buildTreeStructure('A');
    expect(treeStructure.root).toBe('A');
    expect(treeStructure.children.get('A')).toContain('B');
    expect(treeStructure.levels.get('A')).toBe(0);
    expect(treeStructure.levels.get('B')).toBe(1);

    const treeLayout = layoutEngine.layoutTree('A');
    expect(treeLayout.nodes.length).toBe(2);
    expect(treeLayout.edges.length).toBe(1);

    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(0);
  });

  it('should layout multiple trees (A -> B, C -> D) with copy-node logic', () => {
    const coreWithCoordinates: LayoutData = {
      nodes: [],
      edges: [],
      config: baseConfig,
    };

    const tree1Data: LayoutData = {
      nodes: [
        {
          id: 'A',
          width: 41.35416793823242,
          height: 45,
          padding: 15,
          isGroup: false,
          isCopy: true,
        } as Node,
        { id: 'B', width: 41.35416793823242, height: 45, padding: 15, isGroup: false } as Node,
      ],
      edges: [{ id: 'L_A_B_0', start: 'A_copy', end: 'B', type: 'arrow_point' } as Edge],
      config: baseConfig,
    };

    const tree2Data: LayoutData = {
      nodes: [
        {
          id: 'C',
          width: 41.35416793823242,
          height: 45,
          padding: 15,
          isGroup: false,
          isCopy: true,
        } as Node,
        { id: 'D', width: 41.35416793823242, height: 45, padding: 15, isGroup: false } as Node,
      ],
      edges: [{ id: 'L_C_D_0', start: 'C_copy', end: 'D', type: 'arrow_point' } as Edge],
      config: baseConfig,
    };

    const trees = new Map<string, LayoutData>();
    trees.set('A', tree1Data);
    trees.set('C', tree2Data);
    const uniformEdgeLength = calculateBaseEdgeLength(
      [...tree1Data.nodes, ...tree2Data.nodes],
      [...tree1Data.edges, ...tree2Data.edges]
    );
    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

    expect(result.nodes.length).toBe(4);
    const nodeIds = result.nodes.map((n) => n.id);
    expect(nodeIds).toContain('A');
    expect(nodeIds).toContain('B');
    expect(nodeIds).toContain('C');
    expect(nodeIds).toContain('D');

    const nodeA = result.nodes.find((n) => n.id === 'A')!;
    const nodeC = result.nodes.find((n) => n.id === 'C')!;

    expect(Math.abs((nodeA.x ?? 0) - (nodeC.x ?? 0))).toBeGreaterThanOrEqual(141.35);
    expect(result.edges.length).toBe(0);
  });

  it('should layout a chain (A -> B -> C) when core is empty', () => {
    const coreWithCoordinates: LayoutData = {
      nodes: [],
      edges: [],
      config: baseConfig,
    };

    const treeData: LayoutData = {
      nodes: [
        { id: 'A', width: 41.35, height: 45, padding: 15, isGroup: false } as Node,
        { id: 'B', width: 41.35, height: 45, padding: 15, isGroup: false } as Node,
        { id: 'C', width: 41.35, height: 45, padding: 15, isGroup: false } as Node,
      ],
      edges: [
        { id: 'L_A_B', start: 'A', end: 'B' } as Edge,
        { id: 'L_B_C', start: 'B', end: 'C' } as Edge,
      ],
      config: baseConfig,
    };

    const trees = new Map<string, LayoutData>();
    trees.set('A', treeData);

    const uniformEdgeLength = calculateBaseEdgeLength(treeData.nodes, treeData.edges);
    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

    expect(result.nodes.length).toBe(3);
    const nodeA = result.nodes.find((n) => n.id === 'A')!;
    const nodeB = result.nodes.find((n) => n.id === 'B')!;
    const nodeC = result.nodes.find((n) => n.id === 'C')!;

    expect(nodeA.y ?? 0).toBeLessThan(nodeB.y ?? 0);
    expect(nodeB.y ?? 0).toBeLessThan(nodeC.y ?? 0);
  });

  it('should correctly planarize a diamond-shaped core and identify faces', () => {
    const nodes: Node[] = [
      {
        id: 'Split',
        x: 66.80217417441648,
        y: 71.15110013549676,
        width: 178.29,
        height: 178.29,
      } as Node,
      {
        id: 'edge-label-Split-T2-L_Split_T2_0',
        x: 260.09384592734614,
        y: 71.15110013549676,
        width: 50,
        height: 20,
      } as Node,
      {
        id: 'edge-label-Split-T2-L_Split_T2_2',
        x: 66.80217417441648,
        y: 264.4427718884265,
        width: 50,
        height: 20,
      } as Node,
      { id: 'T2', x: 260.09384592734614, y: 264.4427718884265, width: 50, height: 45 } as Node,
    ];

    const edges: Edge[] = [
      {
        id: 'L_Split_T2_0-to-label',
        start: 'Split',
        end: 'edge-label-Split-T2-L_Split_T2_0',
      } as Edge,
      {
        id: 'L_Split_T2_2-to-label',
        start: 'Split',
        end: 'edge-label-Split-T2-L_Split_T2_2',
      } as Edge,
      {
        id: 'L_Split_T2_0-from-label',
        start: 'edge-label-Split-T2-L_Split_T2_0',
        end: 'T2',
      } as Edge,
      {
        id: 'L_Split_T2_2-from-label',
        start: 'edge-label-Split-T2-L_Split_T2_2',
        end: 'T2',
      } as Edge,
    ];

    const coreData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const planarizer = new CorePlanarizer(coreData);
    const planarizedCore = planarizer.planarizeCore();

    expect(planarizedCore.nodes.size).toBe(4);
    expect(planarizedCore.edges.length).toBe(4);

    const diamondFace = planarizedCore.faces.find((f) => f.boundaryNodes.length === 4);
    expect(diamondFace).toBeDefined();
    expect(diamondFace?.id).toBe(
      'face_Split_edge-label-Split-T2-L_Split_T2_0_T2_edge-label-Split-T2-L_Split_T2_2'
    );
  });

  it('should correctly planarize a complex core (Split-T1-T2-Merge) and identify faces', () => {
    const nodes: Node[] = [
      {
        id: 'Split',
        x: 77.25825407272532,
        y: 79.74855383935355,
        width: 178.29,
        height: 178.29,
      } as Node,
      {
        id: 'edge-label-Split-T1-L_Split_T1_0',
        x: 270.549925825655,
        y: 79.74855383935355,
        width: 22.85,
        height: 21,
      } as Node,

      { id: 'T1', x: 463.8415975785847, y: 79.74855383935355, width: 73.25, height: 45 } as Node,
      {
        id: 'edge-label-Split-T2-L_Split_T2_0',
        x: 77.25825407272532,
        y: 273.04022559228326,
        width: 22.85,
        height: 21,
      } as Node,
      { id: 'T2', x: 270.549925825655, y: 273.04022559228326, width: 74.02, height: 45 } as Node,
      {
        id: 'Merge',
        x: 463.8415975785847,
        y: 273.04022559228326,
        width: 140.27,
        height: 140.27,
      } as Node,
    ];

    const edges: Edge[] = [
      {
        id: 'L_Split_T1_0-to-label',
        start: 'Split',
        end: 'edge-label-Split-T1-L_Split_T1_0',
      } as Edge,
      {
        id: 'L_Split_T2_0-to-label',
        start: 'Split',
        end: 'edge-label-Split-T2-L_Split_T2_0',
      } as Edge,
      {
        id: 'L_Split_T1_0-from-label',
        start: 'edge-label-Split-T1-L_Split_T1_0',
        end: 'T1',
      } as Edge,
      { id: 'L_T1_Merge_0', start: 'T1', end: 'Merge' } as Edge,
      {
        id: 'L_Split_T2_0-from-label',
        start: 'edge-label-Split-T2-L_Split_T2_0',
        end: 'T2',
      } as Edge,
      { id: 'L_T2_Merge_0', start: 'T2', end: 'Merge' } as Edge,
    ];

    const coreData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const planarizer = new CorePlanarizer(coreData);
    const planarizedCore = planarizer.planarizeCore();

    expect(planarizedCore.nodes.size).toBe(6);

    expect(planarizedCore.edges.length).toBe(6);

    expect(planarizedCore.faces.length).toBeGreaterThanOrEqual(1);
    const face = planarizedCore.faces.find((f) => f.boundaryNodes.length === 6);
    expect(face).toBeDefined();
    expect(face?.id).toBe(
      'face_Merge_T1_edge-label-Split-T1-L_Split_T1_0_Split_edge-label-Split-T2-L_Split_T2_0_T2'
    );
    expect(face?.area).toBeCloseTo(74723.34, 1);
    expect(face?.boundaryNodes).toHaveLength(6);

    const neighbors = planarizedCore.embedding.nodeNeighbors;
    expect(neighbors.get('Split')).toContain('edge-label-Split-T1-L_Split_T1_0');
    expect(neighbors.get('Split')).toContain('edge-label-Split-T2-L_Split_T2_0');
    expect(neighbors.get('Merge')).toContain('T1');
    expect(neighbors.get('Merge')).toContain('T2');

    expect(neighbors.get('T1')).toContain('Merge');
    expect(neighbors.get('T1')).toContain('edge-label-Split-T1-L_Split_T1_0');

    expect(neighbors.get('T2')).toContain('Merge');
    expect(neighbors.get('T2')).toContain('edge-label-Split-T2-L_Split_T2_0');
  });

  it('should layout complete workflow with core planarization and tree placement', () => {
    const coreNodes: Node[] = [
      {
        id: 'Split',
        x: 100,
        y: 100,
        width: 120,
        height: 60,
        padding: 15,
        shape: 'diamond',
        isGroup: false,
      } as Node,
      {
        id: 'T1',
        x: 50,
        y: 200,
        width: 80,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
      {
        id: 'T2',
        x: 150,
        y: 200,
        width: 80,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
      {
        id: 'Merge',
        x: 100,
        y: 300,
        width: 100,
        height: 60,
        padding: 15,
        shape: 'circle',
        isGroup: false,
      } as Node,
    ];

    const coreEdges: Edge[] = [
      { id: 'L_Split_T1', start: 'Split', end: 'T1', type: 'arrow_point' } as Edge,
      { id: 'L_Split_T2', start: 'Split', end: 'T2', type: 'arrow_point' } as Edge,
      { id: 'L_T1_Merge', start: 'T1', end: 'Merge', type: 'arrow_point' } as Edge,
      { id: 'L_T2_Merge', start: 'T2', end: 'Merge', type: 'arrow_point' } as Edge,
    ];

    const coreWithCoordinates: LayoutData = {
      nodes: coreNodes,
      edges: coreEdges,
      config: baseConfig,
    };

    const tree1Data: LayoutData = {
      nodes: [
        {
          id: 'Start',
          label: 'Start',
          width: 80,
          height: 45,
          padding: 15,
          shape: 'stadium',
          isGroup: false,
        } as Node,
        {
          id: 'Prep',
          label: 'Prep',
          width: 100,
          height: 45,
          padding: 15,
          shape: 'squareRect',
          isGroup: false,
        } as Node,
      ],
      edges: [{ id: 'L_Start_Prep', start: 'Start', end: 'Prep', type: 'arrow_point' } as Edge],
      config: baseConfig,
    };

    const trees = new Map<string, LayoutData>();
    trees.set('Start', tree1Data);
    const allNodes = [...coreWithCoordinates.nodes, ...tree1Data.nodes];
    const allEdges = [...coreWithCoordinates.edges, ...tree1Data.edges];
    const uniformEdgeLength = calculateBaseEdgeLength(allNodes, allEdges);

    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

    expect(result.nodes.length).toBe(4);
    const nodeIds = result.nodes.map((n) => n.id).sort();
    expect(nodeIds).toContain('Split');
    expect(nodeIds).toContain('T1');
    expect(nodeIds).toContain('T2');
    expect(nodeIds).toContain('Merge');

    const splitNode = result.nodes.find((n) => n.id === 'Split')!;
    const mergeNode = result.nodes.find((n) => n.id === 'Merge')!;
    const t1Node = result.nodes.find((n) => n.id === 'T1')!;
    const t2Node = result.nodes.find((n) => n.id === 'T2')!;

    expect(splitNode).toBeDefined();
    expect(mergeNode).toBeDefined();
    expect(t1Node).toBeDefined();
    expect(t2Node).toBeDefined();

    expect(splitNode.x).toBeDefined();
    expect(splitNode.y).toBeDefined();
    expect(mergeNode.x).toBeDefined();
    expect(mergeNode.y).toBeDefined();

    expect(result.edges.length).toBe(4);
  });

  it('should handle tree placement when core has nodes', () => {
    const coreNodes: Node[] = [
      {
        id: 'A',
        x: 0,
        y: 0,
        width: 50,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
      {
        id: 'B',
        x: 100,
        y: 0,
        width: 50,
        height: 45,
        padding: 15,
        shape: 'squareRect',
        isGroup: false,
      } as Node,
    ];

    const coreEdges: Edge[] = [{ id: 'L_A_B', start: 'A', end: 'B', type: 'arrow_point' } as Edge];

    const coreWithCoordinates: LayoutData = {
      nodes: coreNodes,
      edges: coreEdges,
      config: baseConfig,
    };

    const treeData: LayoutData = {
      nodes: [
        {
          id: 'Root',
          label: 'Root',
          width: 60,
          height: 45,
          padding: 15,
          shape: 'squareRect',
          isGroup: false,
        } as Node,
        {
          id: 'Leaf1',
          label: 'Leaf1',
          width: 50,
          height: 45,
          padding: 15,
          shape: 'squareRect',
          isGroup: false,
        } as Node,
      ],
      edges: [{ id: 'L_Root_Leaf1', start: 'Root', end: 'Leaf1', type: 'arrow_point' } as Edge],
      config: baseConfig,
    };

    const trees = new Map<string, LayoutData>();
    trees.set('Root', treeData);

    const uniformEdgeLength = calculateBaseEdgeLength(
      [...coreWithCoordinates.nodes, ...treeData.nodes],
      [...coreWithCoordinates.edges, ...treeData.edges]
    );
    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

    expect(result.nodes.length).toBe(2);

    const nodeA = result.nodes.find((n) => n.id === 'A')!;
    const nodeB = result.nodes.find((n) => n.id === 'B')!;

    expect(nodeA.x).toBeDefined();
    expect(nodeA.y).toBeDefined();
    expect(nodeB.x).toBeDefined();
    expect(nodeB.y).toBeDefined();
  });

  it('should handle core planarization when trees map is empty', () => {
    const coreNodes: Node[] = [
      { id: 'A', x: 0, y: 0, width: 50, height: 45, padding: 15, isGroup: false } as Node,
      { id: 'B', x: 100, y: 100, width: 50, height: 45, padding: 15, isGroup: false } as Node,
    ];

    const coreEdges: Edge[] = [{ id: 'L_A_B', start: 'A', end: 'B' } as Edge];

    const coreWithCoordinates: LayoutData = {
      nodes: coreNodes,
      edges: coreEdges,
      config: baseConfig,
    };

    const emptyTrees = new Map<string, LayoutData>();
    const uniformEdgeLength = calculateBaseEdgeLength(
      coreWithCoordinates.nodes,
      coreWithCoordinates.edges
    );
    const result = layoutAndPlaceTrees(coreWithCoordinates, emptyTrees, uniformEdgeLength);

    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    expect(result.nodes.map((n) => n.id).sort()).toEqual(['A', 'B']);
  });

  it('should handle real-world data with core planarization and complete tree structures', () => {
    const coreNodes: Node[] = [
      {
        id: 'Split',
        label: 'Ready to Process?',
        padding: 15,
        isGroup: false,
        shape: 'diamond',
        width: 178.2916717529297,
        height: 178.2916717529297,
        x: -36.264725449174996,
        y: -33.76393466219276,
      } as Node,
      {
        id: 'edge-label-Split-T1-L_Split_T1_0',
        label: 'Yes',
        shape: 'labelRect',
        width: 22.854167938232422,
        height: 21,
        isEdgeLabel: false,
        isLabelNode: true,
        isGroup: false,
        x: 159.85703203648404,
        y: -33.76333678851216,
      } as Node,
      {
        id: 'T1',
        label: 'Task A',
        padding: 15,
        isGroup: false,
        shape: 'squareRect',
        width: 73.25,
        height: 45,
        x: 355.9778441546014,
        y: -33.76389259940424,
      } as Node,
      {
        id: 'edge-label-Split-T2-L_Split_T2_0',
        label: 'Yes',
        shape: 'labelRect',
        width: 22.854167938232422,
        height: 21,
        isEdgeLabel: false,
        isLabelNode: true,
        isGroup: false,
        x: -36.26441263864769,
        y: 162.35810001026803,
      } as Node,
      {
        id: 'T2',
        label: 'Task B',
        padding: 15,
        isGroup: false,
        shape: 'squareRect',
        width: 74.02083587646484,
        height: 45,
        x: 159.85636466747425,
        y: 162.35750213703724,
      } as Node,
      {
        id: 'Merge',
        label: 'Join Results',
        padding: 15,
        isGroup: false,
        shape: 'circle',
        width: 140.2708282470703,
        height: 140.2708282470703,
        x: 355.9781987150359,
        y: 162.35805794845558,
      } as Node,
    ];

    const coreEdges: Edge[] = [
      {
        id: 'L_Split_T1_0-to-label',
        start: 'Split',
        end: 'edge-label-Split-T1-L_Split_T1_0',
        type: 'arrow_point',
      } as Edge,
      {
        id: 'L_Split_T2_0-to-label',
        start: 'Split',
        end: 'edge-label-Split-T2-L_Split_T2_0',
        type: 'arrow_point',
      } as Edge,
      {
        id: 'L_Split_T1_0-from-label',
        start: 'edge-label-Split-T1-L_Split_T1_0',
        end: 'T1',
        type: 'arrow_point',
      } as Edge,
      {
        id: 'L_T1_Merge_0',
        start: 'T1',
        end: 'Merge',
        type: 'arrow_point',
      } as Edge,
      {
        id: 'L_Split_T2_0-from-label',
        start: 'edge-label-Split-T2-L_Split_T2_0',
        end: 'T2',
        type: 'arrow_point',
      } as Edge,
      {
        id: 'L_T2_Merge_0',
        start: 'T2',
        end: 'Merge',
        type: 'arrow_point',
      } as Edge,
    ];

    const coreWithCoordinates: LayoutData = {
      nodes: coreNodes,
      edges: coreEdges,
      config: baseConfig,
    };

    const tree1Data: LayoutData = {
      nodes: [
        {
          id: 'Split',
          label: 'Ready to Process?',
          padding: 15,
          isGroup: false,
          shape: 'diamond',
          width: 178.2916717529297,
          height: 178.2916717529297,
          isCopy: true,
          x: 0,
          y: 0,
        } as Node,
        {
          id: 'Start',
          label: 'Start',
          padding: 15,
          isGroup: false,
          shape: 'stadium',
          width: 69.58333587646484,
          height: 45,
          x: 0,
          y: 351.64583587646484,
        } as Node,
        {
          id: 'Prep',
          label: 'Preparation Step',
          padding: 15,
          isGroup: false,
          shape: 'squareRect',
          width: 137.0833282470703,
          height: 45,
          x: 0,
          y: 201.64583587646484,
        } as Node,
        {
          id: 'Split_copy',
          label: 'Ready to Process?',
          padding: 15,
          isGroup: false,
          shape: 'diamond',
          width: 178.2916717529297,
          height: 178.2916717529297,
          isCopy: true,
          x: 0,
          y: 0,
        } as Node,
      ],
      edges: [
        {
          id: 'L_Start_Prep_0',
          start: 'Start',
          end: 'Prep',
        } as Edge,
        {
          id: 'L_Prep_Split_0',
          start: 'Prep',
          end: 'Split_copy',
        } as Edge,
      ],
      config: baseConfig,
    };

    const tree2Data: LayoutData = {
      nodes: [
        {
          id: 'Merge',
          label: 'Join Results',
          padding: 15,
          isGroup: false,
          shape: 'circle',
          width: 140.2708282470703,
          height: 140.2708282470703,
          isCopy: true,
          x: 0,
          y: 0,
        } as Node,
        {
          id: 'End',
          label: 'End',
          padding: 15,
          isGroup: false,
          shape: 'stadium',
          width: 64.91666412353516,
          height: 45,
          x: 0,
          y: 332.63541412353516,
        } as Node,
        {
          id: 'Finalize',
          label: 'Finalize Process',
          padding: 15,
          isGroup: false,
          shape: 'squareRect',
          width: 134.7083282470703,
          height: 45,
          x: 0,
          y: 182.63541412353516,
        } as Node,
        {
          id: 'Merge_copy',
          label: 'Join Results',
          padding: 15,
          isGroup: false,
          shape: 'circle',
          width: 140.2708282470703,
          height: 140.2708282470703,
          isCopy: true,
          x: 0,
          y: 0,
        } as Node,
      ],
      edges: [
        {
          id: 'L_Merge_Finalize_0',
          start: 'Merge_copy',
          end: 'Finalize',
        } as Edge,
        {
          id: 'L_Finalize_End_0',
          start: 'Finalize',
          end: 'End',
        } as Edge,
      ],
      config: baseConfig,
    };

    const trees = new Map<string, LayoutData>();
    trees.set('Split', tree1Data);
    trees.set('Merge', tree2Data);
    const uniformEdgeLength = calculateBaseEdgeLength(
      [...coreWithCoordinates.nodes, ...tree1Data.nodes, ...tree2Data.nodes],
      [...coreWithCoordinates.edges, ...tree1Data.edges, ...tree2Data.edges]
    );
    const result = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

    expect(result.nodes.length).toBe(10);

    const nodeIds = result.nodes.map((n) => n.id).sort();
    expect(nodeIds).toContain('Merge');
    expect(nodeIds).toContain('Split');
    expect(nodeIds).toContain('T1');
    expect(nodeIds).toContain('T2');
    expect(nodeIds).toContain('edge-label-Split-T1-L_Split_T1_0');
    expect(nodeIds).toContain('edge-label-Split-T2-L_Split_T2_0');

    expect(nodeIds).toContain('Start');
    expect(nodeIds).toContain('Prep');
    expect(nodeIds).toContain('Finalize');
    expect(nodeIds).toContain('End');

    const splitNode = result.nodes.find((n) => n.id === 'Split')!;
    const mergeNode = result.nodes.find((n) => n.id === 'Merge')!;
    const t1Node = result.nodes.find((n) => n.id === 'T1')!;
    const t2Node = result.nodes.find((n) => n.id === 'T2')!;

    expect(splitNode.x).toBeDefined();
    expect(splitNode.y).toBeDefined();
    expect(mergeNode.x).toBeDefined();
    expect(mergeNode.y).toBeDefined();
    expect(t1Node.x).toBeDefined();
    expect(t1Node.y).toBeDefined();
    expect(t2Node.x).toBeDefined();
    expect(t2Node.y).toBeDefined();

    const edgeLabel1 = result.nodes.find((n) => n.id === 'edge-label-Split-T1-L_Split_T1_0')!;
    const edgeLabel2 = result.nodes.find((n) => n.id === 'edge-label-Split-T2-L_Split_T2_0')!;

    expect(edgeLabel1.x).toBeDefined();
    expect(edgeLabel1.y).toBeDefined();
    expect(edgeLabel2.x).toBeDefined();
    expect(edgeLabel2.y).toBeDefined();

    const startNode = result.nodes.find((n) => n.id === 'Start')!;
    const prepNode = result.nodes.find((n) => n.id === 'Prep')!;
    const finalizeNode = result.nodes.find((n) => n.id === 'Finalize')!;
    const endNode = result.nodes.find((n) => n.id === 'End')!;

    expect(startNode).toBeDefined();
    expect(startNode.x).toBeDefined();
    expect(startNode.y).toBeDefined();
    expect(prepNode).toBeDefined();
    expect(prepNode.x).toBeDefined();
    expect(prepNode.y).toBeDefined();
    expect(finalizeNode).toBeDefined();
    expect(finalizeNode.x).toBeDefined();
    expect(finalizeNode.y).toBeDefined();
    expect(endNode).toBeDefined();
    expect(endNode.x).toBeDefined();
    expect(endNode.y).toBeDefined();
    expect(startNode.y!).toBeLessThan(prepNode.y!);
    expect(finalizeNode.y!).toBeLessThan(endNode.y!);

    const t1T2YDiff = Math.abs(t1Node.y! - t2Node.y!);
    expect(t1T2YDiff).toBeLessThan(250);

    const splitX = splitNode.x!;
    const t1X = t1Node.x!;
    const t2X = t2Node.x!;
    expect(Math.abs(splitX - startNode.x!)).toBeLessThan(10);
    expect(Math.abs(mergeNode.x! - finalizeNode.x!)).toBeLessThan(10);

    const splitToStartDistance = Math.sqrt(
      Math.pow(splitNode.x! - startNode.x!, 2) + Math.pow(splitNode.y! - startNode.y!, 2)
    );
    const mergeToFinalizeDistance = Math.sqrt(
      Math.pow(mergeNode.x! - finalizeNode.x!, 2) + Math.pow(mergeNode.y! - finalizeNode.y!, 2)
    );

    expect(splitToStartDistance).toBeGreaterThan(100);
    expect(mergeToFinalizeDistance).toBeGreaterThan(100);

    const avgT1T2Y = (t1Node.y! + t2Node.y!) / 2;
    const splitYCentrality = Math.abs(splitNode.y! - avgT1T2Y);
    expect(splitYCentrality).toBeLessThan(200);
  });
});
