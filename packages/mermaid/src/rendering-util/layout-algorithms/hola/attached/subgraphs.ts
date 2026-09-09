/**
 * Subgraph frames.
 *
 * A container is not a node this layout positions. The decomposition never sees
 * one — `flattenFlowchart` skips every `isGroup` node — so the core, the trees and
 * the placement all work on leaves exactly as they did before containers were kept.
 * What a container needs is a *frame*: a box drawn around its members once they
 * have their final positions.
 *
 * Fitting that box is the easy half and it is what this module does. The hard half
 * is making the box meaningful, which is a question about where the members ended
 * up rather than about the box: a frame fitted around members scattered to opposite
 * ends of the drawing is a rectangle covering everything between them, and it
 * swallows nodes that are not its own. So a fitted frame is reported along with
 * whether it holds anything foreign, and the caller decides what to do about it —
 * see `frameIsClean`.
 *
 * Nesting is handled by fitting innermost-first: a parent's members include its
 * child containers' frames, so by the time the parent is fitted the child boxes are
 * already known and the parent closes around them rather than around their contents.
 */

import type { Bounds, HolaGraph } from '../core/model.js';
import type { LayoutData, Node } from '../../../types.js';
import type { GridAttachedOptions } from './options.js';

/** One container, with the leaves and containers it directly holds. */
export interface Subgraph {
  id: string;
  node: Node;
  /** Enclosing container id, or `undefined` at the top level. */
  parentId?: string;
  /** Ids of the leaves directly inside, in input order. */
  childLeafIds: string[];
  /** Ids of the containers directly inside, in input order. */
  childGroupIds: string[];
  /** Every leaf below this container, however deeply nested. */
  leafIds: string[];
  /** Distance from the top level; used to fit innermost frames first. */
  depth: number;
  /** Clearance the container's own title needs at the top of the frame. */
  titleHeight: number;
}

export interface SubgraphModel {
  /** Containers, deepest first, so fitting in order closes children before parents. */
  ordered: Subgraph[];
  byId: Map<string, Subgraph>;
  /** The container a leaf sits directly inside, if any. */
  parentOfLeaf: Map<string, string>;
}

/**
 * Read the hierarchy off `parentId`.
 *
 * A container parented to a container that is not in the diagram, or a cycle in
 * `parentId`, would both be malformed input; the walk is bounded either way and
 * treats what it cannot resolve as top level.
 */
export function collectSubgraphs(data: LayoutData): SubgraphModel {
  const nodes = data.nodes ?? [];
  const byNodeId = new Map(nodes.map((node) => [node.id, node]));
  const groupNodes = nodes.filter((node) => node.isGroup === true);
  const groupIds = new Set(groupNodes.map((node) => node.id));

  const byId = new Map<string, Subgraph>();
  for (const node of groupNodes) {
    const parentId =
      node.parentId !== undefined && groupIds.has(node.parentId) ? node.parentId : undefined;
    byId.set(node.id, {
      id: node.id,
      node,
      parentId,
      childLeafIds: [],
      childGroupIds: [],
      leafIds: [],
      depth: 0,
      titleHeight: node.labelBBox?.height ?? 0,
    });
  }

  for (const group of byId.values()) {
    if (group.parentId !== undefined) {
      byId.get(group.parentId)?.childGroupIds.push(group.id);
    }
    group.depth = depthOf(group.id, byId);
  }

  const parentOfLeaf = new Map<string, string>();
  for (const node of nodes) {
    if (node.isGroup === true) {
      continue;
    }
    const direct = node.parentId !== undefined ? byId.get(node.parentId) : undefined;
    if (direct) {
      direct.childLeafIds.push(node.id);
      parentOfLeaf.set(node.id, direct.id);
    }
    // Every ancestor holds this leaf, which is what a frame has to contain.
    for (const ancestorId of ancestorsOf(node, byNodeId, groupIds)) {
      byId.get(ancestorId)?.leafIds.push(node.id);
    }
  }

  const ordered = [...byId.values()].sort((a, b) => b.depth - a.depth || a.id.localeCompare(b.id));
  return { ordered, byId, parentOfLeaf };
}

