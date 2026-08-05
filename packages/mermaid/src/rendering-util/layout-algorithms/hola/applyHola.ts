import type { Edge, LayoutData, Node } from '../../types.js';
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  GROUP_OVERLAP_MAX_ITERATIONS,
  GROUP_SIBLING_SPACING,
  GROUP_SYMMETRY_THRESHOLD,
} from './Constants.js';
import { calculateGroupBounds, isPointWithinThresholdForBounds } from './utils.js';

interface GroupBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Checks and adjusts positions of nodes that overlap with group boundaries.
 * For nodes that are positioned inside or too close to group containers,
 * this function moves them to appropriate positions outside the groups
 * while maintaining proper spacing and connection considerations.
 *
 * @param data4Layout - The layout data containing nodes and edges
 */
export function checkAllChildrenInGroup(data4Layout: LayoutData) {
  const nodes = data4Layout.nodes;
  const groupNodes = nodes.filter((n) => n.isGroup);
  const groupIds = new Set(groupNodes.map((n) => n.id));

  nodes.forEach((node) => {
    if (node.parentId && !groupIds.has(node.parentId)) {
      const parentGroup = nodes.find((n) => n.id === node.parentId && n.isGroup);
      node.parentId = undefined;
      if (parentGroup && typeof parentGroup.x === 'number' && typeof parentGroup.y === 'number') {
        node.x =
          (typeof node.x === 'number' ? node.x : parentGroup.x) + (parentGroup.width ?? 100) + 40;
        node.y =
          (typeof node.y === 'number' ? node.y : parentGroup.y) + (parentGroup.height ?? 60) + 40;
      }
    }
  });

  nodes.forEach((node) => {
    if (
      !node.isLabelNode &&
      !node.isGroup &&
      typeof node.x === 'number' &&
      typeof node.y === 'number'
    ) {
      for (const group of groupNodes) {
        if (node.parentId && node.parentId === group.id) {
          continue;
        }
        if (node.parentId && node.parentId === group.id) {
          continue;
        }

        if (node.parentId && group.parentId && group.parentId !== node.parentId) {
          continue;
        }
        if (node.parentId && group.parentId !== node.parentId) {
          continue;
        }

        if (
          typeof group.x === 'number' &&
          typeof group.y === 'number' &&
          typeof group.width === 'number' &&
          typeof group.height === 'number'
        ) {
          const left = group.x - group.width / 2;
          const right = group.x + group.width / 2;
          const top = group.y - group.height / 2;
          const bottom = group.y + group.height / 2;

          const nodeWidth = node.width ?? DEFAULT_NODE_WIDTH;
          const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT;
          const nodeLeft = (node.x ?? 0) - nodeWidth / 2;
          const nodeRight = (node.x ?? 0) + nodeWidth / 2;
          const nodeTop = (node.y ?? 0) - nodeHeight / 2;
          const nodeBottom = (node.y ?? 0) + nodeHeight / 2;
          const tolerance = 5;

          const isInsideGroup =
            nodeRight > left - tolerance &&
            nodeLeft < right + tolerance &&
            nodeBottom > top - tolerance &&
            nodeTop < bottom + tolerance;

          if (isInsideGroup) {
            const distances = [
              { dir: 'left', dist: node.x - left },
              { dir: 'right', dist: right - node.x },
              { dir: 'top', dist: node.y - top },
              { dir: 'bottom', dist: bottom - node.y },
            ];

            const closest = distances.reduce(
              (min, d) => (d.dist < min.dist ? d : min),
              distances[0]
            );

            const nodeWidth = node.width ?? DEFAULT_NODE_WIDTH;
            const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT;

            const groupChildren = nodes.filter((n) => n.parentId === group.id && !n.isGroup);
            const hasDirectConnection = data4Layout.edges.some((edge) => {
              const connectsToGroup = groupChildren.some(
                (child) =>
                  (edge.start === node.id && edge.end === child.id) ||
                  (edge.start === child.id && edge.end === node.id)
              );
              return connectsToGroup;
            });

            const minOffset = hasDirectConnection ? 80 : 60;

            switch (closest.dir) {
              case 'left':
                node.x = left - nodeWidth / 2 - minOffset;
                break;
              case 'right':
                node.x = right + nodeWidth / 2 + minOffset;
                break;
              case 'top':
                node.y = top - nodeHeight / 2 - minOffset;
                break;
              case 'bottom':
                node.y = bottom + nodeHeight / 2 + minOffset;
                break;
            }

            break;
          }
        }
      }
    }
  });
}

