/**
 * HOLA Step 3a: symmetric tree layout (guide §15).
 *
 * Manning & Atallah detect symmetry in a tree by canonical form: two subtrees
 * are interchangeable exactly when their canonical codes agree. This layout
 * uses those codes for *c-tree pairing* — children are grouped by canonical
 * code and arranged as a palindrome, matched pairs straddling the axis with at
 * most one odd subtree on the axis — and lays right-hand members out as
 * reflections of their partners.
 *
 * Two facts make the symmetry exact rather than approximate:
 *
 *   - the layout of a subtree depends only on its structure and node sizes,
 *     which are precisely what the canonical code captures, so isomorphic
 *     siblings are laid out identically;
 *   - a palindromic sequence of reserved extents packed with a uniform gap and
 *     centred on the parent is symmetric about the parent's axis.
 *
 * There are therefore no similarity thresholds and no weighted pairing scores.
 *
 * Trees grow SOUTH provisionally, every rank shares one y, and every
 * parent-child edge is routed orthogonally here (guide §15.2).
 */

import type { Bounds, HolaGraph, Point } from '../model.js';
import { pointBounds, unionBounds } from '../model.js';

export interface TreeLayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface TreeLayoutEdge {
  id: string;
  source: string;
  target: string;
  originalEdgeIds: string[];
  route: Point[];
}

export interface TreeLayout {
  rootId: string;
  /** Root position in the layout's own frame. */
  rootPosition: Point;
  nodes: Map<string, TreeLayoutNode>;
  edges: TreeLayoutEdge[];
  /** Includes node rectangles *and* routed edge points (guide §17.2). */
  bounds: Bounds;
}

export interface TreeLayoutOptions {
  rankGap: number;
  siblingGap: number;
  /**
   * The axis the tree will finally grow along.
   *
   * The tree is always *drawn* growing SOUTH — that is HOLA's provisional
   * orientation — but placement may rotate it a quarter turn to grow EAST or
   * WEST. Rotation carries the reserved distances around with it: rank spacing
   * becomes horizontal spacing, and sibling spacing becomes vertical. Reserving
   * rank spacing from node *heights* is therefore only correct for a tree that
   * ends up growing vertically; a tree destined for EAST or WEST must reserve
   * its ranks from node *widths*, or a wide label will end up overlapping its
   * own parent once the tree is turned.
   *
   * Defaults to `'vertical'`.
   */
  growthAxis?: 'vertical' | 'horizontal';
}

interface RootedTree {
  root: string;
  children: Map<string, string[]>;
  parent: Map<string, string>;
  depth: Map<string, number>;
}

export function rootTree(graph: HolaGraph, root: string): RootedTree {
  const children = new Map<string, string[]>();
  const parent = new Map<string, string>();
  const depth = new Map<string, number>([[root, 0]]);
  const seen = new Set<string>([root]);
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const kids: string[] = [];
    const neighbours = [...(graph.adjacency.get(current) ?? [])].sort(
      (a, b) => (graph.nodes.get(a)?.inputOrder ?? 0) - (graph.nodes.get(b)?.inputOrder ?? 0)
    );
    for (const neighbour of neighbours) {
      if (seen.has(neighbour)) {
        continue;
      }
      seen.add(neighbour);
      kids.push(neighbour);
      parent.set(neighbour, current);
      depth.set(neighbour, (depth.get(current) ?? 0) + 1);
      queue.push(neighbour);
    }
    children.set(current, kids);
  }

  return { root, children, parent, depth };
}

/**
 * AHU canonical codes: equal codes ⇔ isomorphic rooted subtrees. Node sizes
 * take part, because swapping two structurally identical but differently sized
 * subtrees is not a symmetry of the *drawing*.
 */
export function canonicalCodes(tree: RootedTree, graph: HolaGraph): Map<string, string> {
  const codes = new Map<string, string>();
  const visit = (id: string): string => {
    const childCodes = (tree.children.get(id) ?? []).map(visit).sort();
    const node = graph.nodes.get(id)!;
    const code = `${node.width}x${node.height}(${childCodes.join(',')})`;
    codes.set(id, code);
    return code;
  };
  visit(tree.root);
  return codes;
}

