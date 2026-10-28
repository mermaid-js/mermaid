import type { LayoutData } from '../../../types.js';
import { buildLaneModel } from '../lanes.js';
import {
  anchorFootprints,
  collectAnchoredIds,
  type AnchorFootprint,
  type AnchorSide,
} from '../anchoredNodes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };
type Direction = 'LR' | 'RL';
type Axis = 'x' | 'y';

function buildNodeMap(nodes: LayoutNode[]): Map<string, LayoutNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function groupDepth(group: LayoutNode, nodeById: Map<string, LayoutNode>): number {
  const seen = new Set<string>([group.id]);
  let depth = 0;
  let parentId = group.parentId;
  while (parentId && !seen.has(parentId)) {
    const parent = nodeById.get(parentId);
    if (!parent?.isGroup) {
      break;
    }
    seen.add(parentId);
    depth++;
    parentId = parent.parentId;
  }
  return depth;
}

function boundsForChildren(
  children: LayoutNode[]
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const child of children) {
    const cx = child.x;
    const cy = child.y;
    if (typeof cx !== 'number' || typeof cy !== 'number') {
      continue;
    }
    const w = child.width ?? 0;
    const h = child.height ?? 0;
    minX = Math.min(minX, cx - w / 2);
    maxX = Math.max(maxX, cx + w / 2);
    minY = Math.min(minY, cy - h / 2);
    maxY = Math.max(maxY, cy + h / 2);
  }
  if (minX === Infinity || minY === Infinity) {
    return null;
  }
  return { minX, maxX, minY, maxY };
}

function applyGroupBounds(
  group: LayoutNode,
  bounds: NonNullable<ReturnType<typeof boundsForChildren>>
) {
  const pad = group.padding ?? 20;
  group.x = (bounds.minX + bounds.maxX) / 2;
  group.y = (bounds.minY + bounds.maxY) / 2;
  group.width = Math.max(0, bounds.maxX - bounds.minX) + pad;
  group.height = Math.max(0, bounds.maxY - bounds.minY) + pad;
}

function recomputeNestedGroupBounds(nodes: LayoutNode[]): void {
  const nodeById = buildNodeMap(nodes);
  const groupsByDepth = nodes
    .filter((node) => node.isGroup && node.parentId)
    .sort((a, b) => groupDepth(b, nodeById) - groupDepth(a, nodeById));

  for (const group of groupsByDepth) {
    const children = nodes.filter((node) => node.parentId === group.id);
    const bounds = boundsForChildren(children);
    if (bounds) {
      applyGroupBounds(group, bounds);
    }
  }
}