interface LayoutGroupOptions {
  groupPadding?: number;
  minHorizontalSpacing?: number;
  maxIterations?: number;
  coolingFactor?: number;
  maintainSymmetry?: boolean;
}

/**
 * Configures and applies layout positioning for group nodes (subgraphs) in the diagram.
 * This function processes group hierarchies, calculates appropriate bounds for each group
 * based on their children, and ensures proper nesting and containment.
 *
 * @param data4Layout - The layout data containing nodes and edges
 * @param options - Layout options including group padding and spacing parameters
 * @param nodeMap - Map of node IDs to Node objects for efficient lookups
 */
export function layoutGroups(
  data4Layout: LayoutData,
  options: number | LayoutGroupOptions = {},
  nodeMap: Map<string, Node>
): void {
  const config: LayoutGroupOptions =
    typeof options === 'number' ? { groupPadding: options } : options;

  const { groupPadding = 15 } = config;

  const groupHierarchy = new Map<string, string[]>();
  const rootGroups: string[] = [];

  data4Layout.nodes.forEach((node) => {
    if (node.isGroup) {
      if (!node.parentId) {
        rootGroups.push(node.id);
      } else {
        if (!groupHierarchy.has(node.parentId)) {
          groupHierarchy.set(node.parentId, []);
        }
        groupHierarchy.get(node.parentId)!.push(node.id);
      }
    }
  });

  /**
   * Processes group hierarchy recursively, starting from leaf groups and working up.
   * Calculates and applies proper positioning and sizing for each group based on
   * its children and their layouts.
   *
   * @param groupIds - Array of group IDs to process
   */
  /**
   * Processes group hierarchy recursively, starting from leaf groups and working up.
   * Calculates and applies proper positioning and sizing for each group based on
   * its children and their layouts.
   *
   * @param groupIds - Array of group IDs to process
   */
  function processGroupHierarchy(groupIds: string[]) {
    groupIds.forEach((groupId) => {
      const childGroups = groupHierarchy.get(groupId) ?? [];
      if (childGroups.length > 0) {
        processGroupHierarchy(childGroups);
      }
    });

    groupIds.forEach((groupId) => {
      const groupNode = data4Layout.nodes.find((n) => n.id === groupId);
      if (!groupNode) {
        return;
      }

      const directChildren = data4Layout.nodes.filter((n) => n.parentId == groupId);

      if (directChildren.length === 0) {
        groupNode.width = groupPadding * 4;
        groupNode.height = groupPadding * 4;
        return;
      }
      const bounds = calculateGroupBounds(groupNode, data4Layout, nodeMap, groupPadding);

      groupNode.x = (bounds.minX + bounds.maxX) / 2;
      groupNode.y = (bounds.minY + bounds.maxY) / 2;
      groupNode.width = bounds.maxX - bounds.minX + groupPadding * 2;
      groupNode.height = bounds.maxY - bounds.minY + groupPadding * 2;
    });
  }

  processGroupHierarchy(rootGroups);
}

/**
 * Calculates the bounding rectangle for a group node based on its children.
 * This is a standalone version of the bounds calculation used in various contexts.
 *
 * @param groupNode - The group node to calculate bounds for
 * @param children - Array of child nodes within the group
 * @param edges - Array of edges in the layout
 * @param nodeMap - Map for efficient node lookups
 * @param data4Layout - Complete layout data
 * @param groupPadding - Padding to add around the group bounds
 * @returns Bounding rectangle with minX, minY, maxX, maxY properties
 */
