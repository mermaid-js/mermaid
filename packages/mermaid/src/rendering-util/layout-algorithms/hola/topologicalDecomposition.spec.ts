import { describe, it, expect } from 'vitest';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import { topologicalDecomposition } from './topologicalDecomposition.js';
import type { LayoutData } from '../../types.js';

describe('topologicalDecomposition', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  function findNode(
    trees: Map<string, LayoutData>,
    predicate: (id: string) => boolean
  ): string | undefined {
    for (const [, layout] of trees) {
      for (const node of layout.nodes) {
        const id = typeof node === 'string' ? node : node.id;
        if (predicate(id)) {
          return id;
        }
      }
    }
    return undefined;
  }

  function inNeighbors(trees: Map<string, LayoutData>, targetId: string): string[] {
    for (const [, layout] of trees) {
      const edge = layout.edges?.find((e) => e.end === targetId);
      return edge ? [edge?.start ?? ''] : [];
    }
    return [];
  }

  it('should correctly decompose a simple tree with one leaf', async () => {
    const flowchart = `
      flowchart TD
        root --> leaf
    `;
    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const { trees, core } = topologicalDecomposition(layoutData);
    expect(trees.size).toBe(1);
    expect(trees.get('root')?.nodes.length).toBe(2);
    expect(core.nodes.length).toBe(0);
  });

  it('should handle a more complex graph with multiple leaves', async () => {
    const flowchart = `
        flowchart TD
          A --> B & C
          B --> D & leaf1
          C --> D & leaf2
      `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const { trees, core } = topologicalDecomposition(layoutData);

    // Check trees
    expect(trees.size).toBe(2);
    expect(trees.get('B')?.nodes.length).toEqual(2);
    expect(trees.get('C')?.nodes.length).toEqual(2);
    expect(trees.get('B')?.nodes.some((node) => node.id === 'leaf1')).toBe(true);
    expect(trees.get('C')?.nodes.some((node) => node.id === 'leaf2')).toBe(true);
    expect(trees.get('B')?.nodes.some((node) => node.id === 'B')).toBe(true);
    expect(trees.get('C')?.nodes.some((node) => node.id === 'C')).toBe(true);

    //Check core
    expect(core.nodes.length).toBe(4);
    expect(core.nodes.some((node) => node.id === 'A')).toBe(true);
    expect(core.nodes.some((node) => node.id === 'B')).toBe(true);
    expect(core.nodes.some((node) => node.id === 'C')).toBe(true);
    expect(core.nodes.some((node) => node.id === 'D')).toBe(true);
  });

  it('should handle a cycle in the core', async () => {
    const flowchart = `
        flowchart TD
          A --> B --> C --> A
          B --> leaf1
          C --> leaf2
      `;

    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(trees.size).toBe(2);
    expect(trees.get('B')?.nodes.length).toBe(2);
    expect(trees.get('C')?.nodes.length).toBe(2);
    expect(trees.get('B')?.nodes.some((node) => node.id === 'leaf1')).toBe(true);
    expect(trees.get('C')?.nodes.some((node) => node.id === 'leaf2')).toBe(true);
    expect(trees.get('B')?.nodes.some((node) => node.id === 'B')).toBe(true);
    expect(trees.get('C')?.nodes.some((node) => node.id === 'C')).toBe(true);

    expect(core.nodes.length).toBe(3);
    expect(core.nodes.some((node) => node.id === 'A')).toBe(true);
    expect(core.nodes.some((node) => node.id === 'B')).toBe(true);
    expect(core.nodes.some((node) => node.id === 'C')).toBe(true);
  });

  it('should handle disconnected components', async () => {
    const flowchart = `
        flowchart TD
          A --> B
          C --> D
      `;

    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.length).toBe(0);
    expect(trees.size).toBe(2);
  });

  it('should handle a single node', async () => {
    const flowchart = `
        flowchart TD
          A
      `;

    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.length).toBe(0);
    expect(trees.size).toBe(1);
  });

  it('should handle multiple trees from same root', async () => {
    const flowchart = `
        flowchart TD
          root --> leaf1 & leaf2 & leaf3
      `;

    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.length).toBe(0); // just root
    expect(trees.size).toBe(1); // root + 3 leaves
    expect(trees.get('root')?.nodes.some((node) => node.id === 'root')).toBe(true);

    expect(trees.get('root')?.nodes.some((node) => node.id === 'leaf1')).toBe(true);
    expect(trees.get('root')?.nodes.some((node) => node.id === 'leaf2')).toBe(true);
    expect(trees.get('root')?.nodes.some((node) => node.id === 'leaf3')).toBe(true);
  });

  it('should handle deep trees', async () => {
    const flowchart = `
        flowchart TD
          root --> A
          A --> B
          B --> leaf
      `;

    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.length).toBe(0);
    expect(trees.size).toBe(1); //  B + leaf + A + root
  });
  it('should handle branching and merging workflow correctly ', async () => {
    const flowchart = `
        flowchart TD
          Start([Start]) --> Prep[Preparation Step]
          Prep --> Split{Ready to Process?}
          Split -->|Yes| T1[Task A]
          Split -->|Yes| T2[Task B]
          T1 --> Merge
          T2 --> Merge
          Merge((Join Results)) --> Finalize[Finalize Process]
          Finalize --> End([End])
      `;
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.length).toBe(4);
    expect(trees.size).toBe(2);
    expect(trees.get('Split')?.nodes.length).toBe(3);
    expect(trees.get('Merge')?.nodes.length).toBe(3);
  });

  it('should handle edge label nodes attached', async () => {
    const flowchart = `
        flowchart TD
          A -->|label1| B
          B -->|label2| leaf
      `;
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.some((n) => n.id === 'A')).toBe(false);
    expect(trees.size).toBe(1);
    expect(trees.get('A')?.nodes.some((n) => n.id === 'A')).toBe(true);
  });

  it('should handle nodes with multiple outgoing edges', async () => {
    const flowchart = `
        flowchart TD
          A --> B
          B --> C
          C --> leaf1 & leaf2
      `;
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();
    const { trees, core } = topologicalDecomposition(layoutData);

    expect(core.nodes.some((n) => n.id === 'A')).toBe(false);
    expect(trees.size).toBe(1);
    expect(trees.get('A')?.nodes.some((n) => n.id === 'A')).toBe(true);
  });

  describe('Complex network flowchart decomposition', () => {
    const flowchart = `
    flowchart LR
      internet
      nat
      routeur
      lb1
      lb2
      compute1
      compute2
      subgraph project
        routeur
        nat
        subgraph subnet1
          compute1
          lb1
        end
        subgraph subnet2
          compute2
          lb2
        end
      end
      internet --> routeur
      routeur --> subnet1 & subnet2
      subnet1 & subnet2 --> nat --> internet
  `;

    it('should identify core nodes involved in cycles', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees, core } = topologicalDecomposition(layoutData);

      const coreIds = core.nodes.map((n) => n.id);

      expect(coreIds).toEqual(
        expect.arrayContaining(['internet', 'nat', 'routeur', 'subnet1', 'subnet2'])
      );
    });

    it('should include all leaves in trees', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees } = topologicalDecomposition(layoutData);

      const allTreeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(allTreeNodes).toEqual(
        expect.arrayContaining(['compute1', 'compute2', 'lb1', 'lb2', 'project'])
      );
    });

    it('should handle branching correctly', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees } = topologicalDecomposition(layoutData);

      const allTreeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(allTreeNodes).toEqual(expect.arrayContaining(['compute1', 'compute2', 'lb1', 'lb2']));
    });

    it('should preserve subgraph membership', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees } = topologicalDecomposition(layoutData);

      const allTreeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(allTreeNodes).toContain('project');

      expect(allTreeNodes).toEqual(expect.arrayContaining(['compute1', 'compute2', 'lb1', 'lb2']));
    });
  });

  describe('Customer → US/HongKong flowchart decomposition', () => {
    const flowchart = `
    flowchart TD
      Customer --> USCompany
      USCompany -- fdhdfjkfdkjdjd --> HongKongCompany
      USCompany -- & --> Expenses
      USCompany --$ --> Income
      HongKongCompany --> USCompany
      Income(US) --> Tax1(US)
      HongKongCompany --> ExpensesHK
      HongKongCompany --> Wages(HK)
      HongKongCompany --> Incomehk
      Income(HongKong) --> Tax(HongKong)
  `;

    it('should detect core nodes in cycles', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { core } = topologicalDecomposition(layoutData);

      const coreIds = core.nodes.map((n) => n.id);

      expect(coreIds).toEqual(expect.arrayContaining(['USCompany', 'HongKongCompany']));
    });

    it('should include leaves in trees', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees } = topologicalDecomposition(layoutData);

      const allTreeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(allTreeNodes).toEqual(
        expect.arrayContaining([
          'Customer',
          'Expenses',
          'Income',
          'Tax1',
          'ExpensesHK',
          'Wages',
          'Incomehk',
          'Tax',
        ])
      );
    });

    it('should handle branching correctly from USCompany', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { trees } = topologicalDecomposition(layoutData);

      const allTreeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(allTreeNodes).toEqual(expect.arrayContaining(['Expenses', 'Income', 'Customer']));
    });
  });
  describe('Complex CI/CD pipeline topological decomposition (with subgraphs)', () => {
    const flowchart = `
      flowchart TD
        A[Start Build] --> B[Compile Source]
        B --> C[Test Suite]
        C --> D{Tests Passed?}
        D -->|No| E[Notify Developer]
        E --> A
        D -->|Yes| F[Build Docker Image]

        subgraph S [Deploy Pipeline]
          F --> G[Deploy to Staging]
          G --> H[Run Integration Tests]
          H --> I{Tests Passed?}
          I -->|No| J[Rollback & Alert]
          I -->|Yes| K[Deploy to Production]
        end

        K --> L([Success])
     `;

    it('detects core cycle nodes correctly', async () => {
      await flow.parse(flowchart);
      const { core } = topologicalDecomposition(flow.parser.yy.getData());

      const coreIds = core.nodes.map((n) => n.id);

      expect(coreIds).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D', 'E']));

      ['F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((n) => expect(coreIds).not.toContain(n));
    });

    it('places all acyclic nodes in trees', async () => {
      await flow.parse(flowchart);
      const { trees } = topologicalDecomposition(flow.parser.yy.getData());

      const treeIds = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(treeIds).toEqual(expect.arrayContaining(['F', 'G', 'H', 'I', 'J', 'K', 'L']));

      ['A', 'B', 'C', 'E'].forEach((n) => expect(treeIds).not.toContain(n));
    });

    it('preserves Deploy Pipeline subgraph membership', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();

      const deployNodes = layoutData.nodes
        .filter((n: { parentId: string }) => n.parentId === 'S')
        .map((n: { id: string }) => n.id);

      expect(deployNodes).toEqual(expect.arrayContaining(['F', 'G', 'H', 'I', 'J', 'K']));
    });

    it('keeps Deploy Pipeline nodes out of the core', async () => {
      await flow.parse(flowchart);
      const { core } = topologicalDecomposition(flow.parser.yy.getData());

      const coreIds = core.nodes.map((n) => n.id);

      ['F', 'G', 'H', 'I', 'J', 'K'].forEach((n) => expect(coreIds).not.toContain(n));
    });

    it('handles branching correctly at decision nodes', async () => {
      await flow.parse(flowchart);
      const { trees } = topologicalDecomposition(flow.parser.yy.getData());

      const allEdges = [...trees.values()].flatMap((t) => t.edges);

      const fromD = allEdges.filter((e) => e.start === 'D_copy').map((e) => e.end);
      expect(fromD).toEqual(expect.arrayContaining(['F']));

      const fromI = allEdges.filter((e) => e.start === 'I').map((e) => e.end);
      expect(fromI).toEqual(expect.arrayContaining(['J', 'K']));
    });

    it('includes all leaf nodes', async () => {
      await flow.parse(flowchart);
      const { trees } = topologicalDecomposition(flow.parser.yy.getData());

      const leaves = [...trees.values()].flatMap((t) =>
        t.nodes.filter((n) => t.edges.every((e) => e.start !== n.id)).map((n) => n.id)
      );

      expect(leaves).toEqual(expect.arrayContaining(['J', 'L']));
    });

    it('preserves every original edge', async () => {
      await flow.parse(flowchart);
      const { trees, core } = topologicalDecomposition(flow.parser.yy.getData());

      const decomposedEdges = [
        ...core.edges.map((e) => `${e.start}->${e.end}`),
        ...[...trees.values()].flatMap((t) => t.edges.map((e) => `${e.start}->${e.end}`)),
      ];

      const expectedEdges = [
        'A->B',
        'B->C',
        'C->D',
        'D->E',
        'E->A',
        'D_copy->F',
        'F->G',
        'G->H',
        'H->I',
        'I->J',
        'I->K',
        'K->L',
      ];

      expectedEdges.forEach((e) => expect(decomposedEdges).toContain(e));
    });

    it('does not lose any nodes during decomposition', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { core, trees } = topologicalDecomposition(layoutData);

      const decomposed = new Set([
        ...core.nodes.map((n) => n.id),
        ...[...trees.values()].flatMap((t) => t.nodes.map((n) => n.id)),
      ]);

      const original = layoutData.nodes.map((n: { id: string }) => n.id);

      expect([...decomposed]).toEqual(expect.arrayContaining(original));
    });

    it('keeps Deploy Pipeline in a single tree', async () => {
      await flow.parse(flowchart);
      const { trees } = topologicalDecomposition(flow.parser.yy.getData());

      const deployTrees = [...trees.values()].filter((t) => t.nodes.some((n) => n.id === 'F'));

      expect(deployTrees.length).toBe(1);
    });
  });

  describe('Cycle with branching from core node (no node copying)', () => {
    const flowchart = `
      flowchart TD
        a --> b
        b --> c
        b --> d
        c --> a
    `;

    const getAllNodes = (core: LayoutData, trees: Map<string, { nodes: { id: string }[] }>) => [
      ...core.nodes.map((n) => n.id),
      ...[...trees.values()].flatMap((t) => t.nodes.map((n) => n.id)),
    ];

    const getAllEdges = (core: LayoutData, trees: Map<string, LayoutData>) =>
      [...core.edges, ...[...trees.values()].flatMap((t) => t.edges)].map(
        (e) => `${e.start}->${e.end}`
      );

    it('detects the cycle as the core', async () => {
      await flow.parse(flowchart);
      const { core } = topologicalDecomposition(flow.parser.yy.getData());

      const ids = core.nodes.map((n) => n.id);

      expect(ids).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    });

    it('moves the branch into a tree using the same articulation node', async () => {
      await flow.parse(flowchart);
      const { trees } = topologicalDecomposition(flow.parser.yy.getData());

      const treeNodes = [...trees.values()].flatMap((t) => t.nodes.map((n) => n.id));

      expect(treeNodes).toEqual(expect.arrayContaining(['b', 'd']));
    });

    it('keeps the correct branching edge', async () => {
      await flow.parse(flowchart);
      const { core, trees } = topologicalDecomposition(flow.parser.yy.getData());

      const edges = getAllEdges(core, trees);

      expect(edges).toEqual(expect.arrayContaining(['b->c']));
    });

    it('preserves the original cycle edges in core', async () => {
      await flow.parse(flowchart);
      const { core } = topologicalDecomposition(flow.parser.yy.getData());

      const edges = core.edges.map((e) => `${e.start}->${e.end}`);

      expect(edges).toEqual(expect.arrayContaining(['a->b', 'b->c', 'c->a']));
    });

    it('does not lose any node during decomposition', async () => {
      await flow.parse(flowchart);
      const layoutData = flow.parser.yy.getData();
      const { core, trees } = topologicalDecomposition(layoutData);

      const decomposed = new Set(getAllNodes(core, trees));
      const original = layoutData.nodes.map((n: { id: string }) => n.id);

      original.forEach((n: string) => {
        expect(decomposed.has(n)).toBe(true);
      });
    });
  });
});
