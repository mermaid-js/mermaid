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

import type { Bounds } from '../hola-faithful/model.js';
import type { LayoutData, Node } from '../../types.js';
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

  const frames: FittedFrame[] = [];
  for (const group of model.ordered) {
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

    const padding = options.groupPadding;
    const inner = unionOf(members);
    const bounds =
      inner === undefined
        ? // Nothing inside. The container keeps a drawable box of its own rather
          // than a zero-sized one, which would paint as a stray line.
          emptyFrame(group, options)
        : {
            minX: inner.minX - padding,
            minY: inner.minY - padding - group.titleHeight,
            maxX: inner.maxX + padding,
            maxY: inner.maxY + padding,
          };

    // Written before the next (shallower) container is fitted, so a parent sees
    // this frame as one of its own members.
    group.node.x = (bounds.minX + bounds.maxX) / 2;
    group.node.y = (bounds.minY + bounds.maxY) / 2;
    group.node.width = bounds.maxX - bounds.minX;
    group.node.height = bounds.maxY - bounds.minY;
    boxByNodeId.set(group.id, bounds);

    // An empty container owns nothing, so asking what foreign nodes its box covers
    // is not a meaningful question — the box is not a claim about any content. It
    // gets a position clear of the drawing instead.
    frames.push({
      id: group.id,
      bounds,
      foreign: inner === undefined ? [] : foreignInside(group, bounds, drawn),
      needsPlacing: inner === undefined,
    });
  }

  return frames;
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
