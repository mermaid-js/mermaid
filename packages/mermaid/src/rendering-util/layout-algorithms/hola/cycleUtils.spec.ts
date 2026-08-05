import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { detectCycleEdges, removeCycleEdges } from './cycleUtils.js';
import { getTrueSubgraphs, isTrueSubgraph } from './reRenderUtil.js';

describe('cycleUtils - Cycle Detection and Removal', () => {
  const baseConfig = {} as LayoutData['config'];

  it('should detect cycle edges in network infrastructure flowchart', () => {
    const nodes: Node[] = [
      {
        id: 'project',
        isGroup: true,
        label: 'project',
        parentId: undefined,
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'subnet2',
        x: 156.75,
        y: 75,
        width: 153.5,
        height: 255,
        isGroup: true,
        label: 'subnet2',
        parentId: 'project',
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'subnet1',
        x: 156.75,
        y: 75,
        width: 153.5,
        height: 255,
        isGroup: true,
        label: 'subnet1',
        parentId: 'project',
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'internet',
        width: 78.70833587646484,
        height: 45,
        isGroup: false,
        label: 'internet',
        parentId: undefined,
        shape: 'squareRect',
      } as Node,
      {
        id: 'nat',
        width: 51.47916793823242,
        height: 45,
        isGroup: false,
        label: 'nat',
        parentId: 'project',
        shape: 'squareRect',
      } as Node,
      {
        id: 'routeur',
        width: 76.375,
        height: 45,
        isGroup: false,
        label: 'routeur',
        parentId: 'project',
        shape: 'squareRect',
      } as Node,
      {
        id: 'lb1',
        x: 156.75,
        y: 0,
        width: 50.6875,
        height: 45,
        isGroup: false,
        label: 'lb1',
        parentId: 'subnet1',
        shape: 'squareRect',
      } as Node,
      {
        id: 'lb2',
        x: 156.75,
        y: 0,
        width: 50.6875,
        height: 45,
        isGroup: false,
        label: 'lb2',
        parentId: 'subnet2',
        shape: 'squareRect',
      } as Node,
      {
        id: 'compute1',
        x: 156.75,
        y: 150,
        width: 93.5,
        height: 45,
        isGroup: false,
        label: 'compute1',
        parentId: 'subnet1',
        shape: 'squareRect',
      } as Node,
      {
        id: 'compute2',
        x: 156.75,
        y: 150,
        width: 93.5,
        height: 45,
        isGroup: false,
        label: 'compute2',
        parentId: 'subnet2',
        shape: 'squareRect',
      } as Node,
    ];

    const edges: Edge[] = [
      {
        id: 'L_internet_routeur_0',
        start: 'internet',
        end: 'routeur',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_routeur_subnet1_0',
        start: 'routeur',
        end: 'subnet1',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_routeur_subnet2_0',
        start: 'routeur',
        end: 'subnet2',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_subnet1_nat_0',
        start: 'subnet1',
        end: 'nat',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_subnet2_nat_0',
        start: 'subnet2',
        end: 'nat',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_nat_internet_0',
        start: 'nat',
        end: 'internet',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const cycleEdges = detectCycleEdges(layoutData);

    expect(cycleEdges.length).toBe(2);

    const subnet1ToNatCycle = cycleEdges.find((e) => e.id === 'L_subnet1_nat_0');
    expect(subnet1ToNatCycle).toBeDefined();
    expect(subnet1ToNatCycle?.start).toBe('subnet1');
    expect(subnet1ToNatCycle?.end).toBe('nat');

    const routeurToSubnet2Cycle = cycleEdges.find((e) => e.id === 'L_routeur_subnet2_0');
    expect(routeurToSubnet2Cycle).toBeDefined();
    expect(routeurToSubnet2Cycle?.start).toBe('routeur');
    expect(routeurToSubnet2Cycle?.end).toBe('subnet2');
  });

  it('should remove cycle edges from network infrastructure flowchart', () => {
    const nodes: Node[] = [
      {
        id: 'project',
        isGroup: true,
        label: 'project',
        parentId: undefined,
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'subnet2',
        x: 156.75,
        y: 75,
        width: 153.5,
        height: 255,
        isGroup: true,
        label: 'subnet2',
        parentId: 'project',
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'subnet1',
        x: 156.75,
        y: 75,
        width: 153.5,
        height: 255,
        isGroup: true,
        label: 'subnet1',
        parentId: 'project',
        shape: 'rect',
        padding: 8,
      } as Node,
      {
        id: 'internet',
        width: 78.70833587646484,
        height: 45,
        isGroup: false,
        label: 'internet',
        parentId: undefined,
        shape: 'squareRect',
      } as Node,
      {
        id: 'nat',
        width: 51.47916793823242,
        height: 45,
        isGroup: false,
        label: 'nat',
        parentId: 'project',
        shape: 'squareRect',
      } as Node,
      {
        id: 'routeur',
        width: 76.375,
        height: 45,
        isGroup: false,
        label: 'routeur',
        parentId: 'project',
        shape: 'squareRect',
      } as Node,
      {
        id: 'lb1',
        x: 156.75,
        y: 0,
        width: 50.6875,
        height: 45,
        isGroup: false,
        label: 'lb1',
        parentId: 'subnet1',
        shape: 'squareRect',
      } as Node,
      {
        id: 'lb2',
        x: 156.75,
        y: 0,
        width: 50.6875,
        height: 45,
        isGroup: false,
        label: 'lb2',
        parentId: 'subnet2',
        shape: 'squareRect',
      } as Node,
      {
        id: 'compute1',
        x: 156.75,
        y: 150,
        width: 93.5,
        height: 45,
        isGroup: false,
        label: 'compute1',
        parentId: 'subnet1',
        shape: 'squareRect',
      } as Node,
      {
        id: 'compute2',
        x: 156.75,
        y: 150,
        width: 93.5,
        height: 45,
        isGroup: false,
        label: 'compute2',
        parentId: 'subnet2',
        shape: 'squareRect',
      } as Node,
    ];

    const edges: Edge[] = [
      {
        id: 'L_internet_routeur_0',
        start: 'internet',
        end: 'routeur',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_routeur_subnet1_0',
        start: 'routeur',
        end: 'subnet1',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_routeur_subnet2_0',
        start: 'routeur',
        end: 'subnet2',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_subnet1_nat_0',
        start: 'subnet1',
        end: 'nat',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_subnet2_nat_0',
        start: 'subnet2',
        end: 'nat',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      {
        id: 'L_nat_internet_0',
        start: 'nat',
        end: 'internet',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const originalEdgeCount = layoutData.edges.length;

    const removedCycleEdges = removeCycleEdges(layoutData);

    expect(removedCycleEdges.length).toBe(2);
    expect(layoutData.edges.length).toBe(originalEdgeCount - 2);

    expect(layoutData.edges.find((e) => e.id === 'L_subnet1_nat_0')).toBeUndefined();
    expect(layoutData.edges.find((e) => e.id === 'L_routeur_subnet2_0')).toBeUndefined();

    expect(layoutData.edges.find((e) => e.id === 'L_internet_routeur_0')).toBeDefined();
    expect(layoutData.edges.find((e) => e.id === 'L_nat_internet_0')).toBeDefined();

    expect(removedCycleEdges.find((e) => e.id === 'L_subnet1_nat_0')).toBeDefined();
    expect(removedCycleEdges.find((e) => e.id === 'L_routeur_subnet2_0')).toBeDefined();
  });

  it('should return empty array for acyclic graph', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false } as Node,
      { id: 'B', isGroup: false } as Node,
      { id: 'C', isGroup: false } as Node,
    ];

    const edges: Edge[] = [
      { id: 'E1', start: 'A', end: 'B', type: 'arrow_point', isUserDefinedId: false },
      { id: 'E2', start: 'B', end: 'C', type: 'arrow_point', isUserDefinedId: false },
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const cycleEdges = detectCycleEdges(layoutData);

    expect(cycleEdges.length).toBe(0);
  });

  it('should ignore self-loop edges', () => {
    const nodes: Node[] = [
      { id: 'A', isGroup: false } as Node,
      { id: 'B', isGroup: false } as Node,
    ];

    const edges: Edge[] = [
      { id: 'E1', start: 'A', end: 'B', type: 'arrow_point', isUserDefinedId: false },
      { id: 'E2', start: 'A', end: 'A', type: 'arrow_point', isUserDefinedId: false }, // Self-loop
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const cycleEdges = detectCycleEdges(layoutData);

    expect(cycleEdges.length).toBe(0);
  });

  it('should detect and remove cycle edge c->a from simple cycle', () => {
    const nodes: Node[] = [
      {
        id: 'a',
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'a',
        shape: 'squareRect',
      } as Node,
      {
        id: 'b',
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'b',
        shape: 'squareRect',
      } as Node,
      { id: 'c', width: 39, height: 45, isGroup: false, label: 'c', shape: 'squareRect' } as Node,
      {
        id: 'd',
        width: 39.79166793823242,
        height: 45,
        isGroup: false,
        label: 'd',
        shape: 'squareRect',
      } as Node,
    ];

    const edges: Edge[] = [
      { id: 'L_a_b_0', start: 'a', end: 'b', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_b_c_0', start: 'b', end: 'c', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_b_d_0', start: 'b', end: 'd', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_c_a_0', start: 'c', end: 'a', type: 'arrow_point', isUserDefinedId: false }, // CYCLE EDGE
    ];

    const layoutData: LayoutData = {
      nodes,
      edges,
      config: baseConfig,
    };

    const cycleEdges = detectCycleEdges({ ...layoutData });

    expect(cycleEdges.length).toBe(1);
    const detectedEdge = cycleEdges[0];

    expect(detectedEdge.id).toBe('L_c_a_0');
    expect(detectedEdge.start).toBe('c');
    expect(detectedEdge.end).toBe('a');
    expect(detectedEdge.type).toBe('arrow_point');

    const originalEdgeCount = layoutData.edges.length;
    const removedEdges = removeCycleEdges(layoutData);

    expect(layoutData.edges.length).toBe(originalEdgeCount - 1);
    expect(layoutData.edges.find((e) => e.id === 'L_c_a_0')).toBeUndefined();

    const removedEdge = removedEdges.find((e) => e.id === 'L_c_a_0');
    expect(removedEdge).toBeDefined();

    expect(layoutData.edges.find((e) => e.id === 'L_b_d_0')).toBeDefined();
  });
});

describe('True Subgraph Detection', () => {
  const baseConfig = {} as LayoutData['config'];

  it('should identify that subGraph0 is NOT a true subgraph in the CI/CD pipeline', () => {
    const nodes: Node[] = [
      { id: 'subGraph0', isGroup: true, parentId: undefined } as Node,
      { id: 'A', parentId: undefined } as Node,
      { id: 'B', parentId: undefined } as Node,
      { id: 'C', parentId: undefined } as Node,
      { id: 'D', parentId: undefined } as Node,
      { id: 'E', parentId: undefined } as Node,
      { id: 'F', parentId: 'subGraph0' } as Node,
      { id: 'G', parentId: 'subGraph0' } as Node,
      { id: 'H', parentId: 'subGraph0' } as Node,
      { id: 'I', parentId: 'subGraph0' } as Node,
      { id: 'J', parentId: 'subGraph0' } as Node,
      { id: 'K', parentId: 'subGraph0' } as Node,
      { id: 'L', parentId: undefined } as Node,
      { id: 'label-DE', isLabelNode: true, parentId: undefined } as Node,
      { id: 'label-DF', isLabelNode: true, parentId: undefined } as Node, // External to subGraph0
      { id: 'label-IJ', isLabelNode: true, parentId: 'subGraph0' } as Node,
      { id: 'label-IK', isLabelNode: true, parentId: 'subGraph0' } as Node,
    ];

    const edges: Edge[] = [
      { id: 'L_A_B_0', start: 'A', end: 'B', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_B_C_0', start: 'B', end: 'C', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_C_D_0', start: 'C', end: 'D', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_E_A_0', start: 'E', end: 'A', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_F_G_0', start: 'F', end: 'G', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_G_H_0', start: 'G', end: 'H', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_H_I_0', start: 'H', end: 'I', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_K_L_0', start: 'K', end: 'L', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_D_E_to', start: 'D', end: 'label-DE', type: 'arrow_point', isUserDefinedId: false },
      {
        id: 'L_D_E_from',
        start: 'label-DE',
        end: 'E',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      { id: 'L_D_F_to', start: 'D', end: 'label-DF', type: 'arrow_point', isUserDefinedId: false },
      {
        id: 'L_D_F_from',
        start: 'label-DF',
        end: 'F',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      { id: 'L_I_J_to', start: 'I', end: 'label-IJ', type: 'arrow_point', isUserDefinedId: false },
      {
        id: 'L_I_J_from',
        start: 'label-IJ',
        end: 'J',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
      { id: 'L_I_K_to', start: 'I', end: 'label-IK', type: 'arrow_point', isUserDefinedId: false },
      {
        id: 'L_I_K_from',
        start: 'label-IK',
        end: 'K',
        type: 'arrow_point',
        isUserDefinedId: false,
      },
    ];

    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    expect(isTrueSubgraph(layoutData, 'subGraph0')).toBe(false);
    expect(getTrueSubgraphs(layoutData).map((sg) => sg.id)).not.toContain('subGraph0');
  });

  it('should identify a subgraph with only internal edges as a true subgraph', () => {
    const nodes: Node[] = [
      { id: 'sg1', isGroup: true, parentId: undefined } as Node,
      { id: 'n1', parentId: 'sg1' } as Node,
      { id: 'n2', parentId: 'sg1' } as Node,
      { id: 'n3', parentId: undefined } as Node,
    ];

    const edges: Edge[] = [
      { id: 'e1', start: 'n1', end: 'n2', type: 'arrow_point', isUserDefinedId: false }, // Internal to sg1
    ];

    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    expect(isTrueSubgraph(layoutData, 'sg1')).toBe(true);
    const trueSgs = getTrueSubgraphs(layoutData);
    expect(trueSgs.length).toBe(1);
    expect(trueSgs[0].id).toBe('sg1');
  });

  it('should return false for a subgraph with no children', () => {
    const nodes: Node[] = [
      { id: 'sgEmpty', isGroup: true, parentId: undefined } as Node,
      { id: 'n1', parentId: undefined } as Node,
    ];
    const edges: Edge[] = [];
    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    expect(isTrueSubgraph(layoutData, 'sgEmpty')).toBe(false);
  });

  it('should return true for a subgraph with children but no edges at all', () => {
    const nodes: Node[] = [
      { id: 'sgIso', isGroup: true, parentId: undefined } as Node,
      { id: 'n1', parentId: 'sgIso' } as Node,
      { id: 'n2', parentId: 'sgIso' } as Node,
    ];
    const edges: Edge[] = [];
    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    expect(isTrueSubgraph(layoutData, 'sgIso')).toBe(true);
  });

  it('should identify 8 true subgraphs in the complex dashboard layout', () => {
    const nodes: Node[] = [
      { id: 's6', isGroup: true, parentId: undefined } as Node,
      { id: 's5', isGroup: true, parentId: undefined } as Node,
      { id: 's7', isGroup: true, parentId: undefined } as Node,
      { id: 's4', isGroup: true, parentId: 's7' } as Node,
      { id: 's3-3', isGroup: true, parentId: 's7' } as Node,
      { id: 's3-2', isGroup: true, parentId: 's7' } as Node,
      { id: 's3-1', isGroup: true, parentId: 's7' } as Node,
      { id: 's1', isGroup: true, parentId: undefined } as Node,

      { id: 'Confluence-Plugin', parentId: 's1' } as Node,
      { id: 'VS-Code-Plugin', parentId: 's1' } as Node,
      { id: 'Google-Plugin', parentId: 's1' } as Node,
      { id: 'Jira-Plugin', parentId: 's1' } as Node,
      { id: 'JetBrains-Plugin', parentId: 's1' } as Node,
      { id: 'Office-Plugin', parentId: 's1' } as Node,
      { id: 'GPT-ForChatGPT', parentId: 's1' } as Node,
      { id: 'GitHub-App', parentId: 's1' } as Node,
      { id: 'GitHub-AppCoPilotExtension', parentId: 's1' } as Node,
      { id: 'App', parentId: 's1' } as Node,
      { id: 'n8', parentId: 's1' } as Node,
      { id: 'n9', parentId: 's1' } as Node,
      { id: 'n12', parentId: 's1' } as Node,

      { id: 'Payments*', parentId: 's3-1' } as Node,
      { id: 'DiagramStorage*', parentId: 's3-1' } as Node,
      { id: 'AuthService*', parentId: 's3-1' } as Node,
      { id: 'AIServices*', parentId: 's3-1' } as Node,
      { id: 'n7', parentId: 's3-1' } as Node,
      { id: 'MCP-Server', parentId: 's3-1' } as Node,

      { id: 'Editor*', parentId: 's3-2' } as Node,
      { id: 'Coral*', parentId: 's3-2' } as Node,
      { id: 'n17', parentId: 's3-2' } as Node,
      { id: 'n18', parentId: 's3-2' } as Node,
      { id: 'n19', parentId: 's3-2' } as Node,

      { id: 'Mermaid', parentId: 's3-3' } as Node,
      { id: 'Test-tools**', parentId: 's3-3' } as Node,
      { id: 'Experiments**', parentId: 's3-3' } as Node,

      { id: 'ServerLessFunction', parentId: 's4' } as Node,
      { id: 'NodeService', parentId: 's4' } as Node,
      { id: 'Database*', parentId: 's4' } as Node,
      { id: 'Logging*', parentId: 's4' } as Node,
      { id: 'Monitoring*', parentId: 's4' } as Node,

      { id: 'a', parentId: 's5' } as Node,
      { id: 'b', parentId: 's5' } as Node,
      { id: 'c', parentId: 's5' } as Node,
      { id: 'n10', parentId: 's5' } as Node,
      { id: 'n11', parentId: 's5' } as Node,

      { id: 'n1', parentId: 's6' } as Node,
      { id: 'n2', parentId: 's6' } as Node,
      { id: 'n4', parentId: 's6' } as Node,
      { id: 'n5', parentId: 's6' } as Node,
      { id: 'n6', parentId: 's6' } as Node,
      { id: 'n15', parentId: 's6' } as Node,
      { id: 'n16', parentId: 's6' } as Node,
      { id: 'n21', parentId: 's6' } as Node,

      { id: 'n13', parentId: undefined } as Node,
      { id: 'n14', parentId: undefined } as Node,
      { id: 'n20', parentId: undefined } as Node,

      { id: 'orphan-dummy-s5-n10', parentId: 's5' } as Node,
      { id: 'orphan-dummy-s4-Database*', parentId: 's4' } as Node,
    ];

    const edges: Edge[] = [
      {
        id: 'L_VS_CP',
        start: 'VS-Code-Plugin',
        end: 'Confluence-Plugin',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      {
        id: 'L_JP_GP',
        start: 'Jira-Plugin',
        end: 'Google-Plugin',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      {
        id: 'L_OP_JP',
        start: 'Office-Plugin',
        end: 'JetBrains-Plugin',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      {
        id: 'L_DS_PS',
        start: 'DiagramStorage*',
        end: 'Payments*',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      { id: 'L_s31_s4', start: 's3-1', end: 's4', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_s31_s33', start: 's3-1', end: 's3-3', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_s32_s4', start: 's3-2', end: 's4', type: 'arrow_open', isUserDefinedId: false },
      {
        id: 'L_GPT_GH',
        start: 'GPT-ForChatGPT',
        end: 'GitHub-AppCoPilotExtension',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      { id: 'L_App_n8', start: 'App', end: 'n8', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_s1_n13', start: 's1', end: 'n13', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_n13_n14', start: 'n13', end: 'n14', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_n4_n5', start: 'n4', end: 'n5', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_n12_n8', start: 'n12', end: 'n8', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_n12_n9', start: 'n12', end: 'n9', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_n14_s7', start: 'n14', end: 's7', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_n15_n16', start: 'n15', end: 'n16', type: 'arrow_open', isUserDefinedId: false },
      {
        id: 'L_AI_MCP',
        start: 'AIServices*',
        end: 'MCP-Server',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      {
        id: 'L_AS_n7',
        start: 'AuthService*',
        end: 'n7',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      { id: 'L_n18_n19', start: 'n18', end: 'n19', type: 'arrow_open', isUserDefinedId: false },
      {
        id: 'L_SLF_NS',
        start: 'ServerLessFunction',
        end: 'NodeService',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      {
        id: 'L_MON_LOG',
        start: 'Monitoring*',
        end: 'Logging*',
        type: 'arrow_open',
        isUserDefinedId: false,
      },
      { id: 'L_c_b', start: 'c', end: 'b', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_a_n11', start: 'a', end: 'n11', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_s7_s5', start: 's7', end: 's5', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_n2_n6', start: 'n2', end: 'n6', type: 'arrow_open', isUserDefinedId: false },
      { id: 'L_s6_n20', start: 's6', end: 'n20', type: 'arrow_point', isUserDefinedId: false },
      { id: 'L_n1_n21', start: 'n1', end: 'n21', type: 'arrow_open', isUserDefinedId: false },
    ];

    const layoutData: LayoutData = { nodes, edges, config: baseConfig };

    const trueSubgraphs = getTrueSubgraphs(layoutData);
    const trueSubgraphIds = trueSubgraphs.map((sg) => sg.id);

    expect(trueSubgraphIds.length).toBe(8);

    const expected = ['s6', 's5', 's7', 's4', 's3-3', 's3-2', 's3-1', 's1'];
    expected.forEach((id) => {
      expect(trueSubgraphIds).toContain(id);
      expect(isTrueSubgraph(layoutData, id)).toBe(true);
    });
  });
});
