/* eslint-disable tsdoc/syntax */
import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';

/** A placed rectangle: centre point plus optional measured size. */
export interface NodePosition extends Point {
  width?: number;
  height?: number;
}

export function doesSegmentIntersectNode(
  start: Point,
  end: Point,
  node: NodePosition,
  padding = 20
): boolean {
  if (!node.width || !node.height) {
    return false;
  }

  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    const distToCenter = Math.sqrt(Math.pow(start.x - node.x, 2) + Math.pow(start.y - node.y, 2));
    const effectiveRadius = Math.max(halfWidth, halfHeight) + padding;
    return distToCenter <= effectiveRadius;
  }

  const distanceToLine =
    Math.abs((end.x - start.x) * (start.y - node.y) - (start.x - node.x) * (end.y - start.y)) /
    length;

  const t = ((node.x - start.x) * dx + (node.y - start.y) * dy) / (length * length);
  const effectiveRadius = Math.max(halfWidth, halfHeight) + padding;

  if (t >= 0 && t <= 1) {
    return distanceToLine <= effectiveRadius;
  }

  const distToStart = Math.sqrt(Math.pow(start.x - node.x, 2) + Math.pow(start.y - node.y, 2));
  const distToEnd = Math.sqrt(Math.pow(end.x - node.x, 2) + Math.pow(end.y - node.y, 2));

  return Math.min(distToStart, distToEnd) <= effectiveRadius;
}

/**
 * Returns true if the line segment (p1->p2) intersects the rectangle
 * defined by nodePos. The rectangle is centered at (nodePos.x, nodePos.y)
 * with dimensions (nodePos.width, nodePos.height).
 *
 * @param p1      Start {x,y} of the segment
 * @param p2      End {x,y} of the segment
 * @param nodePos NodePosition containing x,y (center), width, height
 */