/** Container ids enclosing `node`, innermost first. */
export function ancestorsOf(
  node: Node,
  byNodeId: ReadonlyMap<string, Node>,
  groupIds: ReadonlySet<string>
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let parentId = node.parentId;
  while (parentId !== undefined && !seen.has(parentId)) {
    seen.add(parentId);
    if (groupIds.has(parentId)) {
      out.push(parentId);
    }
    parentId = byNodeId.get(parentId)?.parentId;
  }
  return out;
}

function depthOf(id: string, byId: ReadonlyMap<string, Subgraph>): number {
  let depth = 0;
  const seen = new Set<string>();
  let current = byId.get(id)?.parentId;
  while (current !== undefined && !seen.has(current)) {
    seen.add(current);
    depth++;
    current = byId.get(current)?.parentId;
  }
  return depth;
}

/** A fitted frame, and whether it can be drawn without lying about what it holds. */
export interface FittedFrame {
  id: string;
  bounds: Bounds;
  /** Ids of nodes inside the box that the container does not own. */
  foreign: string[];
  /**
   * True when the container holds nothing drawn, so its box was invented rather
   * than fitted. It still needs a position that is clear of the drawing, which the
   * caller gives it once the drawing's extent is known.
   */
  needsPlacing: boolean;
}

/** A frame while its sibling clearance is still being resolved. */
interface FrameCandidate {
  group: Subgraph;
  /** Bounds of the owned contents before the border padding is added. */
  inner?: Bounds;
  bounds: Bounds;
  needsPlacing: boolean;
}

/** Space that keeps two sibling borders visually distinct. */
const SIBLING_FRAME_GUTTER = 8;

/**
 * Fit a frame around every container's members and write it onto the container
 * node, innermost first.
 *
 * Only the leaves that were actually drawn count: a leaf whose component reached
 * no route is not in `positions`, and a frame stretched to reach it would be
 * reserving space for something nobody can see.
 */
export function fitSubgraphFrames(
  model: SubgraphModel,
  drawn: readonly Node[],
  options: GridAttachedOptions
): FittedFrame[] {
  const boxByNodeId = new Map<string, Bounds>();
  for (const node of drawn) {
    const box = boxOf(node);
    if (box) {
      boxByNodeId.set(node.id, box);
    }
  }

  const candidates = new Map<string, FrameCandidate>();
  const depths = [...new Set(model.ordered.map((group) => group.depth))].sort((a, b) => b - a);
  for (const depth of depths) {
    const level = model.ordered
      .filter((group) => group.depth === depth)
      .map((group) => fitFrameCandidate(group, boxByNodeId, options));

    // A child frame is a member of its parent, so this has to happen depth by
    // depth. Once sibling border padding is tightened, the next parent sees the
    // final child box rather than an outdated, overlapping one.
    separateSiblingFrameBorders(level, SIBLING_FRAME_GUTTER);
    for (const candidate of level) {
      writeFrame(candidate.group.node, candidate.bounds);
      boxByNodeId.set(candidate.group.id, candidate.bounds);
      candidates.set(candidate.group.id, candidate);
    }
  }

  return model.ordered.flatMap((group) => {
    const candidate = candidates.get(group.id);
    if (!candidate) {
      return [];
    }
    return [
      {
        id: group.id,
        bounds: candidate.bounds,
        foreign: candidate.inner === undefined ? [] : foreignInside(group, candidate.bounds, drawn),
        needsPlacing: candidate.needsPlacing,
      },
    ];
  });
}