function subtreeSize(tree: RootedTree, id: string, cache: Map<string, number>): number {
  const cached = cache.get(id);
  if (cached !== undefined) {
    return cached;
  }
  let total = 1;
  for (const child of tree.children.get(id) ?? []) {
    total += subtreeSize(tree, child, cache);
  }
  cache.set(id, total);
  return total;
}

export interface ChildSlot {
  childId: string;
  /** Lay this child out as a reflection of its paired partner. */
  mirrored: boolean;
  /** Reserve a symmetric extent, so the palindrome stays exact. */
  symmetrise: boolean;
}

/**
 * c-tree pairing (guide §15.1): pair equal-code siblings around the axis, keep
 * one odd subtree on the axis, and place any further odd subtrees outermost.
 */
export function orderChildrenForSymmetry(
  kids: string[],
  codes: Map<string, string>,
  tree: RootedTree,
  graph: HolaGraph
): ChildSlot[] {
  if (kids.length <= 1) {
    return kids.map((childId) => ({ childId, mirrored: false, symmetrise: false }));
  }

  const byCode = new Map<string, string[]>();
  for (const kid of kids) {
    const code = codes.get(kid)!;
    const list = byCode.get(code);
    if (list) {
      list.push(kid);
    } else {
      byCode.set(code, [kid]);
    }
  }

  const sizeCache = new Map<string, number>();
  const classes = [...byCode.entries()]
    .map(([code, members]) => ({
      code,
      members: [...members].sort(
        (a, b) => (graph.nodes.get(a)?.inputOrder ?? 0) - (graph.nodes.get(b)?.inputOrder ?? 0)
      ),
      size: subtreeSize(tree, members[0], sizeCache),
    }))
    .sort((a, b) => (a.size !== b.size ? b.size - a.size : a.code.localeCompare(b.code)));

  const pairs: [string, string][] = [];
  const odd: string[] = [];
  for (const cls of classes) {
    for (let i = 0; i + 1 < cls.members.length; i += 2) {
      pairs.push([cls.members[i], cls.members[i + 1]]);
    }
    if (cls.members.length % 2 === 1) {
      odd.push(cls.members[cls.members.length - 1]);
    }
  }

  // The largest odd subtree takes the axis; any others sit outermost-left,
  // which is where an unavoidable asymmetry is least visible.
  const centre = odd.shift();

  const slots: ChildSlot[] = [
    ...odd.map((childId) => ({ childId, mirrored: false, symmetrise: false })),
    ...pairs.map(([a]) => ({ childId: a, mirrored: false, symmetrise: false })),
  ];
  if (centre !== undefined) {
    slots.push({ childId: centre, mirrored: false, symmetrise: true });
  }
  slots.push(
    ...pairs.map(([, b]) => ({ childId: b, mirrored: true, symmetrise: false })).reverse()
  );
  return slots;
}

interface SubtreeBox {
  nodes: Map<string, TreeLayoutNode>;
  edges: TreeLayoutEdge[];
  /** Horizontal extent relative to the subtree root: left ≤ 0 ≤ right. */
  left: number;
  right: number;
}