export function getGroupBounds(
  groupNode: Node,
  children: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>,
  data4Layout: LayoutData,
  groupPadding: number
) {
  if (children.length === 0) {
    return {
      minX: groupNode.x! - groupPadding,
      minY: groupNode.y! - groupPadding,
      maxX: groupNode.x! + groupPadding,
      maxY: groupNode.y! + groupPadding,
    };
  }

  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  children.forEach((child) => {
    const width = child.width || (child.isGroup ? 100 : 30);
    const height = child.height || (child.isGroup ? 100 : 30);
    if (
      typeof child.x !== 'number' ||
      typeof child.y !== 'number' ||
      isNaN(child.x) ||
      isNaN(child.y)
    ) {
      return;
    }
    bounds.minX = Math.min(bounds.minX, child.x - width / 2);
    bounds.minY = Math.min(bounds.minY, child.y - height / 2);
    bounds.maxX = Math.max(bounds.maxX, child.x + width / 2);
    bounds.maxY = Math.max(bounds.maxY, child.y + height / 2);
  });

  const subgroups = children.filter((c) => c.isGroup);
  if (subgroups.length > 1) {
    const xCoords = subgroups.map((g) => g.x!);
    const yCoords = subgroups.map((g) => g.y!);

    const yVariance = Math.max(...yCoords) - Math.min(...yCoords);
    if (yVariance < 50) {
      const sortedGroups = subgroups.sort((a, b) => a.x! - b.x!);

      let totalSubgroupWidth = 0;
      let prevRight = sortedGroups[0].x! - sortedGroups[0].width! / 2;

      sortedGroups.forEach((group) => {
        const left = group.x! - group.width! / 2;
        totalSubgroupWidth += Math.max(0, left - prevRight) + group.width!;
        prevRight = group.x! + group.width! / 2;
      });

      const currentWidth = bounds.maxX - bounds.minX;
      if (totalSubgroupWidth > currentWidth) {
        const centerX = (Math.min(...xCoords) + Math.max(...xCoords)) / 2;
        bounds.minX = centerX - totalSubgroupWidth / 2;
        bounds.maxX = centerX + totalSubgroupWidth / 2;
      }
    }
  }

  data4Layout.nodes.forEach((node) => {
    if (node.isEdgeLabel && node.edgeStart && node.edgeEnd) {
      const startNode = nodeMap.get(node.edgeStart);
      const endNode = nodeMap.get(node.edgeEnd);

      if (startNode?.parentId === groupNode.id && endNode?.parentId === groupNode.id) {
        const width = node.width ?? DEFAULT_NODE_WIDTH;
        const height = node.height ?? DEFAULT_NODE_HEIGHT;

        bounds.minX = Math.min(bounds.minX, node.x! - width / 2);
        bounds.minY = Math.min(bounds.minY, node.y! - height / 2);
        bounds.maxX = Math.max(bounds.maxX, node.x! + width / 2);
        bounds.maxY = Math.max(bounds.maxY, node.y! + height / 2);
      }
    }
  });

  const childBoundsForGetGroupBounds = {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
  };

  edges.forEach((edge: Edge) => {
    if (
      edge.points &&
      nodeMap.get(edge?.start ?? '')?.parentId === groupNode.id &&
      nodeMap.get(edge.end ?? '')?.parentId === groupNode.id
    ) {
      edge.points.forEach((point) => {
        if (isPointWithinThresholdForBounds(point, childBoundsForGetGroupBounds, 50)) {
          bounds.minX = Math.min(bounds.minX, point.x);
          bounds.minY = Math.min(bounds.minY, point.y);
          bounds.maxX = Math.max(bounds.maxX, point.x);
          bounds.maxY = Math.max(bounds.maxY, point.y);
        }
      });
    }
  });

  bounds.minX -= groupPadding;
  bounds.minY -= groupPadding;
  bounds.maxX += groupPadding;
  bounds.maxY += groupPadding;

  const minWidth = groupPadding * 2;
  const minHeight = groupPadding * 2;

  if (bounds.maxX - bounds.minX < minWidth) {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    bounds.minX = centerX - minWidth / 2;
    bounds.maxX = centerX + minWidth / 2;
  }

  if (bounds.maxY - bounds.minY < minHeight) {
    const centerY = (bounds.minY + bounds.maxY) / 2;
    bounds.minY = centerY - minHeight / 2;
    bounds.maxY = centerY + minHeight / 2;
  }

  return bounds;
}