function fitFrameCandidate(
  group: Subgraph,
  boxByNodeId: ReadonlyMap<string, Bounds>,
  options: GridAttachedOptions
): FrameCandidate {
  const members: Bounds[] = [];
  for (const leafId of group.childLeafIds) {
    const box = boxByNodeId.get(leafId);
    if (box) {
      members.push(box);
    }
  }
  for (const childId of group.childGroupIds) {
    const box = boxByNodeId.get(childId);
    if (box) {
      members.push(box);
    }
  }

  const inner = unionOf(members);
  if (inner === undefined) {
    return { group, bounds: emptyFrame(group, options), needsPlacing: true };
  }
  const padding = options.groupPadding;
  return {
    group,
    inner,
    bounds: {
      minX: inner.minX - padding,
      minY: inner.minY - padding - group.titleHeight,
      maxX: inner.maxX + padding,
      maxY: inner.maxY + padding,
    },
    needsPlacing: false,
  };
}

function writeFrame(node: Node, bounds: Bounds): void {
  node.x = (bounds.minX + bounds.maxX) / 2;
  node.y = (bounds.minY + bounds.maxY) / 2;
  node.width = bounds.maxX - bounds.minX;
  node.height = bounds.maxY - bounds.minY;
}

/**
 * Sibling contents are allowed to be close; their borders are not allowed to
 * paint through one another. Prefer consuming only the two facing padding strips,
 * which preserves the node positions and every other side of both frames while
 * retaining a visible gutter.
 */
function separateSiblingFrameBorders(
  candidates: readonly FrameCandidate[],
  minimumGap: number
): void {
  for (let firstIndex = 0; firstIndex < candidates.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex++) {
      const first = candidates[firstIndex];
      const second = candidates[secondIndex];
      if (
        first.group.parentId !== second.group.parentId ||
        first.inner === undefined ||
        second.inner === undefined ||
        framesHaveGap(first.bounds, second.bounds, minimumGap)
      ) {
        continue;
      }
      separateFramePair(first, second, minimumGap);
    }
  }
}

function separateFramePair(
  first: FrameCandidate,
  second: FrameCandidate,
  minimumGap: number
): void {
  const horizontal =
    first.bounds.minX + first.bounds.maxX <= second.bounds.minX + second.bounds.maxX
      ? [first, second]
      : [second, first];
  const vertical =
    first.bounds.minY + first.bounds.maxY <= second.bounds.minY + second.bounds.maxY
      ? [first, second]
      : [second, first];
  const horizontalSeparation = separationAlong(horizontal[0].bounds, horizontal[1].bounds, 'x');
  const verticalSeparation = separationAlong(vertical[0].bounds, vertical[1].bounds, 'y');
  const horizontalRequired = minimumGap - horizontalSeparation;
  const verticalRequired = minimumGap - verticalSeparation;
  const horizontalCapacity =
    horizontal[0].bounds.maxX -
    horizontal[0].inner!.maxX +
    (horizontal[1].inner!.minX - horizontal[1].bounds.minX);
  const verticalCapacity =
    vertical[0].bounds.maxY -
    vertical[0].inner!.maxY +
    (vertical[1].inner!.minY - vertical[1].bounds.minY);

  const canSeparateHorizontally =
    horizontalRequired > 0 && horizontalCapacity >= horizontalRequired;
  const canSeparateVertically = verticalRequired > 0 && verticalCapacity >= verticalRequired;
  if (
    canSeparateHorizontally &&
    (!canSeparateVertically || horizontalRequired <= verticalRequired)
  ) {
    consumeFacingPadding(horizontal[0], horizontal[1], horizontalRequired, 'x');
  } else if (canSeparateVertically) {
    consumeFacingPadding(vertical[0], vertical[1], verticalRequired, 'y');
  }
}

function framesHaveGap(first: Bounds, second: Bounds, minimumGap: number): boolean {
  return (
    Math.max(first.minX - second.maxX, second.minX - first.maxX) >= minimumGap ||
    Math.max(first.minY - second.maxY, second.minY - first.maxY) >= minimumGap
  );
}