export function layoutTree(
  graph: HolaGraph,
  rootId: string,
  options: TreeLayoutOptions
): TreeLayout {
  const tree = rootTree(graph, rootId);
  const codes = canonicalCodes(tree, graph);

  // Extent along the growth axis feeds rank spacing; extent across it feeds
  // sibling spacing. For a tree that will be rotated to grow horizontally the
  // two swap, so the distances survive the rotation.
  const horizontal = options.growthAxis === 'horizontal';
  const along = (id: string): number => {
    const node = graph.nodes.get(id);
    return (horizontal ? node?.width : node?.height) ?? 0;
  };
  const across = (id: string): number => {
    const node = graph.nodes.get(id);
    return (horizontal ? node?.height : node?.width) ?? 0;
  };

  // One y per depth: ranks are horizontally aligned by construction.
  const levelHeight = new Map<number, number>();
  for (const [id, depth] of tree.depth) {
    levelHeight.set(depth, Math.max(levelHeight.get(depth) ?? 0, along(id)));
  }
  const maxDepth = Math.max(0, ...tree.depth.values());
  const rankY = new Map<number, number>([[0, 0]]);
  for (let d = 1; d <= maxDepth; d++) {
    rankY.set(
      d,
      rankY.get(d - 1)! +
        (levelHeight.get(d - 1) ?? 0) / 2 +
        options.rankGap +
        (levelHeight.get(d) ?? 0) / 2
    );
  }

  const build = (id: string): SubtreeBox => {
    const node = graph.nodes.get(id)!;
    const depth = tree.depth.get(id)!;
    const self: TreeLayoutNode = {
      id,
      x: 0,
      y: rankY.get(depth)!,
      width: node.width,
      height: node.height,
      depth,
    };

    const kids = tree.children.get(id) ?? [];
    if (kids.length === 0) {
      return {
        nodes: new Map([[id, self]]),
        edges: [],
        left: -across(id) / 2,
        right: across(id) / 2,
      };
    }

    const slots = orderChildrenForSymmetry(kids, codes, tree, graph);
    const laid = slots.map((slot) => {
      const child = build(slot.childId);
      const oriented = slot.mirrored ? mirror(child) : child;
      if (!slot.symmetrise) {
        return { slot, box: oriented };
      }
      const half = Math.max(-oriented.left, oriented.right);
      return { slot, box: { ...oriented, left: -half, right: half } };
    });

    // Pack left to right with a uniform gap, then centre the span on the parent.
    let cursor = 0;
    const offsets: number[] = [];
    laid.forEach(({ box }, index) => {
      if (index > 0) {
        cursor += options.siblingGap;
      }
      offsets.push(cursor - box.left);
      cursor += box.right - box.left;
    });
    const shift = -cursor / 2;

    const nodes = new Map<string, TreeLayoutNode>([[id, self]]);
    const edges: TreeLayoutEdge[] = [];
    let left = -across(id) / 2;
    let right = across(id) / 2;

    laid.forEach(({ box }, index) => {
      const dx = offsets[index] + shift;
      for (const child of box.nodes.values()) {
        nodes.set(child.id, { ...child, x: child.x + dx });
      }
      for (const edge of box.edges) {
        edges.push({ ...edge, route: edge.route.map((p) => ({ x: p.x + dx, y: p.y })) });
      }
      left = Math.min(left, box.left + dx);
      right = Math.max(right, box.right + dx);
    });

    for (const { slot } of laid) {
      const child = nodes.get(slot.childId);
      if (child) {
        edges.push({
          id: `${id}${child.id}`,
          source: id,
          target: child.id,
          originalEdgeIds: [],
          route: routeRankEdge(self, child, options.rankGap),
        });
      }
    }

    return { nodes, edges, left, right };
  };

  const built = build(rootId);
  return {
    rootId,
    rootPosition: { x: 0, y: 0 },
    nodes: built.nodes,
    edges: built.edges,
    bounds: boundsOf(built.nodes, built.edges),
  };
}