/**
 * Resolves overlapping groups by detecting collisions and applying appropriate
 * separation forces. Uses iterative displacement to achieve minimum spacing
 * requirements while maintaining symmetry and hierarchical relationships.
 *
 * @param data4Layout - The layout data containing nodes and edges
 * @param groupPadding - Base padding value for groups
 * @param nodeMap - Map of node IDs to Node objects for efficient lookups
 */
export function resolveGroupOverlaps(
  data4Layout: LayoutData,
  groupPadding: number,
  nodeMap: Map<string, Node>
): void {
  const groupNodes = data4Layout.nodes.filter((n) => n.isGroup);
  const MIN_SPACING = GROUP_SIBLING_SPACING;
  const SYMMETRY_THRESHOLD = GROUP_SYMMETRY_THRESHOLD;

  const groupBounds = new Map<string, GroupBounds>();

  groupNodes.forEach((group) => {
    const bounds = calculateGroupBounds(group, data4Layout, nodeMap, groupPadding);
    groupBounds.set(group.id, bounds);
  });

  let maxIterations = GROUP_OVERLAP_MAX_ITERATIONS;
  let hasOverlaps = true;

  while (hasOverlaps && maxIterations > 0) {
    hasOverlaps = false;
    maxIterations--;

    const nodesByParent = new Map<string | undefined, Node[]>();
    groupNodes.forEach((group) => {
      const parentId = group.parentId;
      if (!nodesByParent.has(parentId)) {
        nodesByParent.set(parentId, []);
      }
      nodesByParent.get(parentId)!.push(group);
    });

    nodesByParent.forEach((siblingGroups) => {
      siblingGroups.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

      for (let i = 0; i < siblingGroups.length; i++) {
        const group1 = siblingGroups[i];
        const bounds1 = groupBounds.get(group1.id)!;

        for (let j = i + 1; j < siblingGroups.length; j++) {
          const group2 = siblingGroups[j];
          const bounds2 = groupBounds.get(group2.id)!;

          if (group1.parentId === group2.id || group2.parentId === group1.id) {
            continue;
          }

          let horizontalGap = Number.MAX_VALUE;
          let verticalGap = Number.MAX_VALUE;

          if (bounds1.centerX < bounds2.centerX) {
            horizontalGap = bounds2.minX - bounds1.maxX;
          } else {
            horizontalGap = bounds1.minX - bounds2.maxX;
          }

          if (bounds1.centerY < bounds2.centerY) {
            verticalGap = bounds2.minY - bounds1.maxY;
          } else {
            verticalGap = bounds1.minY - bounds2.maxY;
          }

          const overlap = calculateOverlap(bounds1, bounds2);

          let needsSeparation = false;
          let separationNeeded = 0;

          const dx = Math.abs(bounds1.centerX - bounds2.centerX);
          const dy = Math.abs(bounds1.centerY - bounds2.centerY);
          const isHorizontallyAligned = dy < SYMMETRY_THRESHOLD;
          const isVerticallyAligned = dx < SYMMETRY_THRESHOLD;

          if (overlap.hasOverlap) {
            needsSeparation = true;
            if (isHorizontallyAligned || dx >= dy) {
              separationNeeded = overlap.overlapX + MIN_SPACING;
            } else {
              separationNeeded = overlap.overlapY + MIN_SPACING;
            }
          } else {
            if (isHorizontallyAligned && horizontalGap < MIN_SPACING) {
              needsSeparation = true;
              separationNeeded = MIN_SPACING - horizontalGap;
            } else if (isVerticallyAligned && verticalGap < MIN_SPACING) {
              needsSeparation = true;
              separationNeeded = MIN_SPACING - verticalGap;
            }
          }

          if (needsSeparation) {
            hasOverlaps = true;

            let separation: { group1: { x: number; y: number }; group2: { x: number; y: number } };

            if (isHorizontallyAligned || dx >= dy) {
              const direction = bounds2.centerX - bounds1.centerX < 0 ? -1 : 1;
              const avgY = (bounds1.centerY + bounds2.centerY) / 2;

              separation = {
                group1: {
                  x: (-direction * separationNeeded) / 2,
                  y: avgY - bounds1.centerY,
                },
                group2: {
                  x: (direction * separationNeeded) / 2,
                  y: avgY - bounds2.centerY,
                },
              };
            } else {
              const direction = bounds2.centerY - bounds1.centerY < 0 ? -1 : 1;
              const avgX = (bounds1.centerX + bounds2.centerX) / 2;

              separation = {
                group1: {
                  x: avgX - bounds1.centerX,
                  y: (-direction * separationNeeded) / 2,
                },
                group2: {
                  x: avgX - bounds2.centerX,
                  y: (direction * separationNeeded) / 2,
                },
              };
            }

            displaceGroup(group1, separation.group1, data4Layout);
            displaceGroup(group2, separation.group2, data4Layout);

            groupBounds.set(
              group1.id,
              calculateGroupBounds(group1, data4Layout, nodeMap, groupPadding)
            );
            groupBounds.set(
              group2.id,
              calculateGroupBounds(group2, data4Layout, nodeMap, groupPadding)
            );
          }
        }
      }
    });
  }

  adjustGroupSymmetry(data4Layout, groupNodes, nodeMap, groupPadding);
}