function separationAlong(first: Bounds, second: Bounds, axis: 'x' | 'y'): number {
  return axis === 'x' ? second.minX - first.maxX : second.minY - first.maxY;
}

function consumeFacingPadding(
  before: FrameCandidate,
  after: FrameCandidate,
  overlap: number,
  axis: 'x' | 'y'
): void {
  const beforePadding =
    axis === 'x'
      ? before.bounds.maxX - before.inner!.maxX
      : before.bounds.maxY - before.inner!.maxY;
  const afterPadding =
    axis === 'x' ? after.inner!.minX - after.bounds.minX : after.inner!.minY - after.bounds.minY;
  let fromBefore = Math.min(beforePadding, overlap / 2);
  let fromAfter = Math.min(afterPadding, overlap - fromBefore);
  const remaining = overlap - fromBefore - fromAfter;
  if (remaining > 0) {
    const extraFromBefore = Math.min(beforePadding - fromBefore, remaining);
    fromBefore += extraFromBefore;
    fromAfter += remaining - extraFromBefore;
  }
  if (axis === 'x') {
    before.bounds.maxX -= fromBefore;
    after.bounds.minX += fromAfter;
  } else {
    before.bounds.maxY -= fromBefore;
    after.bounds.minY += fromAfter;
  }
}

/** Does the frame hold only what its container owns? */
export function frameIsClean(frame: FittedFrame): boolean {
  return frame.foreign.length === 0;
}

/**
 * Drawn nodes inside `bounds` that this container does not own.
 *
 * Containers nested inside it are its own, and so is everything below them; a node
 * belonging to a *sibling* container is not, and neither is a bare node from
 * somewhere else in the drawing.
 */
function foreignInside(group: Subgraph, bounds: Bounds, drawn: readonly Node[]): string[] {
  const own = new Set(group.leafIds);
  const foreign: string[] = [];
  for (const node of drawn) {
    if (node.isGroup === true || own.has(node.id)) {
      continue;
    }
    const box = boxOf(node);
    if (!box) {
      continue;
    }
    if (overlaps(box, bounds)) {
      foreign.push(node.id);
    }
  }
  return foreign;
}

/**
 * A drawable box for a container with nothing in it.
 *
 * Wide enough to read as a frame and to hold its own title, which is all there is
 * to go on: there are no members to measure against.
 */
function emptyFrame(group: Subgraph, options: GridAttachedOptions): Bounds {
  const width = Math.max(group.node.width ?? 0, 4 * options.groupPadding);
  const height = Math.max(group.node.height ?? 0, 2 * options.groupPadding + group.titleHeight);
  return { minX: 0, minY: 0, maxX: width, maxY: height };
}

/**
 * Put every invented frame beside the drawing, in a row, and report the bounds the
 * drawing now needs.
 *
 * Beside rather than inside: an empty container has no members to sit among, and a
 * box dropped into the middle of the drawing would overlap whatever is there.
 */
export function placeEmptyFrames(
  model: SubgraphModel,
  frames: readonly FittedFrame[],
  drawing: Bounds,
  options: GridAttachedOptions
): Bounds {
  let bounds = drawing;
  let x = drawing.maxX + options.componentGap;
  for (const frame of frames) {
    if (!frame.needsPlacing) {
      continue;
    }
    const group = model.byId.get(frame.id);
    if (!group) {
      continue;
    }
    const width = frame.bounds.maxX - frame.bounds.minX;
    const height = frame.bounds.maxY - frame.bounds.minY;
    group.node.x = x + width / 2;
    group.node.y = drawing.minY + height / 2;
    bounds = {
      minX: Math.min(bounds.minX, x),
      minY: Math.min(bounds.minY, drawing.minY),
      maxX: Math.max(bounds.maxX, x + width),
      maxY: Math.max(bounds.maxY, drawing.minY + height),
    };
    x += width + options.componentGap;
  }
  return bounds;
}