export function doesSegmentOverlapNodeRect(p1: Point, p2: Point, nodePos: NodePosition): boolean {
  const halfW = (nodePos.width ?? 0) / 2;
  const halfH = (nodePos.height ?? 0) / 2;

  const left = nodePos.x - halfW;
  const right = nodePos.x + halfW;
  const top = nodePos.y - halfH;
  const bottom = nodePos.y + halfH;

  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < left || minX > right) {
    return false;
  }
  if (maxY < top || minY > bottom) {
    return false;
  }

  if (isInsideRect(p1.x, p1.y, left, right, top, bottom)) {
    return true;
  }
  if (isInsideRect(p2.x, p2.y, left, right, top, bottom)) {
    return true;
  }

  const rectEdges = [
    [
      { x: left, y: top },
      { x: right, y: top },
    ],
    [
      { x: right, y: top },
      { x: right, y: bottom },
    ],
    [
      { x: left, y: bottom },
      { x: right, y: bottom },
    ],
    [
      { x: left, y: top },
      { x: left, y: bottom },
    ],
  ];

  for (const [A, B] of rectEdges) {
    if (doSegmentsIntersect(p1, p2, A, B)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if segments (p1->p2) and (p3->p4) intersect (excluding endpoints that just touch).
 *
 * @param p1 The start of the first segment
 * @param p2 The end of the first segment
 * @param p3 The start of the second segment
 * @param p4 The end of the second segment
 * @returns True if they intersect, false otherwise
 */
export function doSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < 1e-10) {
    const [minX1, maxX1] = [Math.min(p1.x, p2.x), Math.max(p1.x, p2.x)];
    const [minX2, maxX2] = [Math.min(p3.x, p4.x), Math.max(p3.x, p4.x)];

    if (maxX1 < minX2 || maxX2 < minX1) {
      return false;
    }

    const [minY1, maxY1] = [Math.min(p1.y, p2.y), Math.max(p1.y, p2.y)];
    const [minY2, maxY2] = [Math.min(p3.y, p4.y), Math.max(p3.y, p4.y)];

    return !(maxY1 < minY2 || maxY2 < minY1);
  }

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Returns true if (x,y) is within the bounds [left, right], [top, bottom].
 */
function isInsideRect(
  x: number,
  y: number,
  left: number,
  right: number,
  top: number,
  bottom: number
): boolean {
  const padding = 0;
  return (
    x >= left - padding && x <= right + padding / 2 && y >= top - padding && y <= bottom + padding
  );
}

/**
 * Calculates comprehensive bounding information for a group node including
 * position, dimensions, and coordinate boundaries. Updates the group's position
 * and size properties based on its children and content.
 *
 * @param group - The group node to calculate bounds for
 * @param data4Layout - The complete layout data
 * @param nodeMap - Map for efficient node lookups
 * @param groupPadding - Padding to apply around group contents
 * @returns Complete bounds information including center coordinates and dimensions
 */
export function calculateGroupBounds(
  group: Node,
  data4Layout: LayoutData,
  nodeMap: Map<string, Node>,
  groupPadding: number
) {
  const children = data4Layout.nodes.filter((n) => n.parentId === group.id);

  if (children.length === 0) {
    const width = group.width ?? groupPadding * 2;
    const height = group.height ?? groupPadding * 2;
    return {
      minX: group.x! - width / 2,
      minY: group.y! - height / 2,
      maxX: group.x! + width / 2,
      maxY: group.y! + height / 2,
      width,
      height,
      centerX: group.x!,
      centerY: group.y!,
    };
  }

  let minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY;

  children.forEach((child) => {
    const width = child.width ?? (child.isGroup ? 100 : 30);
    const height = child.height ?? (child.isGroup ? 100 : 30);

    minX = Math.min(minX, child.x! - width / 2);
    minY = Math.min(minY, child.y! - height / 2);
    maxX = Math.max(maxX, child.x! + width / 2);
    maxY = Math.max(maxY, child.y! + height / 2);
  });

  data4Layout.nodes.forEach((node: Node) => {
    if (node.isEdgeLabel && node.edgeStart && node.edgeEnd) {
      const startNode = nodeMap.get(node.edgeStart);
      const endNode = nodeMap.get(node.edgeEnd);

      if (startNode?.parentId === group.id && endNode?.parentId === group.id) {
        const width = node.width ?? 40;
        const height = node.height ?? 20;

        minX = Math.min(minX, node.x! - width / 2);
        minY = Math.min(minY, node.y! - height / 2);
        maxX = Math.max(maxX, node.x! + width / 2);
        maxY = Math.max(maxY, node.y! + height / 2);
      }
    }
  });

  const childBoundsBeforeEdges = {
    minX,
    minY,
    maxX,
    maxY,
  };

  data4Layout.edges.forEach((edge: Edge) => {
    if (
      edge.points &&
      nodeMap.get(edge?.start ?? '')?.parentId === group.id &&
      nodeMap.get(edge.end ?? '')?.parentId === group.id
    ) {
      edge.points.forEach((point) => {
        if (isPointWithinThresholdForBounds(point, childBoundsBeforeEdges, 50)) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
      });
    }
  });

  const extraPadding = groupPadding;
  minX -= extraPadding;
  minY -= extraPadding;
  maxX += extraPadding;
  maxY += extraPadding;

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  group.x = centerX;
  group.y = centerY;
  group.width = width;
  group.height = height;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY,
  };
}

/**
 * Checks if a point is within a threshold distance of a bounds rectangle.
 * Points inside the bounds are always included (distance = 0).
 * Points outside are only included if within the threshold distance.
 */
export function isPointWithinThresholdForBounds(
  point: { x: number; y: number },
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  threshold = 50
): boolean {
  if (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  ) {
    return true;
  }

  let dx = 0;
  let dy = 0;

  if (point.x < bounds.minX) {
    dx = bounds.minX - point.x;
  } else if (point.x > bounds.maxX) {
    dx = point.x - bounds.maxX;
  }

  if (point.y < bounds.minY) {
    dy = bounds.minY - point.y;
  } else if (point.y > bounds.maxY) {
    dy = point.y - bounds.maxY;
  }

  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= threshold;
}
