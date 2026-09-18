import type { LayoutData } from '../../../types.js';
import { buildLaneModel } from '../lanes.js';
import { anchorFootprints, collectAnchoredIds } from '../anchoredNodes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };
type Direction = 'LR' | 'RL';
type Axis = 'x' | 'y';

function buildNodeMap(nodes: LayoutNode[]): Map<string, LayoutNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function framePoolsLr(
  nodes: LayoutNode[],
  laneModel: ReturnType<typeof buildLaneModel>,
  laneLeft: number,
  titleBandSize: number
): void {
  if (!laneModel.hasPools) {
    return;
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const poolBand = titleBandSize;
  const anchoredIds = collectAnchoredIds(nodes);

  for (const node of nodes) {
    if (laneModel.isLane(node.id) && typeof node.x === 'number') {
      node.x += poolBand;
      if (node.groupTitleRect) {
        node.groupTitleRect.left += poolBand;
        node.groupTitleRect.right += poolBand;
      }
    }
  }
  for (const node of nodes) {
    if (
      !laneModel.isLane(node.id) &&
      !node.isGroup &&
      !anchoredIds.has(node.id) &&
      typeof node.x === 'number'
    ) {
      node.x += poolBand;
    }
  }

  for (const [poolId, laneIds] of laneModel.lanesByPool) {
    const pool = byId.get(poolId);
    const lanes = laneIds
      .map((id: string) => byId.get(id))
      .filter((lane): lane is LayoutNode => Boolean(lane));
    if (!pool || lanes.length === 0) {
      continue;
    }
    const top = Math.min(...lanes.map((lane) => (lane.y ?? 0) - (lane.height ?? 0) / 2));
    const bottom = Math.max(...lanes.map((lane) => (lane.y ?? 0) + (lane.height ?? 0) / 2));
    const right = Math.max(...lanes.map((lane) => (lane.x ?? 0) + (lane.width ?? 0) / 2));
    const left = laneLeft;

    pool.x = (left + right) / 2;
    pool.width = right - left;
    pool.y = (top + bottom) / 2;
    pool.height = bottom - top;
    pool.swimlaneContentTop = top;
    pool.groupTitleRect = { left, right: left + poolBand, top, bottom };
  }
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

const LANE_TITLE_BAND = 36;

function stackEmptyBands(
  bands: LayoutNode[],
  opts: {
    top: number;
    centerX: number;
    laneLeft: number;
    laneWidth: number;
    titleBandSize: number;
    fontSize: number;
  }
): void {
  let top = opts.top;
  for (const band of bands) {
    const titleRun =
      (typeof band.label === 'string' ? band.label.length : 0) * opts.fontSize * 0.55;
    const height = Math.max(
      2 * opts.titleBandSize,
      2 * (band.padding ?? 0),
      titleRun + opts.titleBandSize
    );
    band.x = opts.centerX;
    band.y = top + height / 2;
    band.width = opts.laneWidth;
    band.height = height;
    band.swimlaneContentTop = top;
    band.groupTitleRect = {
      left: opts.laneLeft,
      right: opts.laneLeft + opts.titleBandSize,
      top,
      bottom: top + height,
    };
    top += height;
  }
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
    const emptyModel = buildLaneModel(nodes);
    const emptyBands = nodes.filter((n) => emptyModel.isLane(n.id));
    if (emptyBands.length === 0) {
      return false;
    }
    const titleBand = LANE_TITLE_BAND;
    const bandWidth = 6 * titleBand;
    stackEmptyBands(emptyBands, {
      top: 0,
      centerX: titleBand + bandWidth / 2,
      laneLeft: titleBand,
      laneWidth: bandWidth,
      titleBandSize: titleBand,
      fontSize: Number.parseFloat(String(layout.config?.fontSize ?? 16)) || 16,
    });
    framePoolsLr(nodes, emptyModel, titleBand, titleBand);
    if (direction === 'RL') {
      mirrorAxis(layout, 'x');
    }
    return true;
  }

  const titleBandSize = LANE_TITLE_BAND;

  let totalWidth = 0;
  let totalHeight = 0;
  for (const n of contentNodes) {
    totalWidth += n.width ?? 0;
    totalHeight += n.height ?? 0;
  }
  const avgWidth = totalWidth / contentNodes.length;
  const avgHeight = totalHeight / contentNodes.length;
  const horizontalScaleFactor = avgHeight > 0 ? Math.max(1, avgWidth / avgHeight) : 1;

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
    bucket.push(
      footprint
        ? {
            ...n,
            y: (n.y ?? 0) + footprint.beyond / 2,
            width: Math.max(n.width ?? 0, 2 * footprint.across),
            height: (n.height ?? 0) + footprint.beyond,
          }
        : n
    );
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
    const emptyWidth = 6 * titleBandSize;
    stackEmptyBands(laneNodes, {
      top: 0,
      centerX: titleBandSize + emptyWidth / 2,
      laneLeft: titleBandSize,
      laneWidth: emptyWidth,
      titleBandSize,
      fontSize: Number.parseFloat(String(layout.config?.fontSize ?? 16)) || 16,
    });
    framePoolsLr(nodes, laneModel, titleBandSize, titleBandSize);
    if (direction === 'RL') {
      mirrorAxis(layout, 'x');
    }
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

  const placed = new Set(laneBounds.map((entry) => entry.lane));
  stackEmptyBands(
    laneNodes.filter((lane) => !placed.has(lane)),
    {
      top: laneBounds.reduce(
        (lowest, entry) => Math.max(lowest, (entry.lane.y ?? 0) + (entry.lane.height ?? 0) / 2),
        laneBounds.length > 0 ? Number.NEGATIVE_INFINITY : 0
      ),
      centerX,
      laneLeft,
      laneWidth,
      titleBandSize,
      fontSize: Number.parseFloat(String(layout.config?.fontSize ?? 16)) || 16,
    }
  );

  framePoolsLr(nodes, laneModel, laneLeft, titleBandSize);

  if (direction === 'RL') {
    mirrorAxis(layout, 'x');
  }

  return true;
}