function boxOf(node: Node): Bounds | undefined {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  if (node.x === undefined || node.y === undefined || width <= 0 || height <= 0) {
    return undefined;
  }
  return {
    minX: node.x - width / 2,
    minY: node.y - height / 2,
    maxX: node.x + width / 2,
    maxY: node.y + height / 2,
  };
}

function unionOf(boxes: readonly Bounds[]): Bounds | undefined {
  if (boxes.length === 0) {
    return undefined;
  }
  return boxes.reduce((acc, box) => ({
    minX: Math.min(acc.minX, box.minX),
    minY: Math.min(acc.minY, box.minY),
    maxX: Math.max(acc.maxX, box.maxX),
    maxY: Math.max(acc.maxY, box.maxY),
  }));
}

function overlaps(a: Bounds, b: Bounds): boolean {
  const eps = 1e-6;
  return (
    Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > eps &&
    Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) > eps
  );
}

/**
 * Which containers enclose each leaf, innermost first.
 *
 * Wanted before anything is placed, which is why it does not come from
 * {@link collectSubgraphs}: that reads positions and runs at the end, while
 * placement needs membership at the start.
 */
export function subgraphMembership(data: LayoutData): Map<string, string[]> {
  const nodes = data.nodes ?? [];
  const byNodeId = new Map(nodes.map((node) => [node.id, node]));
  const groupIds = new Set(nodes.filter((node) => node.isGroup === true).map((node) => node.id));
  const membership = new Map<string, string[]>();
  if (groupIds.size === 0) {
    return membership;
  }
  for (const node of nodes) {
    if (node.isGroup === true) {
      continue;
    }
    const ancestors = ancestorsOf(node, byNodeId, groupIds);
    if (ancestors.length > 0) {
      membership.set(node.id, ancestors);
    }
  }
  return membership;
}

/**
 * Order components so that the ones sharing a container are packed side by side.
 *
 * This is where most of the scattering comes from, and it is nothing to do with how
 * a tree is placed around a core. Dropping the edges that name a container splits a
 * subgraph's members into separate components — `subgraph-variation`'s three members
 * become three of them — and the packer then lays components out in discovery order,
 * which has no reason to put a container's pieces together. A frame fitted around
 * them afterwards has to reach across whatever the packer put in between.
 *
 * Sorting by the container path, outermost first, is enough to fix that: two
 * components inside the same subgraph share a prefix and land next to each other,
 * and nesting falls out of the same comparison, because a deeper path extends its
 * parent's. Components in no container keep their discovery order among themselves
 * and go last, where they cannot split a frame in half.
 */
export function orderComponentsBySubgraph<T>(
  components: readonly T[],
  nodeIdsOf: (component: T) => readonly string[],
  membership: ReadonlyMap<string, string[]>
): T[] {
  if (membership.size === 0) {
    return [...components];
  }

  const keyed = components.map((component, index) => ({
    component,
    index,
    path: containerPath(nodeIdsOf(component), membership),
  }));

  keyed.sort((a, b) => {
    // No container at all sorts last: such a component cannot break a frame, and
    // moving it would reorder the drawing for nothing.
    if (a.path.length === 0 || b.path.length === 0) {
      if (a.path.length !== b.path.length) {
        return a.path.length === 0 ? 1 : -1;
      }
      return a.index - b.index;
    }
    const compared = a.path.localeCompare(b.path);
    return compared !== 0 ? compared : a.index - b.index;
  });

  return keyed.map((entry) => entry.component);
}

/**
 * The container path shared by a component's nodes, outermost first.
 *
 * A component can straddle containers, so the path taken is the one most of its
 * nodes agree on; ties go to the path that appears first, which keeps the result
 * stable for a given input.
 */