/**
 * Adjusts group positions to maintain symmetry within the same hierarchical level.
 * Groups that are nearly aligned are adjusted to perfect alignment, and equal
 * spacing is applied when multiple groups are arranged in lines.
 *
 * @param data4Layout - The layout data containing nodes and edges
 * @param groupNodes - Array of group nodes to process
 * @param _nodeMap - Node map (unused in current implementation)
 * @param _groupPadding - Group padding (unused in current implementation)
 */
function adjustGroupSymmetry(
  data4Layout: LayoutData,
  groupNodes: Node[],
  _nodeMap: Map<string, Node>,
  _groupPadding: number
): void {
  const SYMMETRY_THRESHOLD = 30;

  const nodesByParent = new Map<string | undefined, Node[]>();
  groupNodes.forEach((group) => {
    const parentId = group.parentId;
    if (!nodesByParent.has(parentId)) {
      nodesByParent.set(parentId, []);
    }
    nodesByParent.get(parentId)!.push(group);
  });

  nodesByParent.forEach((siblingGroups) => {
    if (siblingGroups.length < 2) {
      return;
    }

    siblingGroups.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

    const yPositions = siblingGroups.map((g) => g.y ?? 0);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    const yVariance = maxY - minY;

    if (yVariance < SYMMETRY_THRESHOLD) {
      const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
      siblingGroups.forEach((group) => {
        const displacement = { x: 0, y: avgY - (group.y ?? 0) };
        displaceGroup(group, displacement, data4Layout);
      });
    }

    const xPositions = siblingGroups.map((g) => g.x ?? 0);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const xVariance = maxX - minX;

    if (xVariance < SYMMETRY_THRESHOLD) {
      const avgX = xPositions.reduce((sum, x) => sum + x, 0) / xPositions.length;
      siblingGroups.forEach((group) => {
        const displacement = { x: avgX - (group.x ?? 0), y: 0 };
        displaceGroup(group, displacement, data4Layout);
      });
    }

    if (siblingGroups.length >= 3 && yVariance < SYMMETRY_THRESHOLD) {
      ensureEqualSpacing(siblingGroups, data4Layout, 'horizontal');
    }
    if (siblingGroups.length >= 3 && xVariance < SYMMETRY_THRESHOLD) {
      ensureEqualSpacing(siblingGroups, data4Layout, 'vertical');
    }
  });
}

