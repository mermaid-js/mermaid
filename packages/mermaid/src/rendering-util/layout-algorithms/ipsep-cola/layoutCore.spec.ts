import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runIpsepColaLayoutCore } from './layoutCore.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ...overrides,
  } as Node;
}

function edge(start: string, end: string): Edge {
  return { id: `${start}-${end}`, start, end };
}

function layoutData(nodes: Node[], edges: Edge[], direction = 'TB'): LayoutData {
  return {
    nodes,
    edges,
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;
}

function byId(data: LayoutData): Map<string, Node> {
  return new Map(data.nodes.map((n) => [n.id, n]));
}

/** Overlap of two node boxes, negative when they are clear of each other. */
function overlap(a: Node, b: Node): { x: number; y: number } {
  return {
    x: (a.width! + b.width!) / 2 - Math.abs(a.x! - b.x!),
    y: (a.height! + b.height!) / 2 - Math.abs(a.y! - b.y!),
  };
}

function expectNoOverlaps(data: LayoutData): void {
  const nodes = data.nodes.filter((n) => !n.isGroup);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const gap = overlap(nodes[i], nodes[j]);
      const separated = gap.x <= 1e-6 || gap.y <= 1e-6;
      expect(
        separated,
        `${nodes[i].id} and ${nodes[j].id} overlap by (${gap.x.toFixed(2)}, ${gap.y.toFixed(2)})`
      ).toBe(true);
    }
  }
}

