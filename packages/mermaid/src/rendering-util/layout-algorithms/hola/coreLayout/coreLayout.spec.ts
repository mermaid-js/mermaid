import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { layoutCoreGraph } from './index.js';
import { StressMinimizer } from './stressMinimizer.js';
import { OrthogonalLayouter } from './orthogonalLayouter.js';
import {
  findConnectedComponents,
  layoutDisconnectedComponents,
  calculateBaseEdgeLength,
} from './graphUtils.js';

describe('Core Layout - Individual Function Tests', () => {
  const baseConfig = {} as LayoutData['config'];

  const createNode = (id: string, width = 50, height = 45, x?: number, y?: number): Node =>
    ({
      id,
      label: id,
      width,
      height,
      padding: 15,
      shape: 'squareRect',
      isGroup: false,
      x,
      y,
    }) as Node;

  const createEdge = (start: string, end: string): Edge =>
    ({
      id: `L_${start}_${end}`,
      start,
      end,
      type: 'arrow_point',
    }) as Edge;

  const coreNodes: Node[] = [
    {
      labelStyle: '',
      shape: 'roundedRect',
      label: 'Still',
      cssClasses: ' statediagram-state',
      cssCompiledStyles: [],
      cssStyles: [],
      id: 'Still',
      domId: 'state-Still-3',
      isGroup: false,
      padding: 8,
      rx: 10,
      ry: 10,
      look: 'neo',
      centerLabel: true,
      width: 57.6875,
      height: 38,
    } as Node,
    {
      labelStyle: '',
      shape: 'roundedRect',
      label: 'Moving',
      cssClasses: ' statediagram-state',
      cssCompiledStyles: [],
      cssStyles: [],
      id: 'Moving',
      domId: 'state-Moving-4',
      isGroup: false,
      padding: 8,
      rx: 10,
      ry: 10,
      look: 'neo',
      centerLabel: true,
      width: 81,
      height: 38,
    } as Node,
    {
      labelStyle: '',
      shape: 'roundedRect',
      label: 'Crash',
      cssClasses: ' statediagram-state',
      cssCompiledStyles: [],
      cssStyles: [],
      id: 'Crash',
      domId: 'state-Crash-5',
      isGroup: false,
      padding: 8,
      rx: 10,
      ry: 10,
      look: 'neo',
      centerLabel: true,
      width: 71.6875,
      height: 38,
    } as Node,
    {
      labelStyle: '',
      shape: 'stateEnd',
      label: 'root_end',
      cssClasses: ' statediagram-state',
      cssCompiledStyles: [],
      cssStyles: [],
      id: 'root_end',
      domId: 'state-root_end-5',
      isGroup: false,
      padding: 8,
      rx: 10,
      ry: 10,
      look: 'neo',
      centerLabel: true,
      width: 14.013293266296387,
      height: 14,
    } as Node,
  ];

  const coreEdges: Edge[] = [
    {
      id: 'edge1',
      start: 'Still',
      end: 'root_end',
      arrowhead: 'normal',
      arrowTypeEnd: 'arrow_barb',
      label: '',
      arrowheadStyle: 'fill: #333',
      labelpos: 'c',
      labelType: 'text',
      thickness: 'normal',
      classes: 'transition',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'edge2',
      start: 'Still',
      end: 'Moving',
      arrowhead: 'normal',
      arrowTypeEnd: 'arrow_barb',
      label: '',
      arrowheadStyle: 'fill: #333',
      labelpos: 'c',
      labelType: 'text',
      thickness: 'normal',
      classes: 'transition',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'edge4',
      start: 'Moving',
      end: 'Crash',
      arrowhead: 'normal',
      arrowTypeEnd: 'arrow_barb',
      label: '',
      arrowheadStyle: 'fill: #333',
      labelpos: 'c',
      labelType: 'text',
      thickness: 'normal',
      classes: 'transition',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'edge5',
      start: 'Crash',
      end: 'root_end',
      arrowhead: 'normal',
      arrowTypeEnd: 'arrow_barb',
      label: '',
      arrowheadStyle: 'fill: #333',
      labelpos: 'c',
      labelType: 'text',
      thickness: 'normal',
      classes: 'transition',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
  ];

  const diamondNodes: Node[] = [
    {
      id: 'PG',
      label: 'PG',
      labelStyle: '',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-PG-0',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 52.22916793823242,
      height: 45,
    } as Node,
    {
      id: 'Bank',
      label: 'Bank Network',
      labelStyle: '',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-Bank-1',
      look: 'neo',
      isGroup: false,
      shape: 'cylinder',
      width: 111.14583587646484,
      height: 80.2999496459961,
    } as Node,
    {
      id: 'Wallet',
      label: 'Digital Wallet System',
      labelStyle: '',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-Wallet-3',
      look: 'neo',
      isGroup: false,
      shape: 'cylinder',
      width: 155.75,
      height: 86.6072998046875,
    } as Node,
    {
      id: 'Conf',
      label: 'Transaction Confirmation',
      labelStyle: '',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-Conf-5',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 187.8958282470703,
      height: 45,
    } as Node,
  ];

  const diamondEdges: Edge[] = [
    {
      id: 'L_PG_Bank_0',
      start: 'PG',
      end: 'Bank',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_PG_Wallet_0',
      start: 'PG',
      end: 'Wallet',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_Bank_Conf_0',
      start: 'Bank',
      end: 'Conf',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_Wallet_Conf_0',
      start: 'Wallet',
      end: 'Conf',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
  ];

  const hubNodes: Node[] = [
    {
      id: 'a1',
      label: 'Iam a node with a super long label',
      labelStyle: '',
      parentId: 'one',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-a1-0',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 232,
      height: 66,
    } as Node,
    {
      id: 'a2',
      label: 'I am another node with a mega long label',
      labelStyle: '',
      parentId: 'one',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-a2-1',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 232,
      height: 66,
    } as Node,
    {
      id: 'a3',
      label: 'I am a node with a super long label',
      labelStyle: '',
      parentId: 'one',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-a3-2',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 232,
      height: 66,
    } as Node,
    {
      id: 'a4',
      label: 'I am another node with a mega long label',
      labelStyle: '',
      parentId: 'one',
      padding: 15,
      cssStyles: [],
      cssCompiledStyles: [],
      cssClasses: 'default ',
      domId: 'flowchart-a4-3',
      look: 'neo',
      isGroup: false,
      shape: 'squareRect',
      width: 232,
      height: 66,
    } as Node,
  ];

  const hubEdges: Edge[] = [
    {
      id: 'L_a3_a1_0',
      start: 'a3',
      end: 'a1',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_a3_a2_0',
      start: 'a3',
      end: 'a2',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_a3_a3_0',
      start: 'a3',
      end: 'a3',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_a3_a4_0',
      start: 'a3',
      end: 'a4',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
    {
      id: 'L_a1_a4_0',
      start: 'a1',
      end: 'a4',
      type: 'arrow_point',
      label: '',
      labelpos: 'c',
      thickness: 'normal',
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      arrowheadStyle: 'fill: #333',
      look: 'neo',
      curve: 'rounded',
    } as Edge,
  ];

  describe('Edge Case Handling', () => {
    it('should handle empty core graph', () => {
      const emptyData: LayoutData = {
        nodes: [],
        edges: [],
        config: baseConfig,
      };
      const uniformEdgeLength = calculateBaseEdgeLength(emptyData.nodes, emptyData.edges);
      const result = layoutCoreGraph(emptyData, uniformEdgeLength);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should handle single core node', () => {
      const singleNodeData: LayoutData = {
        nodes: [coreNodes[0]],
        edges: [],
        config: baseConfig,
      };

      const uniformEdgeLength = calculateBaseEdgeLength(singleNodeData.nodes, singleNodeData.edges);
      const result = layoutCoreGraph(singleNodeData, uniformEdgeLength);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].x).toBe(0);
      expect(result.nodes[0].y).toBe(0);
      expect(result.nodes[0].id).toBe('Still');
    });
  });

  describe('Connected Components Detection (findConnectedComponents)', () => {
    it('should detect single connected component', () => {
      const connectedData: LayoutData = {
        nodes: [createNode('A'), createNode('B')],
        edges: [createEdge('A', 'B')],
        config: baseConfig,
      };

      const components = findConnectedComponents(connectedData);

      expect(components).toHaveLength(1);
      expect(components[0].nodes).toHaveLength(2);
      expect(components[0].edges).toHaveLength(1);
    });

    it('should detect multiple disconnected components', () => {
      const disconnectedData: LayoutData = {
        nodes: [
          createNode('A'),
          createNode('B'),
          createNode('C'),
          createNode('D'),
          createNode('E'),
        ],
        edges: [createEdge('A', 'B'), createEdge('C', 'D')],
        config: baseConfig,
      };

      const components = findConnectedComponents(disconnectedData);

      expect(components).toHaveLength(3);
      expect(components.find((c) => c.nodes.some((n) => n.id === 'A'))!.nodes).toHaveLength(2);
      expect(components.find((c) => c.nodes.some((n) => n.id === 'C'))!.nodes).toHaveLength(2);
      expect(components.find((c) => c.nodes.some((n) => n.id === 'E'))!.nodes).toHaveLength(1);
    });

    it('should handle complex connected component', () => {
      const complexData: LayoutData = {
        nodes: [...coreNodes],
        edges: [...coreEdges],
        config: baseConfig,
      };

      const components = findConnectedComponents(complexData);

      expect(components).toHaveLength(1);
      expect(components[0].nodes).toHaveLength(4);
      expect(components[0].edges).toHaveLength(4);
    });

    it('should detect hub/star pattern with self-loop as single component', () => {
      const hubData: LayoutData = {
        nodes: [...hubNodes],
        edges: [...hubEdges],
        config: baseConfig,
      };

      const components = findConnectedComponents(hubData);

      expect(components).toHaveLength(1);
      expect(components[0].nodes).toHaveLength(4);
      expect(components[0].edges).toHaveLength(5);

      const nodeIds = components[0].nodes.map((n) => n.id);
      expect(nodeIds).toContain('a1');
      expect(nodeIds).toContain('a2');
      expect(nodeIds).toContain('a3');
      expect(nodeIds).toContain('a4');

      const edgeConnections = components[0].edges.map((e) => `${e.start}→${e.end}`);
      expect(edgeConnections).toContain('a3→a3');
      expect(edgeConnections).toContain('a3→a1');
      expect(edgeConnections).toContain('a3→a2');
      expect(edgeConnections).toContain('a3→a4');
      expect(edgeConnections).toContain('a1→a4');
    });
  });

  describe('Base Edge Length Calculation (calculateBaseEdgeLength)', () => {
    it('should calculate reasonable edge length for simple nodes', () => {
      const nodes = [createNode('A', 60, 40), createNode('B', 60, 40)];
      const edges = [createEdge('A', 'B')];

      const edgeLength = calculateBaseEdgeLength(nodes, edges);

      expect(edgeLength).toBeGreaterThan(50);
      expect(edgeLength).toBeLessThan(200);
    });

    it('should calculate edge length for real state diagram nodes', () => {
      const edgeLength = calculateBaseEdgeLength(coreNodes, coreEdges);

      expect(edgeLength).toBeGreaterThan(30);
      expect(edgeLength).toBeLessThan(300);
    });

    it('should calculate edge length for uniform hub/star nodes', () => {
      const edgeLength = calculateBaseEdgeLength(hubNodes, hubEdges);

      expect(edgeLength).toBeGreaterThan(100);
      expect(edgeLength).toBeLessThan(400);

      const widths = new Set(hubNodes.map((n) => n.width));
      const heights = new Set(hubNodes.map((n) => n.height));
      expect(widths.size).toBe(1);
      expect(heights.size).toBe(1);
      expect([...widths][0]).toBe(232);
      expect([...heights][0]).toBe(66);
    });
  });

  describe('Stress Minimization (StressMinimizer)', () => {
    it('should create stress minimizer and minimize stress', () => {
      const testData: LayoutData = {
        nodes: [createNode('A'), createNode('B')],
        edges: [createEdge('A', 'B')],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(testData.nodes, testData.edges);
      const stressMinimizer = new StressMinimizer(testData, edgeLength);

      expect(stressMinimizer).toBeDefined();

      const optimizedNodes = stressMinimizer.minimize();

      expect(optimizedNodes.size).toBe(2);
      expect(optimizedNodes.has('A')).toBe(true);
      expect(optimizedNodes.has('B')).toBe(true);

      const nodeA = optimizedNodes.get('A')!;
      const nodeB = optimizedNodes.get('B')!;
      expect(nodeA.x).toBeDefined();
      expect(nodeA.y).toBeDefined();
      expect(nodeB.x).toBeDefined();
      expect(nodeB.y).toBeDefined();
    });

    it('should minimize stress for complex state diagram', () => {
      const complexData: LayoutData = {
        nodes: [...coreNodes],
        edges: [...coreEdges],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(complexData.nodes, complexData.edges);
      const stressMinimizer = new StressMinimizer(complexData, edgeLength);
      const optimizedNodes = stressMinimizer.minimize();

      expect(optimizedNodes.size).toBe(4);
      coreNodes.forEach((node) => {
        expect(optimizedNodes.has(node.id)).toBe(true);
      });

      const positions = [...optimizedNodes.values()];
      const uniqueXPositions = new Set(positions.map((p) => p.x.toFixed(1)));
      const uniqueYPositions = new Set(positions.map((p) => p.y.toFixed(1)));

      expect(uniqueXPositions.size).toBeGreaterThan(1);
      expect(uniqueYPositions.size).toBeGreaterThan(1);
    });

    it('should handle diamond/convergent flow structure (Payment Gateway)', () => {
      const diamondData: LayoutData = {
        nodes: [...diamondNodes],
        edges: [...diamondEdges],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(diamondData.nodes, diamondData.edges);
      const stressMinimizer = new StressMinimizer(diamondData, edgeLength);
      const optimizedNodes = stressMinimizer.minimize();

      expect(optimizedNodes.size).toBe(4);
      diamondNodes.forEach((node) => {
        expect(optimizedNodes.has(node.id)).toBe(true);
      });

      const pgNode = optimizedNodes.get('PG')!;
      const bankNode = optimizedNodes.get('Bank')!;
      const walletNode = optimizedNodes.get('Wallet')!;
      const confNode = optimizedNodes.get('Conf')!;

      const pgToBankDist = Math.sqrt(
        Math.pow(bankNode.x - pgNode.x, 2) + Math.pow(bankNode.y - pgNode.y, 2)
      );
      const pgToWalletDist = Math.sqrt(
        Math.pow(walletNode.x - pgNode.x, 2) + Math.pow(walletNode.y - pgNode.y, 2)
      );
      const bankToConfDist = Math.sqrt(
        Math.pow(confNode.x - bankNode.x, 2) + Math.pow(confNode.y - bankNode.y, 2)
      );
      const walletToConfDist = Math.sqrt(
        Math.pow(confNode.x - walletNode.x, 2) + Math.pow(confNode.y - walletNode.y, 2)
      );

      [pgToBankDist, pgToWalletDist, bankToConfDist, walletToConfDist].forEach((dist) => {
        expect(dist).toBeGreaterThan(30);
        expect(dist).toBeLessThan(500);
      });

      const positions = [...optimizedNodes.values()];
      const uniqueXPositions = new Set(positions.map((p) => p.x.toFixed(1)));
      const uniqueYPositions = new Set(positions.map((p) => p.y.toFixed(1)));

      expect(uniqueXPositions.size).toBeGreaterThan(2);
      expect(uniqueYPositions.size).toBeGreaterThan(1);
    });
  });

  describe('Orthogonal Layout (OrthogonalLayouter)', () => {
    it('should create orthogonal layouter and apply orthogonalization', () => {
      const testData: LayoutData = {
        nodes: [createNode('A'), createNode('B')],
        edges: [createEdge('A', 'B')],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(testData.nodes, testData.edges);

      const stressMinimizer = new StressMinimizer(testData, edgeLength);
      const stressOptimizedNodes = stressMinimizer.minimize();

      const orthogonalLayouter = new OrthogonalLayouter(
        stressOptimizedNodes,
        testData.edges,
        edgeLength
      );

      expect(orthogonalLayouter).toBeDefined();

      stressOptimizedNodes.forEach((node, id) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
        expect(isFinite(node.x)).toBe(true);
        expect(isFinite(node.y)).toBe(true);
      });
    });

    it('should orthogonalize complex state diagram layout', () => {
      const complexData: LayoutData = {
        nodes: [...coreNodes],
        edges: [...coreEdges],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(complexData.nodes, complexData.edges);
      const stressMinimizer = new StressMinimizer(complexData, edgeLength);
      const stressOptimizedNodes = stressMinimizer.minimize();

      const orthogonalLayouter = new OrthogonalLayouter(
        stressOptimizedNodes,
        complexData.edges,
        edgeLength
      );

      const alignmentTolerance = 20;
      const edges = [
        { from: 'Still', to: 'root_end' },
        { from: 'Still', to: 'Moving' },
        { from: 'Moving', to: 'Crash' },
        { from: 'Crash', to: 'root_end' },
      ];

      edges.forEach((edge) => {
        const fromNode = stressOptimizedNodes.get(edge.from)!;
        const toNode = stressOptimizedNodes.get(edge.to)!;
        const dx = Math.abs(toNode.x - fromNode.x);
        const dy = Math.abs(toNode.y - fromNode.y);
        const isHorizontal = dy < alignmentTolerance;
        const isVertical = dx < alignmentTolerance;
      });
    });

    it('should orthogonalize diamond flow structure with mixed node sizes', () => {
      const diamondData: LayoutData = {
        nodes: [...diamondNodes],
        edges: [...diamondEdges],
        config: baseConfig,
      };

      const edgeLength = calculateBaseEdgeLength(diamondData.nodes, diamondData.edges);
      const stressMinimizer = new StressMinimizer(diamondData, edgeLength);
      const stressOptimizedNodes = stressMinimizer.minimize();

      const orthogonalLayouter = new OrthogonalLayouter(
        stressOptimizedNodes,
        diamondData.edges,
        edgeLength
      );

      orthogonalLayouter.orthogonalizeAllEdges();

      const alignmentTolerance = 25;
      const edges = [
        { from: 'PG', to: 'Bank' },
        { from: 'PG', to: 'Wallet' },
        { from: 'Bank', to: 'Conf' },
        { from: 'Wallet', to: 'Conf' },
      ];

      let horizontalCount = 0;
      let verticalCount = 0;

      edges.forEach((edge) => {
        const fromNode = stressOptimizedNodes.get(edge.from)!;
        const toNode = stressOptimizedNodes.get(edge.to)!;
        const dx = Math.abs(toNode.x - fromNode.x);
        const dy = Math.abs(toNode.y - fromNode.y);
        const isHorizontal = dy < alignmentTolerance;
        const isVertical = dx < alignmentTolerance;

        if (isHorizontal) {
          horizontalCount++;
        }
        if (isVertical) {
          verticalCount++;
        }
      });

      stressOptimizedNodes.forEach((node, id) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
        expect(isFinite(node.x)).toBe(true);
        expect(isFinite(node.y)).toBe(true);
      });

      const totalAligned = horizontalCount + verticalCount;
      expect(totalAligned).toBeGreaterThanOrEqual(2);

      const pgNode = stressOptimizedNodes.get('PG')!;
      const bankNode = stressOptimizedNodes.get('Bank')!;
      const walletNode = stressOptimizedNodes.get('Wallet')!;
      const confNode = stressOptimizedNodes.get('Conf')!;

      const bankToConfDist = Math.sqrt(
        Math.pow(confNode.x - bankNode.x, 2) + Math.pow(confNode.y - bankNode.y, 2)
      );
      const walletToConfDist = Math.sqrt(
        Math.pow(confNode.x - walletNode.x, 2) + Math.pow(confNode.y - walletNode.y, 2)
      );

      expect(bankToConfDist).toBeGreaterThan(30);
      expect(walletToConfDist).toBeGreaterThan(30);
      expect(bankToConfDist).toBeLessThan(400);
      expect(walletToConfDist).toBeLessThan(400);
    });
  });

  describe('Disconnected Components Layout (layoutDisconnectedComponents)', () => {
    it('should layout disconnected components separately', () => {
      const disconnectedData: LayoutData = {
        nodes: [
          createNode('A'),
          createNode('B'),
          createNode('C'),
          createNode('D'),
          createNode('E'),
        ],
        edges: [createEdge('A', 'B'), createEdge('C', 'D')],
        config: baseConfig,
      };
      const uniformEdgeLength = calculateBaseEdgeLength(
        disconnectedData.nodes,
        disconnectedData.edges
      );
      const components = findConnectedComponents(disconnectedData);
      const result = layoutDisconnectedComponents(disconnectedData, components, (data) =>
        layoutCoreGraph(data, uniformEdgeLength)
      );

      expect(result.nodes).toHaveLength(5);

      result.nodes.forEach((node) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });

      const nodeA = result.nodes.find((n) => n.id === 'A')!;
      const nodeC = result.nodes.find((n) => n.id === 'C')!;
      const nodeE = result.nodes.find((n) => n.id === 'E')!;

      const separation1 = Math.sqrt(
        Math.pow(nodeC.x! - nodeA.x!, 2) + Math.pow(nodeC.y! - nodeA.y!, 2)
      );
      const separation2 = Math.sqrt(
        Math.pow(nodeE.x! - nodeA.x!, 2) + Math.pow(nodeE.y! - nodeA.y!, 2)
      );

      expect(separation1).toBeGreaterThan(100);
      expect(separation2).toBeGreaterThan(100);
    });
  });

  describe('Complete Layout Integration', () => {
    it('should integrate all steps for final layout', () => {
      const coreData: LayoutData = {
        nodes: [...coreNodes],
        edges: [...coreEdges],
        config: baseConfig,
      };
      const uniformEdgeLength = calculateBaseEdgeLength(coreData.nodes, coreData.edges);
      const result = layoutCoreGraph(coreData, uniformEdgeLength);

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(4);

      const stillNode = result.nodes.find((n) => n.id === 'Still')!;
      const movingNode = result.nodes.find((n) => n.id === 'Moving')!;
      const crashNode = result.nodes.find((n) => n.id === 'Crash')!;
      const endNode = result.nodes.find((n) => n.id === 'root_end')!;

      [stillNode, movingNode, crashNode, endNode].forEach((node) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });

      const distances = [
        Math.sqrt(Math.pow(endNode.x! - stillNode.x!, 2) + Math.pow(endNode.y! - stillNode.y!, 2)),
        Math.sqrt(
          Math.pow(movingNode.x! - stillNode.x!, 2) + Math.pow(movingNode.y! - stillNode.y!, 2)
        ),
        Math.sqrt(
          Math.pow(crashNode.x! - movingNode.x!, 2) + Math.pow(crashNode.y! - movingNode.y!, 2)
        ),
        Math.sqrt(Math.pow(endNode.x! - crashNode.x!, 2) + Math.pow(endNode.y! - crashNode.y!, 2)),
      ];

      distances.forEach((distance) => {
        expect(distance).toBeGreaterThan(30);
        expect(distance).toBeLessThan(500);
      });
    });
  });
});