function mirrorAxis(layout: LayoutData, axis: Axis): boolean {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  const edges = layout.edges ?? [];
  const contentNodes = nodes.filter((node) => !node.isGroup);
  let min = Infinity;
  let max = -Infinity;
  for (const node of contentNodes) {
    const value = node[axis];
    if (typeof value !== 'number') {
      continue;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return false;
  }
  const mirror = (value: number) => min + max - value;
  for (const node of nodes) {
    const value = node[axis];
    if (typeof value === 'number') {
      node[axis] = mirror(value);
    }
    const titleRect = node.groupTitleRect;
    if (titleRect) {
      node.groupTitleRect =
        axis === 'x'
          ? {
              ...titleRect,
              left: mirror(titleRect.right),
              right: mirror(titleRect.left),
            }
          : {
              ...titleRect,
              top: mirror(titleRect.bottom),
              bottom: mirror(titleRect.top),
            };
    }
  }
  for (const edge of edges) {
    for (const point of edge.points ?? []) {
      point[axis] = mirror(point[axis]);
    }
  }
  return true;
}

export function applyBtDirectionTransform(layout: LayoutData): boolean {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  if (!nodes.some((node) => !node.isGroup)) {
    return true;
  }

  return mirrorAxis(layout, 'y');
}

/**
 * How far the LR/RL transform stretches the flow axis: the diagram's own nodes' average
 * width over their average height, never below 1. Edge labels and groups do not count, so a
 * label cannot stretch the flow axis.
 */
export function flowAxisStretch(
  nodes: readonly { width?: number; height?: number; isGroup?: boolean; isEdgeLabel?: boolean }[]
): number {
  const scaledNodes = nodes.filter((n) => !n.isGroup && !n.isEdgeLabel);
  if (scaledNodes.length === 0) {
    return 1;
  }
  let totalWidth = 0;
  let totalHeight = 0;
  for (const n of scaledNodes) {
    totalWidth += n.width ?? 0;
    totalHeight += n.height ?? 0;
  }
  const avgWidth = totalWidth / scaledNodes.length;
  const avgHeight = totalHeight / scaledNodes.length;
  return avgHeight > 0 ? Math.max(1, avgWidth / avgHeight) : 1;
}

const LANE_TITLE_BAND = 36;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

type SideFootprints = Partial<Record<AnchorSide, AnchorFootprint>>;

const ANCHOR_SIDES: AnchorSide[] = ['top', 'right', 'bottom', 'left'];

function mirroredSide(side: AnchorSide): AnchorSide {
  if (side === 'left') {
    return 'right';
  }
  return side === 'right' ? 'left' : side;
}

function growAlongBorder(
  box: Box,
  host: Box,
  side: AnchorSide,
  footprint: AnchorFootprint,
  mirrored: boolean
): void {
  if (side === 'top' || side === 'bottom') {
    const centreX = (host.left + host.right) / 2;
    const [before, after] = mirrored
      ? [footprint.after, footprint.before]
      : [footprint.before, footprint.after];
    box.left = Math.min(box.left, centreX - before);
    box.right = Math.max(box.right, centreX + after);
    return;
  }
  const centreY = (host.top + host.bottom) / 2;
  box.top = Math.min(box.top, centreY - footprint.before);
  box.bottom = Math.max(box.bottom, centreY + footprint.after);
}

const GROW_OUTWARD: Record<AnchorSide, (box: Box, host: Box, beyond: number) => void> = {
  top: (box, host, beyond) => {
    box.top = Math.min(box.top, host.top - beyond);
  },
  bottom: (box, host, beyond) => {
    box.bottom = Math.max(box.bottom, host.bottom + beyond);
  },
  left: (box, host, beyond) => {
    box.left = Math.min(box.left, host.left - beyond);
  },
  right: (box, host, beyond) => {
    box.right = Math.max(box.right, host.right + beyond);
  },
};

// Grows `box` to hold a run standing off `host` on `side`: out from that border by `beyond`,
// and along it from `before` to `after` either side of the host's centre. `mirrored` flips
// the x axis, as RL does after the lanes are sized.
function reserveOnSide(
  box: Box,
  host: Box,
  side: AnchorSide,
  footprint: AnchorFootprint,
  mirrored: boolean
): void {
  growAlongBorder(box, host, side, footprint, mirrored);
  GROW_OUTWARD[side](box, host, footprint.beyond);
}

// Grows a host to cover the room each run standing off it is placed in. The runs are keyed by
// the side they stand on as drawn, so RL reserves them on the side the mirror will turn
// into it.
function withAnchorFootprints(
  host: LayoutNode,
  footprints: SideFootprints,
  direction: Direction
): LayoutNode {
  const x = host.x ?? 0;
  const y = host.y ?? 0;
  const halfWidth = (host.width ?? 0) / 2;
  const halfHeight = (host.height ?? 0) / 2;
  const own: Box = {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - halfHeight,
    bottom: y + halfHeight,
  };
  const grown: Box = { ...own };
  const mirrored = direction === 'RL';
  for (const side of ANCHOR_SIDES) {
    const footprint = footprints[side];
    if (footprint) {
      reserveOnSide(grown, own, mirrored ? mirroredSide(side) : side, footprint, mirrored);
    }
  }
  return {
    ...host,
    x: (grown.left + grown.right) / 2,
    y: (grown.top + grown.bottom) / 2,
    width: grown.right - grown.left,
    height: grown.bottom - grown.top,
  };
}

export function applyLrDirectionTransform(
  layout: LayoutData,
  direction: Direction = 'LR'
): boolean {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  const edges = layout.edges ?? [];
  const anchoredIds = collectAnchoredIds(nodes);
  const contentNodes = nodes.filter((n) => !n.isGroup && !anchoredIds.has(n.id));

  let minX = Infinity;
  let minY = Infinity;
  for (const n of contentNodes) {
    const x0 = n.x ?? 0;
    const y0 = n.y ?? 0;
    if (x0 < minX) {
      minX = x0;
    }
    if (y0 < minY) {
      minY = y0;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return false;
  }

  const titleBandSize = LANE_TITLE_BAND;

  const horizontalScaleFactor = flowAxisStretch(contentNodes);

  for (const n of contentNodes) {
    const x0 = n.x ?? 0;
    const y0 = n.y ?? 0;
    const newX = (y0 - minY) * horizontalScaleFactor + titleBandSize;
    const newY = x0 - minX;

    n.x = newX;
    n.y = newY;
  }

  for (const e of edges) {
    if (!e.points) {
      continue;
    }
    for (const p of e.points) {
      const x0 = p.x;
      const y0 = p.y;
      const newX = (y0 - minY) * horizontalScaleFactor + titleBandSize;
      const newY = x0 - minX;
      p.x = newX;
      p.y = newY;
    }
  }

  recomputeNestedGroupBounds(nodes);

  const laneModel = buildLaneModel(nodes);
  const laneNodes = nodes.filter((n) => laneModel.isLane(n.id));
  if (laneNodes.length === 0) {
    if (direction === 'RL') {
      mirrorAxis(layout, 'x');
    }
    return true;
  }

  const childrenByLane = new Map<string, LayoutNode[]>();
  const footprints = anchorFootprints(nodes, direction);

  for (const n of nodes) {
    if (laneModel.isLane(n.id) || laneModel.isPool(n.id) || anchoredIds.has(n.id)) {
      continue;
    }
    const laneId = laneModel.laneIdOf(n.id);
    if (!laneId) {
      continue;
    }
    const bucket = childrenByLane.get(laneId) ?? [];
    const footprint = footprints.get(n.id);
    bucket.push(footprint ? withAnchorFootprints(n, footprint, direction) : n);
    childrenByLane.set(laneId, bucket);
  }

  let maxPad = 0;
  for (const lane of laneNodes) {
    const pad = lane.padding ?? 0;
    if (pad > maxPad) {
      maxPad = pad;
    }
  }

  const laneBounds: {
    lane: LayoutNode;
    contentTop: number;
    contentBottom: number;
    centerY: number;
  }[] = [];
  let globalMinXChild = Infinity;
  let globalMaxXChild = -Infinity;

  for (const lane of laneNodes) {
    const children = childrenByLane.get(lane.id) ?? [];
    const bounds = boundsForChildren(children);
    if (!bounds) {
      continue;
    }
    globalMinXChild = Math.min(globalMinXChild, bounds.minX);
    globalMaxXChild = Math.max(globalMaxXChild, bounds.maxX);

    laneBounds.push({
      lane,
      contentTop: bounds.minY,
      contentBottom: bounds.maxY,
      centerY: (bounds.minY + bounds.maxY) / 2,
    });
  }

  if (globalMinXChild === Infinity || globalMaxXChild === -Infinity) {
    return true;
  }

  const fullContentWidth = Math.max(0, globalMaxXChild - globalMinXChild);
  const horizontalMargin = Math.max(maxPad, 10);
  const bodyWidth = fullContentWidth + 2 * horizontalMargin;
  const laneWidth = titleBandSize + bodyWidth;
  const bodyCenter = (globalMinXChild + globalMaxXChild) / 2;
  const bodyLeft = bodyCenter - bodyWidth / 2;
  const laneLeft = bodyLeft - titleBandSize;
  const centerX = laneLeft + laneWidth / 2;
  const verticalMargin = Math.max(maxPad, titleBandSize);

  laneBounds.sort((a, b) => a.centerY - b.centerY);

  for (let i = 0; i < laneBounds.length; i++) {
    const curr = laneBounds[i];
    let laneTop: number;
    let laneBottom: number;

    if (i === 0) {
      laneTop = curr.contentTop - verticalMargin;
    } else {
      const prev = laneBounds[i - 1];
      laneTop = (prev.contentBottom + curr.contentTop) / 2;
    }

    if (i === laneBounds.length - 1) {
      laneBottom = curr.contentBottom + verticalMargin;
    } else {
      const next = laneBounds[i + 1];
      laneBottom = (curr.contentBottom + next.contentTop) / 2;
    }

    const laneHeight = Math.max(0, laneBottom - laneTop);
    const centerY = (laneTop + laneBottom) / 2;

    curr.lane.x = centerX;
    curr.lane.y = centerY;
    curr.lane.width = laneWidth;
    curr.lane.height = laneHeight;
    curr.lane.swimlaneContentTop = curr.contentTop;
    curr.lane.groupTitleRect = {
      left: laneLeft,
      right: laneLeft + titleBandSize,
      top: laneTop,
      bottom: laneBottom,
    };
  }

  if (direction === 'RL') {
    mirrorAxis(layout, 'x');
  }

  return true;
}
