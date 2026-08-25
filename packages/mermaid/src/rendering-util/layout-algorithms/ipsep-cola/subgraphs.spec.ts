import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runIpsepColaLayoutCore } from './layoutCore.js';
import { DEFAULT_IPSEP_COLA_OPTIONS } from './options.js';

const WIDTH = 80;
const HEIGHT = 40;
const PAD = DEFAULT_IPSEP_COLA_OPTIONS.groupPadding;

function leaf(id: string, parentId?: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: WIDTH,
    height: HEIGHT,
    ...(parentId ? { parentId } : {}),
    ...overrides,
  } as Node;
}

function group(id: string, parentId?: string): Node {
  return {
    id,
    label: id,
    isGroup: true,
    width: 0,
    height: 0,
    ...(parentId ? { parentId } : {}),
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

interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function box(node: Node): Box {
  return {
    minX: node.x! - node.width! / 2,
    maxX: node.x! + node.width! / 2,
    minY: node.y! - node.height! / 2,
    maxY: node.y! + node.height! / 2,
  };
}

function byId(data: LayoutData): Map<string, Node> {
  return new Map(data.nodes.map((n) => [n.id, n]));
}

/** `inner` sits wholly within `outer`, with at least `pad` to spare. */
function expectContained(inner: Node, outer: Node, pad = PAD): void {
  const a = box(inner);
  const b = box(outer);
  const slack = 1e-6;
  expect(a.minX, `${inner.id}.left inside ${outer.id}`).toBeGreaterThanOrEqual(
    b.minX + pad - slack
  );
  expect(a.maxX, `${inner.id}.right inside ${outer.id}`).toBeLessThanOrEqual(b.maxX - pad + slack);
  expect(a.minY, `${inner.id}.top inside ${outer.id}`).toBeGreaterThanOrEqual(b.minY + pad - slack);
  expect(a.maxY, `${inner.id}.bottom inside ${outer.id}`).toBeLessThanOrEqual(b.maxY - pad + slack);
}

function overlaps(a: Box, b: Box): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
}

describe('IPSEP-COLA subgraphs', () => {
  describe('containment', () => {
    it('keeps every child inside its frame', () => {
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G'), leaf('C', 'G')],
        [edge('A', 'B'), edge('B', 'C')]
      );

      const result = runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(result.groupCount).toBe(1);
      for (const child of ['A', 'B', 'C']) {
        expectContained(nodes.get(child)!, nodes.get('G')!);
      }
    });

    it('nests a frame inside its parent frame', () => {
      const data = layoutData(
        [group('Outer'), group('Inner', 'Outer'), leaf('A', 'Inner'), leaf('B', 'Outer')],
        [edge('A', 'B')]
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expectContained(nodes.get('A')!, nodes.get('Inner')!);
      expectContained(nodes.get('Inner')!, nodes.get('Outer')!);
      expectContained(nodes.get('B')!, nodes.get('Outer')!);
    });

    it('holds containment even when the flow constraints pull the other way', () => {
      // The edge wants B below A, but A is inside a frame that must stay whole.
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('X', 'G'), leaf('B')],
        [edge('B', 'A'), edge('A', 'X')],
        'TB'
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expectContained(nodes.get('A')!, nodes.get('G')!);
      expectContained(nodes.get('X')!, nodes.get('G')!);
    });
  });

  describe('frames are tight', () => {
    it('closes the frame on its contents rather than keeping the widest box it ever needed', () => {
      const data = layoutData([group('G'), leaf('A', 'G'), leaf('B', 'G')], [edge('A', 'B')]);

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);
      const frame = box(nodes.get('G')!);
      const contents = [nodes.get('A')!, nodes.get('B')!].map(box);

      const childMinX = Math.min(...contents.map((c) => c.minX));
      const childMaxX = Math.max(...contents.map((c) => c.maxX));
      const childMinY = Math.min(...contents.map((c) => c.minY));
      const childMaxY = Math.max(...contents.map((c) => c.maxY));

      // Exactly one padding of slack on every side — no more.
      expect(childMinX - frame.minX).toBeCloseTo(PAD, 6);
      expect(frame.maxX - childMaxX).toBeCloseTo(PAD, 6);
      expect(childMinY - frame.minY).toBeCloseTo(PAD, 6);
      expect(frame.maxY - childMaxY).toBeCloseTo(PAD, 6);
    });

    it('reserves the measured title height at the top of the frame', () => {
      const titled = group('G');
      titled.labelBBox = { width: 60, height: 24 };
      const data = layoutData([titled, leaf('A', 'G')], []);

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);
      const frame = box(nodes.get('G')!);
      const child = box(nodes.get('A')!);

      expect(child.minY - frame.minY).toBeCloseTo(PAD + 24, 6);
      expect(frame.maxY - child.maxY).toBeCloseTo(PAD, 6);
    });
  });

  describe('separation', () => {
    it('keeps two sibling subgraphs apart', () => {
      const data = layoutData(
        [
          group('G1'),
          leaf('A', 'G1'),
          leaf('B', 'G1'),
          group('G2'),
          leaf('C', 'G2'),
          leaf('D', 'G2'),
        ],
        [edge('A', 'B'), edge('C', 'D'), edge('A', 'C')]
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(overlaps(box(nodes.get('G1')!), box(nodes.get('G2')!))).toBe(false);
    });

    it('keeps an outside node out of a frame', () => {
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G'), leaf('Outside')],
        [edge('A', 'B'), edge('A', 'Outside')]
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(overlaps(box(nodes.get('Outside')!), box(nodes.get('G')!))).toBe(false);
    });

    it('leaves no leaf overlapping another, across frames', () => {
      const data = layoutData(
        [
          group('G1'),
          leaf('A', 'G1'),
          leaf('B', 'G1'),
          group('G2'),
          leaf('C', 'G2'),
          leaf('D', 'G2'),
          leaf('E'),
        ],
        [edge('A', 'B'), edge('C', 'D'), edge('A', 'C'), edge('E', 'A'), edge('E', 'D')]
      );

      runIpsepColaLayoutCore(data);
      const leaves = data.nodes.filter((n) => !n.isGroup);

      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          expect(
            overlaps(box(leaves[i]), box(leaves[j])),
            `${leaves[i].id} overlaps ${leaves[j].id}`
          ).toBe(false);
        }
      }
    });
  });

  describe('edges naming a subgraph', () => {
    it('routes an edge whose endpoint is the subgraph itself', () => {
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G'), leaf('Start')],
        [edge('A', 'B'), edge('Start', 'G')]
      );

      runIpsepColaLayoutCore(data);
      const routed = data.edges.find((e) => e.end === 'G')!;

      expect(routed.points!.length).toBeGreaterThanOrEqual(2);
      for (const point of routed.points!) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
      }
    });

    it('orders the subgraph below the node pointing at it in TB', () => {
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G'), leaf('Start')],
        [edge('A', 'B'), edge('Start', 'G')],
        'TB'
      );

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expect(box(nodes.get('G')!).minY).toBeGreaterThan(box(nodes.get('Start')!).maxY);
    });

    it('ignores an edge between a frame and its own child', () => {
      // `G --> A` where A is inside G: the frame already contains it, so the
      // edge must not be turned into an ordering that fights containment.
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G')],
        [edge('G', 'A'), edge('A', 'B')]
      );

      expect(() => runIpsepColaLayoutCore(data)).not.toThrow();
      const nodes = byId(data);
      expectContained(nodes.get('A')!, nodes.get('G')!);
    });
  });

  describe('degenerate shapes', () => {
    it('leaves an empty subgraph drawable', () => {
      const data = layoutData([group('Empty'), leaf('A'), leaf('B')], [edge('A', 'B')]);

      const result = runIpsepColaLayoutCore(data);

      // Nothing to contain, so it is never given boundary variables.
      expect(result.groupCount).toBe(0);
      expect(() => box(byId(data).get('Empty')!)).not.toThrow();
    });

    it('handles a subgraph holding a single node', () => {
      const data = layoutData([group('G'), leaf('A', 'G'), leaf('B')], [edge('A', 'B')]);

      runIpsepColaLayoutCore(data);
      const nodes = byId(data);

      expectContained(nodes.get('A')!, nodes.get('G')!);
      expect(overlaps(box(nodes.get('B')!), box(nodes.get('G')!))).toBe(false);
    });

    it('is deterministic with subgraphs', () => {
      const build = () =>
        layoutData(
          [group('G1'), leaf('A', 'G1'), leaf('B', 'G1'), group('G2'), leaf('C', 'G2'), leaf('D')],
          [edge('A', 'B'), edge('B', 'C'), edge('C', 'D')]
        );

      const first = build();
      const second = build();
      runIpsepColaLayoutCore(first);
      runIpsepColaLayoutCore(second);

      expect(first.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height])).toEqual(
        second.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height])
      );
    });

    it('keeps the whole drawing, frames included, in the positive quadrant', () => {
      const data = layoutData(
        [group('G'), leaf('A', 'G'), leaf('B', 'G'), leaf('C')],
        [edge('A', 'B'), edge('B', 'C')]
      );

      runIpsepColaLayoutCore(data);

      for (const node of data.nodes) {
        expect(box(node).minX, `${node.id}.left`).toBeGreaterThanOrEqual(0);
        expect(box(node).minY, `${node.id}.top`).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