/**
 * Ensures equal spacing between groups arranged in a line (horizontal or vertical).
 * Redistributes intermediate groups to maintain uniform spacing between the
 * first and last groups in the sequence.
 *
 * @param groups - Array of group nodes to space equally
 * @param data4Layout - The layout data for applying position changes
 * @param direction - Direction of spacing: 'horizontal' or 'vertical'
 */
function ensureEqualSpacing(
  groups: Node[],
  data4Layout: LayoutData,
  direction: 'horizontal' | 'vertical'
): void {
  if (groups.length < 3) {
    return;
  }

  if (direction === 'horizontal') {
    groups.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

    const firstX = groups[0].x ?? 0;
    const lastX = groups[groups.length - 1].x ?? 0;
    const totalWidth = lastX - firstX;
    const spacing = totalWidth / (groups.length - 1);

    for (let i = 1; i < groups.length - 1; i++) {
      const targetX = firstX + spacing * i;
      const currentX = groups[i].x ?? 0;
      const displacement = { x: targetX - currentX, y: 0 };
      displaceGroup(groups[i], displacement, data4Layout);
    }
  } else {
    groups.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

    const firstY = groups[0].y ?? 0;
    const lastY = groups[groups.length - 1].y ?? 0;
    const totalHeight = lastY - firstY;
    const spacing = totalHeight / (groups.length - 1);

    for (let i = 1; i < groups.length - 1; i++) {
      const targetY = firstY + spacing * i;
      const currentY = groups[i].y ?? 0;
      const displacement = { x: 0, y: targetY - currentY };
      displaceGroup(groups[i], displacement, data4Layout);
    }
  }
}

/**
 * Calculates the overlap between two group bounding rectangles.
 * Returns both whether an overlap exists and the magnitude of overlap
 * in both X and Y dimensions.
 *
 * @param bounds1 - Bounding rectangle of the first group
 * @param bounds2 - Bounding rectangle of the second group
 * @returns Object containing overlap status and overlap dimensions
 */
function calculateOverlap(
  bounds1: GroupBounds,
  bounds2: GroupBounds
): {
  hasOverlap: boolean;
  overlapX: number;
  overlapY: number;
} {
  const overlapX = Math.max(
    0,
    Math.min(bounds1.maxX, bounds2.maxX) - Math.max(bounds1.minX, bounds2.minX)
  );
  const overlapY = Math.max(
    0,
    Math.min(bounds1.maxY, bounds2.maxY) - Math.max(bounds1.minY, bounds2.minY)
  );

  return {
    hasOverlap: overlapX > 0 && overlapY > 0,
    overlapX,
    overlapY,
  };
}

/**
 * Displaces a group node and all its children by the specified offset.
 * Recursively moves all descendant nodes and subgroups to maintain
 * relative positioning within the group hierarchy.
 *
 * @param group - The group node to displace
 * @param displacement - The X,Y offset to apply
 * @param data4Layout - The layout data containing all nodes
 */
function displaceGroup(
  group: Node,
  displacement: { x: number; y: number },
  data4Layout: LayoutData
): void {
  group.x! += displacement.x;
  group.y! += displacement.y;

  const moveChildren = (parentId: string) => {
    data4Layout.nodes.forEach((node) => {
      if (node.parentId === parentId) {
        node.x! += displacement.x;
        node.y! += displacement.y;

        if (node.isGroup) {
          moveChildren(node.id);
        }
      }
    });
  };

  moveChildren(group.id);
}