function boundsOf(nodes: Map<string, TreeLayoutNode>, edges: TreeLayoutEdge[]): Bounds {
  const list: Bounds[] = [...nodes.values()].map((n) => ({
    minX: n.x - n.width / 2,
    minY: n.y - n.height / 2,
    maxX: n.x + n.width / 2,
    maxY: n.y + n.height / 2,
  }));
  for (const edge of edges) {
    const b = pointBounds(edge.route);
    if (b) {
      list.push(b);
    }
  }
  return unionBounds(list) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

/** Reflect a subtree box about its root's vertical axis. */
function mirror(box: SubtreeBox): SubtreeBox {
  const nodes = new Map<string, TreeLayoutNode>();
  for (const [id, node] of box.nodes) {
    nodes.set(id, { ...node, x: -node.x });
  }
  return {
    nodes,
    edges: box.edges.map((edge) => ({
      ...edge,
      route: edge.route.map((p) => ({ x: -p.x, y: p.y })),
    })),
    left: -box.right,
    right: -box.left,
  };
}

/**
 * Parent leaves through the side facing the child's rank, the child enters
 * through the side facing the parent's rank, and the turn happens between the
 * two ranks (guide §15.2).
 */
export function routeRankEdge(
  parent: TreeLayoutNode,
  child: TreeLayoutNode,
  rankGap: number
): Point[] {
  return routeRankEdgeTowards(parent, child, 'S', rankGap);
}

/**
 * Rank-facing orthogonal connector for a tree that has already been turned to
 * grow in `growth`.
 *
 * Rotating a finished route is not enough: a point sitting on a node's bottom
 * edge, half a *height* from the centre, lands half a height from the centre on
 * the node's *side* after a quarter turn — which is off the boundary unless the
 * node happens to be square. Re-deriving the connector from the final positions
 * uses each node's real width and height, so both endpoints land exactly on the
 * boundary and the ports still face the neighbouring rank (guide §15.2).
 */
export function routeRankEdgeTowards(
  parent: { x: number; y: number; width: number; height: number },
  child: { x: number; y: number; width: number; height: number },
  growth: 'N' | 'S' | 'E' | 'W',
  rankGap: number
): Point[] {
  const vertical = growth === 'N' || growth === 'S';
  const sign = growth === 'S' || growth === 'E' ? 1 : -1;

  const from: Point = vertical
    ? { x: parent.x, y: parent.y + (sign * parent.height) / 2 }
    : { x: parent.x + (sign * parent.width) / 2, y: parent.y };
  const to: Point = vertical
    ? { x: child.x, y: child.y - (sign * child.height) / 2 }
    : { x: child.x - (sign * child.width) / 2, y: child.y };

  // Straight when the two are already on the same rank line.
  if (vertical ? Math.abs(from.x - to.x) < 1e-9 : Math.abs(from.y - to.y) < 1e-9) {
    return [from, to];
  }

  const span = vertical ? to.y - from.y : to.x - from.x;
  const step = Math.abs(span) < 1e-9 ? sign * Math.max(rankGap / 2, 1) : span / 2;
  return vertical
    ? [from, { x: from.x, y: from.y + step }, { x: to.x, y: from.y + step }, to]
    : [from, { x: from.x + step, y: from.y }, { x: from.x + step, y: to.y }, to];
}

// ---------------------------------------------------------------------------
// Rigid transforms, applied to node positions *and* routed points
// ---------------------------------------------------------------------------

export type Quarter = 0 | 90 | 180 | 270;

export function transformTreeLayout(
  layout: TreeLayout,
  rotation: Quarter,
  flip: boolean,
  translate: Point
): TreeLayout {
  const apply = (p: Point): Point => {
    const flipped = flip ? { x: -p.x, y: p.y } : p;
    const rotated = rotatePoint(flipped, rotation);
    return { x: rotated.x + translate.x, y: rotated.y + translate.y };
  };

  const nodes = new Map<string, TreeLayoutNode>();
  for (const [id, node] of layout.nodes) {
    const p = apply({ x: node.x, y: node.y });
    // Node rectangles keep their measured size under rotation (guide §18.3).
    nodes.set(id, { ...node, x: p.x, y: p.y });
  }
  const edges = layout.edges.map((edge) => ({ ...edge, route: edge.route.map(apply) }));

  return {
    rootId: layout.rootId,
    rootPosition: apply(layout.rootPosition),
    nodes,
    edges,
    bounds: boundsOf(nodes, edges),
  };
}

function rotatePoint(p: Point, rotation: Quarter): Point {
  switch (rotation) {
    case 0:
      return { x: p.x, y: p.y };
    case 90:
      // Clockwise on screen; SOUTH growth becomes WEST growth.
      return { x: p.y, y: -p.x };
    case 180:
      return { x: -p.x, y: -p.y };
    case 270:
      return { x: -p.y, y: p.x };
  }
}

export function treePerimeter(layout: TreeLayout): number {
  const width = layout.bounds.maxX - layout.bounds.minX;
  const height = layout.bounds.maxY - layout.bounds.minY;
  return 2 * (width + height);
}