function containerPath(
  nodeIds: readonly string[],
  membership: ReadonlyMap<string, string[]>
): string {
  const counts = new Map<string, number>();
  for (const nodeId of nodeIds) {
    const ancestors = membership.get(nodeId);
    if (!ancestors || ancestors.length === 0) {
      continue;
    }
    // Innermost first on the way in; a path reads outermost first so that a child's
    // path extends its parent's and the two sort together.
    const path = [...ancestors].reverse().join('\u0000');
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }

  let best = '';
  let bestCount = 0;
  for (const [path, count] of counts) {
    if (count > bestCount) {
      best = path;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Which nodes leaf peeling must leave in the core, so no container is split
 * between the core and a tree.
 *
 * A container split that way cannot be repaired later. The core is laid out by
 * grid-like, the trees by HOLA's symmetric tree layout, and where a tree *goes* is
 * decided by a face search that knows nothing about containers — so the two halves
 * of one subgraph end up in different places by construction, and a frame around
 * them has to reach across whatever lies between. Fitting the frame afterwards can
 * only report the problem, which is what it was doing.
 *
 * So the split is prevented instead, at the only point where it is cheap: a
 * container that keeps any member in the core keeps all of them. Naming the members
 * is enough — `decompose` will not peel them, and a protected leaf holds its parent
 * above degree one, so the branch back to the core survives with it.
 *
 * Found as a fixed point, because protecting one container's members grows the core,
 * which can bring a second container into contact with it. Each round protects at
 * least as much as the last and is bounded by the node count, so it settles.
 *
 * A container entirely inside the trees is left alone: it is not split, and forcing
 * it into the core would inflate the core for nothing.
 */
export function nodesToKeepInCore(
  graph: HolaGraph,
  membership: ReadonlyMap<string, string[]>,
  peel: (keepInCore: ReadonlySet<string>) => Iterable<string>,
  maxExtraCoreNodes = Number.POSITIVE_INFINITY
): Set<string> {
  if (membership.size === 0) {
    return new Set();
  }

  // Members present in this component, by container.
  const membersOf = new Map<string, string[]>();
  for (const nodeId of graph.nodes.keys()) {
    for (const containerId of membership.get(nodeId) ?? []) {
      const existing = membersOf.get(containerId);
      if (existing) {
        existing.push(nodeId);
      } else {
        membersOf.set(containerId, [nodeId]);
      }
    }
  }
  if (membersOf.size === 0) {
    return new Set();
  }

  const unprotected = new Set(peel(new Set())).size;

  let keep = new Set<string>();
  for (let round = 0; round <= membersOf.size; round++) {
    const core = new Set(peel(keep));
    const next = new Set(keep);
    for (const [, members] of membersOf) {
      if (members.some((id) => core.has(id))) {
        for (const id of members) {
          next.add(id);
        }
      }
    }
    // Monotone, so a round that adds nothing is the fixed point.
    if (next.size === keep.size) {
      break;
    }
    keep = next;
  }

  if (keep.size === 0 || unprotected === 0) {
    return keep;
  }

  // What holding the containers together costs, and whether it is worth paying.
  //
  // Every node kept out of a tree is a node the core has to lay out, and a core
  // pays for its size twice: grid-like aligns less of it, and this layout asks
  // grid-like for it several times over, once per candidate and once per rung of
  // the enlargement ladder. On a diagram whose containers cover nearly everything
  // — thirteen nested ones over fifty-two nodes — that turns a core of seventeen
  // into a core of thirty-four, takes its aligned edges from all but one to all but
  // thirty, and takes seconds into minutes. Two more frames are not worth that.
  //
  // So the trade is priced rather than assumed, and priced in nodes rather than as a
  // ratio: a three-node core going to five is half again as large and completely
  // harmless, while the ratio that permits it would permit seventeen becoming
  // twenty-five. Keep the containers whole while the core gains no more than
  // `maxExtraCoreNodes`, and report the split otherwise — which is what the frame
  // fitting already does well.
  const grown = new Set(peel(keep)).size;
  if (grown - unprotected > maxExtraCoreNodes) {
    return new Set();
  }
  return keep;
}