describe('IPSEP-COLA layout core', () => {
  it('places every node and routes every edge', () => {
    const data = layoutData([node('A'), node('B'), node('C')], [edge('A', 'B'), edge('B', 'C')]);

    const result = runIpsepColaLayoutCore(data);

    expect(result.variableCount).toBe(3);
    for (const n of data.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
    for (const e of data.edges) {
      expect(e.points!.length).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(e.points![0].x)).toBe(true);
    }
  });

  it('keeps the whole drawing in the positive quadrant', () => {
    const data = layoutData(
      [node('A'), node('B'), node('C'), node('D')],
      [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
    );

    runIpsepColaLayoutCore(data);

    for (const n of data.nodes) {
      expect(n.x! - n.width! / 2).toBeGreaterThanOrEqual(0);
      expect(n.y! - n.height! / 2).toBeGreaterThanOrEqual(0);
    }
  });

  it('separates overlapping nodes on at least one axis', () => {
    const data = layoutData(
      [node('A'), node('B'), node('C'), node('D'), node('E'), node('F')],
      [
        edge('A', 'B'),
        edge('A', 'C'),
        edge('A', 'D'),
        edge('B', 'E'),
        edge('C', 'E'),
        edge('D', 'F'),
        edge('E', 'F'),
      ]
    );

    runIpsepColaLayoutCore(data);

    expectNoOverlaps(data);
  });

  describe('direction constraints', () => {
    it('puts the target below the source for TB', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')],
        'TB'
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(nodes.get('B')!.y!).toBeGreaterThan(nodes.get('A')!.y!);
      expect(nodes.get('C')!.y!).toBeGreaterThan(nodes.get('B')!.y!);
    });

    it('puts the target to the right of the source for LR', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')],
        'LR'
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(nodes.get('B')!.x!).toBeGreaterThan(nodes.get('A')!.x!);
      expect(nodes.get('C')!.x!).toBeGreaterThan(nodes.get('B')!.x!);
    });

    it('puts the target above the source for BT', () => {
      const data = layoutData([node('A'), node('B')], [edge('A', 'B')], 'BT');

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(nodes.get('B')!.y!).toBeLessThan(nodes.get('A')!.y!);
    });

    it('leaves the declared gap between ranks', () => {
      const data = layoutData([node('A'), node('B')], [edge('A', 'B')], 'TB');

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      const clearance = nodes.get('B')!.y! - nodes.get('A')!.y! - NODE_HEIGHT;
      expect(clearance).toBeGreaterThanOrEqual(50 - 1e-6);
    });

    it('still terminates and separates nodes on a cyclic graph', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C'), edge('C', 'A')],
        'TB'
      );

      runIpsepColaLayoutCore(data);

      expectNoOverlaps(data);
      // The cycle's back edge cannot order its endpoints, but the other two must.
      const nodes = byId(data);
      expect(nodes.get('B')!.y!).toBeGreaterThan(nodes.get('A')!.y!);
      expect(nodes.get('C')!.y!).toBeGreaterThan(nodes.get('B')!.y!);
    });
  });

  describe('separation repair pass', () => {
    // Varied node sizes and a bushy tree: the majorisation's own constraints are
    // generated before each solve, so this is the shape most likely to end an
    // axis pass with overlaps the pass never saw.
    const build = () => {
      const ids = Array.from({ length: 14 }, (_, i) => `n${i}`);
      const nodes = ids.map((id, i) =>
        node(id, { width: 60 + ((i * 37) % 180), height: 30 + ((i * 23) % 50) })
      );
      const edges = ids.slice(1).map((id, i) => edge(ids[Math.floor((i + 1) / 3)], id));
      return { data: layoutData(nodes, edges), ids };
    };

    it('leaves no overlaps even when majorisation is stopped early', () => {
      const { data } = build();

      // One outer iteration is not enough for the majorisation to clean up after
      // itself; the repair pass has to carry the guarantee on its own.
      runIpsepColaLayoutCore(data, { maxIterations: 1, maxQpscIterations: 3 });

      expectNoOverlaps(data);
    });

    it('does not disturb the flow ordering while separating', () => {
      const { data, ids } = build();

      runIpsepColaLayoutCore(data, { maxIterations: 1, maxQpscIterations: 3 });

      const nodes = byId(data);
      for (let i = 1; i < ids.length; i++) {
        const parent = nodes.get(ids[Math.floor(i / 3)])!;
        expect(nodes.get(ids[i])!.y!).toBeGreaterThan(parent.y!);
      }
    });
  });

  it('is deterministic across runs', () => {
    const build = () =>
      layoutData(
        [node('A'), node('B'), node('C'), node('D')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
      );

    const first = build();
    const second = build();
    runIpsepColaLayoutCore(first);
    runIpsepColaLayoutCore(second);

    expect(first.nodes.map((n) => [n.x, n.y])).toEqual(second.nodes.map((n) => [n.x, n.y]));
  });

  it('keeps disconnected components apart', () => {
    const data = layoutData(
      [node('A'), node('B'), node('X'), node('Y')],
      [edge('A', 'B'), edge('X', 'Y')]
    );

    runIpsepColaLayoutCore(data);

    expectNoOverlaps(data);
  });

  it('routes a self loop clear of its node', () => {
    const data = layoutData([node('A'), node('B')], [edge('A', 'B'), edge('A', 'A')]);

    runIpsepColaLayoutCore(data);
    const selfLoop = data.edges.find((e) => e.start === e.end)!;
    const a = byId(data).get('A')!;

    expect(selfLoop.points!.length).toBeGreaterThan(2);
    for (const point of selfLoop.points!) {
      expect(point.y).toBeLessThanOrEqual(a.y! - a.height! / 2 + 1e-6);
    }
  });

  it('fits a group frame around its children', () => {
    const data = layoutData(
      [
        node('G', { isGroup: true, width: 0, height: 0 }),
        node('A', { parentId: 'G' }),
        node('B', { parentId: 'G' }),
        node('C'),
      ],
      [edge('A', 'B'), edge('B', 'C')]
    );

    runIpsepColaLayoutCore(data);
    const nodes = byId(data);
    const group = nodes.get('G')!;

    for (const child of ['A', 'B']) {
      const c = nodes.get(child)!;
      expect(c.x! - c.width! / 2).toBeGreaterThanOrEqual(group.x! - group.width! / 2);
      expect(c.x! + c.width! / 2).toBeLessThanOrEqual(group.x! + group.width! / 2);
      expect(c.y! - c.height! / 2).toBeGreaterThanOrEqual(group.y! - group.height! / 2);
      expect(c.y! + c.height! / 2).toBeLessThanOrEqual(group.y! + group.height! / 2);
    }
  });

  it('handles an empty graph', () => {
    const data = layoutData([], []);

    expect(() => runIpsepColaLayoutCore(data)).not.toThrow();
    expect(runIpsepColaLayoutCore(data).variableCount).toBe(0);
  });

  it('handles a single node', () => {
    const data = layoutData([node('A')], []);

    runIpsepColaLayoutCore(data);

    expect(Number.isFinite(data.nodes[0].x)).toBe(true);
    expect(Number.isFinite(data.nodes[0].y)).toBe(true);
  });
});
