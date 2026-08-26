/**
 * Subgraph frames.
 *
 * A container is not laid out — the decomposition never sees one — so what these
 * check is the frame: that it closes on what it holds, that nesting comes out
 * inside-out, that the title has room, and that a container whose members ended up
 * scattered is declined rather than drawn around the wrong nodes.
 *
 * The last of those is the one worth stating plainly. A frame is a claim about
 * structure. Drawing a box that contains nodes the container does not own makes a
 * false claim, and is worse for a reader than the container going unrepresented, so
 * the layout reports it and draws nothing.
 */
import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';
import { resolveGridAttachedOptions } from './options.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;

function node(id: string, parentId?: string): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ...(parentId ? { parentId } : {}),
  } as Node;
}

function group(id: string, parentId?: string, titleHeight = 0): Node {
  return {
    id,
    label: id,
    isGroup: true,
    width: 0,
    height: 0,
    ...(parentId ? { parentId } : {}),
    ...(titleHeight > 0 ? { labelBBox: { width: 40, height: titleHeight } } : {}),
  } as Node;
}

function edge(start: string, end: string): Edge {
  return { id: `${start}-${end}`, start, end } as Edge;
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

function boxOf(data: LayoutData, id: string): Box {
  const found = data.nodes.find((n) => n.id === id);
  expect(found, `node ${id} is in the drawing`).toBeDefined();
  const n = found!;
  return {
    minX: (n.x ?? 0) - (n.width ?? 0) / 2,
    maxX: (n.x ?? 0) + (n.width ?? 0) / 2,
    minY: (n.y ?? 0) - (n.height ?? 0) / 2,
    maxY: (n.y ?? 0) + (n.height ?? 0) / 2,
  };
}

function contains(outer: Box, inner: Box): boolean {
  const eps = 1e-6;
  return (
    outer.minX <= inner.minX + eps &&
    outer.minY <= inner.minY + eps &&
    outer.maxX >= inner.maxX - eps &&
    outer.maxY >= inner.maxY - eps
  );
}

function has(data: LayoutData, id: string): boolean {
  return data.nodes.some((n) => n.id === id);
}

describe('grid-attached subgraphs', () => {
  describe('the container survives', () => {
    it('keeps a container and draws a frame for it', () => {
      const data = layoutData([group('one'), node('a', 'one'), node('b', 'one')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      expect(has(data, 'one')).toBe(true);
      const frame = boxOf(data, 'one');
      expect(frame.maxX - frame.minX).toBeGreaterThan(0);
      expect(frame.maxY - frame.minY).toBeGreaterThan(0);
    });

    it('leaves a diagram with no container untouched', () => {
      const data = layoutData([node('a'), node('b')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      expect(data.nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
      expect(data.nodes.every((n) => n.parentId === undefined)).toBe(true);
    });

    it('keeps parentId, so the painter can nest what it draws', () => {
      const data = layoutData([group('one'), node('a', 'one'), node('b', 'one')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      expect(data.nodes.find((n) => n.id === 'a')?.parentId).toBe('one');
      expect(data.nodes.find((n) => n.id === 'b')?.parentId).toBe('one');
    });
  });

  describe('containment', () => {
    it('closes the frame around every member', () => {
      const data = layoutData(
        [group('one'), node('a', 'one'), node('b', 'one'), node('c', 'one')],
        [edge('a', 'b'), edge('b', 'c')]
      );
      runGridAttachedLayoutCore(data);

      const frame = boxOf(data, 'one');
      for (const id of ['a', 'b', 'c']) {
        expect(contains(frame, boxOf(data, id)), `${id} inside its frame`).toBe(true);
      }
    });

    it('keeps at least the configured padding between a member and the frame', () => {
      const data = layoutData([group('one'), node('a', 'one'), node('b', 'one')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      const frame = boxOf(data, 'one');
      const a = boxOf(data, 'a');
      const b = boxOf(data, 'b');
      const inner = {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY),
      };
      const pad = resolveGridAttachedOptions(data).groupPadding;
      expect(inner.minX - frame.minX).toBeCloseTo(pad, 6);
      expect(frame.maxX - inner.maxX).toBeCloseTo(pad, 6);
      expect(frame.maxY - inner.maxY).toBeCloseTo(pad, 6);
    });

    it('nests a frame inside its parent frame', () => {
      const data = layoutData(
        [group('outer'), group('inner', 'outer'), node('a', 'inner'), node('b', 'outer')],
        [edge('a', 'b')]
      );
      runGridAttachedLayoutCore(data);

      expect(contains(boxOf(data, 'outer'), boxOf(data, 'inner'))).toBe(true);
      expect(contains(boxOf(data, 'inner'), boxOf(data, 'a'))).toBe(true);
      expect(contains(boxOf(data, 'outer'), boxOf(data, 'b'))).toBe(true);
    });

    it('nests three deep', () => {
      const data = layoutData(
        [group('a1'), group('a2', 'a1'), group('a3', 'a2'), node('leaf', 'a3')],
        []
      );
      runGridAttachedLayoutCore(data);

      expect(contains(boxOf(data, 'a1'), boxOf(data, 'a2'))).toBe(true);
      expect(contains(boxOf(data, 'a2'), boxOf(data, 'a3'))).toBe(true);
      expect(contains(boxOf(data, 'a3'), boxOf(data, 'leaf'))).toBe(true);
    });
  });

  describe('the title', () => {
    it('reserves the measured title height above the contents', () => {
      const plain = layoutData([group('one'), node('a', 'one')], []);
      runGridAttachedLayoutCore(plain);
      const withoutTitle = boxOf(plain, 'one');

      const titled = layoutData([group('one', undefined, 30), node('a', 'one')], []);
      runGridAttachedLayoutCore(titled);
      const withTitle = boxOf(titled, 'one');

      expect(withTitle.maxY - withTitle.minY).toBeCloseTo(
        withoutTitle.maxY - withoutTitle.minY + 30,
        6
      );
      // The room goes above the contents, which is where the title is drawn.
      expect(boxOf(titled, 'a').minY - withTitle.minY).toBeCloseTo(
        boxOf(plain, 'a').minY - withoutTitle.minY + 30,
        6
      );
    });
  });

  describe('degenerate shapes', () => {
    it('leaves an empty container drawable rather than zero-sized', () => {
      const data = layoutData([group('empty'), node('a'), node('b')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      const frame = boxOf(data, 'empty');
      expect(frame.maxX - frame.minX).toBeGreaterThan(0);
      expect(frame.maxY - frame.minY).toBeGreaterThan(0);
    });

    it('frames a container holding a single node', () => {
      const data = layoutData([group('one'), node('a', 'one'), node('b')], [edge('a', 'b')]);
      runGridAttachedLayoutCore(data);

      expect(contains(boxOf(data, 'one'), boxOf(data, 'a'))).toBe(true);
    });

    it('is deterministic', () => {
      const build = () =>
        layoutData(
          [group('one'), node('a', 'one'), node('b', 'one'), node('c')],
          [edge('a', 'b'), edge('b', 'c')]
        );
      const first = build();
      const second = build();
      runGridAttachedLayoutCore(first);
      runGridAttachedLayoutCore(second);

      expect(second.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height])).toEqual(
        first.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height])
      );
    });
  });

  describe('a frame that would lie', () => {
    it('declines to draw a frame that would enclose a node it does not own', () => {
      // `x` is pulled between the two members of `one` by the edges it shares with
      // them, so any box around both members also contains `x`.
      const data = layoutData(
        [group('one'), node('a', 'one'), node('b', 'one'), node('x')],
        [edge('a', 'x'), edge('x', 'b')]
      );
      const result = runGridAttachedLayoutCore(data);

      const declined = result.diagnostics.filter(
        (d) => d.code === 'GRID_ATTACHED_SUBGRAPH_NOT_FRAMED'
      );
      if (declined.length > 0) {
        expect(has(data, 'one')).toBe(false);
        expect(data.nodes.find((n) => n.id === 'a')?.parentId).toBeUndefined();
      } else {
        // If the placement did keep the members together, the frame must be honest.
        const frame = boxOf(data, 'one');
        const x = boxOf(data, 'x');
        const overlaps =
          Math.min(frame.maxX, x.maxX) - Math.max(frame.minX, x.minX) > 1e-6 &&
          Math.min(frame.maxY, x.maxY) - Math.max(frame.minY, x.minY) > 1e-6;
        expect(overlaps).toBe(false);
      }
    });

    it('re-parents members past a container it declined to draw', () => {
      const data = layoutData(
        [group('outer'), group('inner', 'outer'), node('a', 'inner'), node('b', 'inner')],
        [edge('a', 'b')]
      );
      runGridAttachedLayoutCore(data);

      // Whatever was declined, no node may be left pointing at a container that is
      // not in the drawing — the painter would have nothing to nest it in.
      const present = new Set(data.nodes.map((n) => n.id));
      for (const n of data.nodes) {
        if (n.parentId !== undefined) {
          expect(present.has(n.parentId), `${n.id} parent ${n.parentId} is drawn`).toBe(true);
        }
      }
    });
  });

  describe('components of one container', () => {
    it('packs the pieces of a container together, so a frame can close on them', () => {
      // `a` and `b` are both in `one` and share no edge, so they are separate
      // components; `z1 -> z2` is a third, declared between them. In discovery order
      // the packer would put `z` in the middle and any frame around `a` and `b`
      // would have to reach across it.
      const data = layoutData(
        [group('one'), node('a', 'one'), node('z1'), node('z2'), node('b', 'one')],
        [edge('z1', 'z2')]
      );
      const result = runGridAttachedLayoutCore(data);

      expect(
        result.diagnostics.filter((d) => d.code === 'GRID_ATTACHED_SUBGRAPH_NOT_FRAMED')
      ).toEqual([]);
      const frame = boxOf(data, 'one');
      expect(contains(frame, boxOf(data, 'a'))).toBe(true);
      expect(contains(frame, boxOf(data, 'b'))).toBe(true);
      for (const outsider of ['z1', 'z2']) {
        const box = boxOf(data, outsider);
        const overlaps =
          Math.min(frame.maxX, box.maxX) - Math.max(frame.minX, box.minX) > 1e-6 &&
          Math.min(frame.maxY, box.maxY) - Math.max(frame.minY, box.minY) > 1e-6;
        expect(overlaps, `${outsider} is outside the frame`).toBe(false);
      }
    });

    it('keeps sibling containers out of each other', () => {
      const data = layoutData(
        [group('one'), group('two'), node('a', 'one'), node('c', 'two'), node('b', 'one')],
        []
      );
      runGridAttachedLayoutCore(data);

      const one = boxOf(data, 'one');
      const two = boxOf(data, 'two');
      const overlaps =
        Math.min(one.maxX, two.maxX) - Math.max(one.minX, two.minX) > 1e-6 &&
        Math.min(one.maxY, two.maxY) - Math.max(one.minY, two.minY) > 1e-6;
      expect(overlaps).toBe(false);
    });
  });

  describe('an edge that names a container', () => {
    it('draws it, ending on the frame rather than on a member', () => {
      const data = layoutData([group('C'), node('c', 'C'), node('A')], [edge('A', 'C')]);
      runGridAttachedLayoutCore(data);

      const drawn = data.edges.find((e) => e.id === 'A-C');
      expect(drawn?.points, 'the edge is drawn at all').toBeDefined();
      expect(drawn!.end).toBe('C');

      // The last point sits on the frame's border, not inside it and not on `c`.
      const frame = boxOf(data, 'C');
      const last = drawn!.points![drawn!.points!.length - 1];
      const onBorder =
        Math.abs(last.x - frame.minX) < 0.5 ||
        Math.abs(last.x - frame.maxX) < 0.5 ||
        Math.abs(last.y - frame.minY) < 0.5 ||
        Math.abs(last.y - frame.maxY) < 0.5;
      expect(
        onBorder,
        `last point (${last.x}, ${last.y}) is on frame ${JSON.stringify(frame)}`
      ).toBe(true);
    });

    it('keeps the container as the declared endpoint', () => {
      const data = layoutData([group('C'), node('c', 'C'), node('A')], [edge('C', 'A')]);
      runGridAttachedLayoutCore(data);

      const drawn = data.edges.find((e) => e.id === 'C-A');
      expect(drawn?.start).toBe('C');
      expect(drawn?.end).toBe('A');
    });

    it('reports an edge between a container and its own child instead of drawing one', () => {
      const data = layoutData([group('C'), node('c', 'C')], [edge('C', 'c')]);
      const result = runGridAttachedLayoutCore(data);

      expect(
        result.diagnostics.some((d) => d.code === 'GRID_ATTACHED_SUBGRAPH_EDGE_UNRESOLVED')
      ).toBe(true);
    });

    it('holds a container together through the edge that names it', () => {
      // Without the edge `x --> one` in the graph, `a` and `b` are unreachable from
      // `x` and the drawing falls into three components.
      const data = layoutData(
        [group('one'), node('a', 'one'), node('b', 'one'), node('x')],
        [edge('a', 'b'), edge('x', 'one')]
      );
      const result = runGridAttachedLayoutCore(data);

      // One component is the claim being made here. Whether the frame then comes out
      // clean is a placement question, and a separate one.
      expect(result.componentCount).toBe(1);
    });
  });

  describe('taking containers into account from the decomposition', () => {
    // `a-b-c` is a triangle, so it is the core; `d` hangs off `a` and `e` off `d`.
    // `one` holds `a` (core) and `e` (the far end of the tree), so peeling would
    // split it — which is what `modelCoreGroups` stops.
    const split = (): LayoutData =>
      layoutData(
        [group('one'), node('a', 'one'), node('b'), node('c'), node('d'), node('e', 'one')],
        [edge('a', 'b'), edge('b', 'c'), edge('c', 'a'), edge('a', 'd'), edge('d', 'e')]
      );

    it('splits the container between core and tree when left to topology', () => {
      const data = split();
      const result = runGridAttachedLayoutCore(data, { modelCoreGroups: false });

      const core = new Set(result.components.flatMap((c) => c.coreNodeIds ?? []));
      expect(core.has('a'), 'a is in the core').toBe(true);
      expect(core.has('e'), 'e was peeled into a tree').toBe(false);
    });

    it('keeps the container whole when asked, branch and all', () => {
      const data = split();
      const result = runGridAttachedLayoutCore(data, { modelCoreGroups: true });

      const core = new Set(result.components.flatMap((c) => c.coreNodeIds ?? []));
      expect(core.has('a')).toBe(true);
      // `e` is held in the core, and `d` comes with it: peeling cannot reach `e`, so
      // `d` never becomes a leaf either. That is the branch, kept.
      expect(core.has('e'), 'e is kept in the core').toBe(true);
      expect(core.has('d'), 'the branch back to the core comes with it').toBe(true);
    });

    it('declines to grow the core beyond its allowance', () => {
      const data = split();
      const result = runGridAttachedLayoutCore(data, {
        modelCoreGroups: true,
        maxExtraCoreNodesForContainment: 0,
      });

      const core = new Set(result.components.flatMap((c) => c.coreNodeIds ?? []));
      expect(core.has('e')).toBe(false);
    });

    it('leaves a diagram with no container decomposed exactly as before', () => {
      const build = () =>
        layoutData(
          [node('a'), node('b'), node('c'), node('d')],
          [edge('a', 'b'), edge('b', 'c'), edge('c', 'a'), edge('a', 'd')]
        );
      const off = build();
      const on = build();
      runGridAttachedLayoutCore(off, { modelCoreGroups: false });
      runGridAttachedLayoutCore(on, { modelCoreGroups: true });

      expect(on.nodes.map((n) => [n.id, n.x, n.y])).toEqual(off.nodes.map((n) => [n.id, n.x, n.y]));
    });
  });

  describe('the drawing as a whole', () => {
    it('keeps every frame in the positive quadrant', () => {
      const data = layoutData(
        [group('one'), node('a', 'one'), node('b', 'one'), node('c')],
        [edge('a', 'b'), edge('b', 'c')]
      );
      runGridAttachedLayoutCore(data);

      for (const n of data.nodes) {
        expect((n.x ?? 0) - (n.width ?? 0) / 2).toBeGreaterThanOrEqual(0);
        expect((n.y ?? 0) - (n.height ?? 0) / 2).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
