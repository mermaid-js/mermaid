import type { LayoutData } from '../../../types.js';
import { buildLaneModel } from '../lanes.js';
import { collectAnchoredIds } from '../anchoredNodes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };
type Direction = 'LR' | 'RL';
type Axis = 'x' | 'y';

function buildNodeMap(nodes: LayoutNode[]): Map<string, LayoutNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

/**
 * Puts a frame around each pool's lanes, with the pool's own name band to their left.
 *
 * The lanes are already equal width and stacked without gaps, so the pool only has to
 * enclose the run and shift it right to make room for its band. Every lane makes that
 * room, pooled or not, so a diagram mixing the two keeps its lanes aligned.
 *
 * Anchored nodes are not shifted here: they are pinned again from their host's final
 * geometry once this transform has run, so shifting them would be undone anyway.
 */
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
  let depth = 0;
  let parentId = group.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent?.isGroup) {
      break;
    }
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

export function applyLrDirectionTransform(
  layout: LayoutData,
  direction: Direction = 'LR'
): boolean {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  const edges = layout.edges ?? [];
  // An anchored node's position is derived from its host, so it must not steer the
  // aspect ratio or the lane bounds computed below.
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

  const titleBandSize = 36;

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

  for (const n of nodes) {
    // A band is the frame being measured here, so it cannot also count as its own content.
    // Any other group can: its padded box extends past the nodes inside it, and a lane
    // measured from those nodes alone comes out too narrow to contain the group.
    if (laneModel.isLane(n.id) || laneModel.isPool(n.id) || anchoredIds.has(n.id)) {
      continue;
    }
    // The lane model, not resolveTopLevelGroupId: with a pool the outermost group is the
    // pool, so bucketing by it would leave every lane looking empty.
    const laneId = laneModel.laneIdOf(n.id);
    if (!laneId) {
      continue;
    }
    const bucket = childrenByLane.get(laneId) ?? [];
    bucket.push(n);
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

  // A band with no content still has to be drawn. In BPMN that is a black box pool - a
  // participant whose internals are deliberately not shown - and it has no children to
  // derive an extent from, so without this it keeps the zero size it started with and
  // every such band collapses onto the origin, one title overlapping the next.
  //
  // They are stacked below the bands that do have content, which leaves those untouched;
  // placing one back at its declared position would mean moving already-placed nodes.
  const placed = new Set(laneBounds.map((entry) => entry.lane));
  let emptyTop = laneBounds.reduce(
    (lowest, entry) => Math.max(lowest, (entry.lane.y ?? 0) + (entry.lane.height ?? 0) / 2),
    laneBounds.length > 0 ? Number.NEGATIVE_INFINITY : 0
  );
  // A band's title is drawn rotated, so it runs along the band's height and a band
  // shorter than its own name spills text over its neighbours. Text cannot be measured
  // here - `calculateTextDimensions` needs a render tree and there is none during layout -
  // so the run is estimated from the character count at the configured font size. It only
  // has to be close enough to keep a name inside its own band.
  const fontSize = Number.parseFloat(String(layout.config?.fontSize ?? 16)) || 16;
  const estimatedTitleRun = (lane: LayoutNode) =>
    (typeof lane.label === 'string' ? lane.label.length : 0) * fontSize * 0.55;
  for (const lane of laneNodes) {
    if (placed.has(lane)) {
      continue;
    }
    const height = Math.max(
      2 * titleBandSize,
      2 * (lane.padding ?? 0),
      estimatedTitleRun(lane) + titleBandSize
    );
    lane.x = centerX;
    lane.y = emptyTop + height / 2;
    lane.width = laneWidth;
    lane.height = height;
    lane.swimlaneContentTop = emptyTop;
    lane.groupTitleRect = {
      left: laneLeft,
      right: laneLeft + titleBandSize,
      top: emptyTop,
      bottom: emptyTop + height,
    };
    emptyTop += height;
  }

  framePoolsLr(nodes, laneModel, laneLeft, titleBandSize);

  if (direction === 'RL') {
    mirrorAxis(layout, 'x');
  }

  return true;
}
