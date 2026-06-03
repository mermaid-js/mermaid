import type { LayoutData } from '../../../types.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };
type Direction = 'LR' | 'RL';
type Axis = 'x' | 'y';

function buildNodeMap(nodes: LayoutNode[]): Map<string, LayoutNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function resolveTopLevelGroupId(
  node: LayoutNode,
  nodeById: Map<string, LayoutNode>
): string | null {
  let parentId = node.parentId;
  let topLevelGroupId: string | null = null;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent?.isGroup) {
      break;
    }
    topLevelGroupId = parent.id;
    parentId = parent.parentId;
  }
  return topLevelGroupId;
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
  const contentNodes = nodes.filter((n) => !n.isGroup);

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

  const laneNodes = nodes.filter((n) => n.isGroup && !n.parentId);
  if (laneNodes.length === 0) {
    if (direction === 'RL') {
      mirrorAxis(layout, 'x');
    }
    return true;
  }

  const nodeById = buildNodeMap(nodes);
  const childrenByLane = new Map<string, LayoutNode[]>();

  for (const n of nodes) {
    if (n.isGroup) {
      continue;
    }
    const laneId = resolveTopLevelGroupId(n, nodeById);
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
  }

  if (direction === 'RL') {
    mirrorAxis(layout, 'x');
  }

  return true;
}
