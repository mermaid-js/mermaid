import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';

interface ColaOptions {
  iterations?: number;
  springLength?: number;
  springStrength?: number;
  repulsionStrength?: number;
  groupAttraction?: number;
  groupPadding?: number;
}
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
export function applyCola(
  {
    iterations = 50,
    springLength = 60,
    springStrength = 0.2,
    repulsionStrength = 1500,
    groupAttraction = 0.01,
    groupPadding = 15,
  }: ColaOptions = {},
  data4Layout: LayoutData
) {
  const nodes = data4Layout.nodes;
  const edges = data4Layout.edges;

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  nodes.forEach((node) => {
    node.x ??= Math.random() * 100;
    node.y ??= Math.random() * 100;
  });

  for (let iter = 0; iter < iterations; iter++) {
    const coolingFactor = 1.2 - (iter / iterations) * 0.8;
    const displacements: Record<string, { x: number; y: number }> = {};
    const groupCenters = new Map<string, { x: number; y: number; count: number }>();

    nodes.forEach((node) => {
      displacements[node.id] = { x: 0, y: 0 };

      if (node.parentId) {
        const group = groupCenters.get(node.parentId) ?? { x: 0, y: 0, count: 0 };
        group.x += node.x!;
        group.y += node.y!;
        group.count++;
        groupCenters.set(node.parentId, group);
      }
    });

    groupCenters.forEach((group) => {
      group.x /= group.count;
      group.y /= group.count;
    });

    repelNodes(nodes, displacements, coolingFactor, repulsionStrength);
    defineEdgeLengths(edges, nodeMap, springLength, springStrength, displacements);
    nodePositioningAfterOperations(
      nodes,
      groupCenters,
      edges,
      groupAttraction,
      displacements,
      coolingFactor
    );
    if (iter % 5 === 0) {
      resolveOverlaps(nodes);
    }
  }

  resolveOverlaps(nodes);
  layoutGroups(data4Layout, groupPadding, nodeMap);
  resolveGroupOverlaps(data4Layout, groupPadding * 2, nodeMap);
  adjustEdges(data4Layout, nodeMap);
  ensureEdgeLabelsInGroups(data4Layout, nodeMap);
  layoutGroups(data4Layout, groupPadding, nodeMap);
}

function repelNodes(
  nodes: Node[],
  displacements: Record<string, { x: number; y: number }>,
  coolingFactor: number,
  repulsionStrength: number
) {
  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];

    const n1Width = n1.width ?? 30;
    const n1Height = n1.height ?? 30;
    const n1Radius = Math.max(n1Width, n1Height) / 2;

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];

      const n2Width = n2.width ?? 30;
      const n2Height = n2.height ?? 30;
      const n2Radius = Math.max(n2Width, n2Height) / 2;

      const pos1 = getPositionForNode(n1);
      const pos2 = getPositionForNode(n2);
      const dx = pos1.x - pos2.x;
      const dy = pos1.y - pos2.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

      const minDist = n1Radius + n2Radius;

      if (dist < minDist) {
        const overlap = minDist - dist;
        const force = overlap * 5 * coolingFactor;

        displacements[n1.id].x += (dx / dist) * force;
        displacements[n1.id].y += (dy / dist) * force;
        displacements[n2.id].x -= (dx / dist) * force;
        displacements[n2.id].y -= (dy / dist) * force;
      } else {
        const force = (repulsionStrength / (dist * dist)) * 1.1;
        displacements[n1.id].x += (dx / dist) * force;
        displacements[n1.id].y += (dy / dist) * force;
        displacements[n2.id].x -= (dx / dist) * force;
        displacements[n2.id].y -= (dy / dist) * force;
      }
    }
  }
}

function defineEdgeLengths(
  edges: Edge[],
  nodeMap: Map<string, Node>,
  springLength: number,
  springStrength: number,
  displacements: Record<string, { x: number; y: number }>
) {
  edges.forEach((edge: Edge) => {
    if (!edge.start || !edge.end) {
      return;
    }

    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);
    if (!startNode || !endNode) {
      return;
    }

    const startWidth = startNode.width ?? 30;
    const startHeight = startNode.height ?? 30;
    const startRadius = Math.max(startWidth, startHeight) / 2;

    const endWidth = endNode.width ?? 30;
    const endHeight = endNode.height ?? 30;
    const endRadius = Math.max(endWidth, endHeight) / 2;

    const pos1 = getPositionForNode(startNode);
    const pos2 = getPositionForNode(endNode);
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    let baseSpring = springLength;
    if (edge.isLabelEdge) {
      baseSpring = baseSpring * -0.09;
    }

    const adjustedSpringLength = baseSpring + startRadius + endRadius;
    const delta = dist - adjustedSpringLength;
    const force = springStrength * delta;

    displacements[startNode.id].x += (dx / dist) * force;
    displacements[startNode.id].y += (dy / dist) * force;
    displacements[endNode.id].x -= (dx / dist) * force;
    displacements[endNode.id].y -= (dy / dist) * force;
  });
}

function nodePositioningAfterOperations(
  nodes: Node[],
  groupCenters: Map<string, { x: number; y: number; count: number }>,
  edges: Edge[],
  groupAttraction: number,
  displacements: Record<string, { x: number; y: number }>,
  coolingFactor: number
) {
  nodes.forEach((node) => {
    if (!node.isGroup && node.parentId) {
      let flag = false;
      const groupCenter = groupCenters.get(node.parentId);
      if (!groupCenter) {
        return;
      }

      edges.forEach((edge) => {
        if (node.id == edge.start || node.id == edge.end) {
          flag = true;
        }
      });

      if (flag) {
        const pos = getPositionForNode(node);
        const dx = groupCenter.x - pos.x;
        const dy = groupCenter.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = groupAttraction * dist * 5; //* (dist > 100 ? 2 : 1);
        displacements[node.id].x += (dx / dist) * force;
        displacements[node.id].y += (dy / dist) * force;
      }
    } else {
      const pos = getPositionForNode(node);
      const dx = displacements[node.id]?.x || 0;
      const dy = displacements[node.id]?.y || 0;

      const maxStep = 10 * coolingFactor;
      const moveX = Math.max(-maxStep, Math.min(maxStep, dx * coolingFactor));
      const moveY = Math.max(-maxStep, Math.min(maxStep, dy * coolingFactor));

      node.x = pos.x + moveX;
      node.y = pos.y + moveY;
    }
  });
}

function ensureEdgeLabelsInGroups(data4Layout: LayoutData, nodeMap: Map<string, Node>) {
  const edgeLabels = data4Layout.nodes.filter((node) => node.isEdgeLabel);

  edgeLabels.forEach((label) => {
    if (!label.edgeStart || !label.edgeEnd) {
      return;
    }

    const startNode = nodeMap.get(label.edgeStart);
    const endNode = nodeMap.get(label.edgeEnd);

    if (!startNode || !endNode) {
      return;
    }

    if (startNode.parentId && startNode.parentId === endNode.parentId) {
      label.parentId = startNode.parentId;

      const parentGroup = nodeMap.get(startNode.parentId);
      if (!parentGroup?.isGroup) {
        return;
      }

      const parentHalfWidth = (parentGroup.width || 100) / 2;
      const parentHalfHeight = (parentGroup.height || 100) / 2;

      const dx = Math.abs(label.x! - parentGroup.x!);
      const dy = Math.abs(label.y! - parentGroup.y!);
      const labelHalfWidth = (label.width || 0) / 2;
      const labelHalfHeight = (label.height || 0) / 2;

      if (dx + labelHalfWidth > parentHalfWidth || dy + labelHalfHeight > parentHalfHeight) {
        const angle = Math.atan2(label.y! - parentGroup.y!, label.x! - parentGroup.x!);
        const maxRadiusX = parentHalfWidth - labelHalfWidth - 10;
        const maxRadiusY = parentHalfHeight - labelHalfHeight - 10;
        const radius = Math.min(
          maxRadiusX / Math.abs(Math.cos(angle) || 0.001),
          maxRadiusY / Math.abs(Math.sin(angle) || 0.001)
        );

        label.x = parentGroup.x! + Math.cos(angle) * radius;
        label.y = parentGroup.y! + Math.sin(angle) * radius;

        data4Layout.edges.forEach((edge) => {
          if (
            ((edge.start === label.edgeStart && edge.end === label.id) ||
              (edge.start === label.id && edge.end === label.edgeEnd)) &&
            edge.points &&
            edge.points.length > 0
          ) {
            if (edge.start === label.id) {
              edge.points[0] = { x: label.x!, y: label.y! };
            } else if (edge.end === label.id) {
              edge.points[edge.points.length - 1] = { x: label.x!, y: label.y! };
            }
          }
        });
      }
    }
  });
}

function resolveOverlaps(nodes: Node[]) {
  const nonGroupNodes = nodes.filter((n) => !n.isGroup);
  const maxIterations = 10;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlaps = false;

    for (let i = 0; i < nonGroupNodes.length; i++) {
      const n1 = nonGroupNodes[i];
      const n1Width = n1.width ?? 30;
      const n1Height = n1.height ?? 30;
      const n1Radius = Math.sqrt(n1Width * n1Width + n1Height * n1Height) / 2 + 12;

      for (let j = i + 1; j < nonGroupNodes.length; j++) {
        const n2 = nonGroupNodes[j];
        const n2Width = n2.width ?? 30;
        const n2Height = n2.height ?? 30;
        const n2Radius = Math.sqrt(n2Width * n2Width + n2Height * n2Height) / 2 + 12;

        const dx = n2.x! - n1.x!;
        const dy = n2.y! - n1.y!;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = n1Radius + n2Radius;

        if (dist < minDist && dist > 0) {
          hasOverlaps = true;
          const overlap = minDist - dist;
          const moveX = (dx / dist) * overlap * 0.25;
          const moveY = (dy / dist) * overlap * 0.25;

          n1.x! -= moveX;
          n1.y! -= moveY;
          n2.x! += moveX;
          n2.y! += moveY;
        }
      }
    }

    if (!hasOverlaps) {
      break;
    }
  }
}

interface LayoutGroupOptions {
  groupPadding?: number;
  minHorizontalSpacing?: number;
  maxIterations?: number;
  coolingFactor?: number;
}

function layoutGroups(
  data4Layout: LayoutData,
  options: number | LayoutGroupOptions = {},
  nodeMap: Map<string, Node>
): void {
  const config: LayoutGroupOptions =
    typeof options === 'number' ? { groupPadding: options } : options;

  const { groupPadding = 15, maxIterations = 50, coolingFactor = 1 } = config;

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

  function calculateGroupBounds(
    groupNode: Node,
    children: Node[],
    edges: Edge[],
    nodeMap: Map<string, Node>,
    data4Layout: LayoutData
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
      const width = child.width ?? (child.isGroup ? 100 : 30);
      const height = child.height ?? (child.isGroup ? 100 : 30);

      bounds.minX = Math.min(bounds.minX, child.x! - width / 2);
      bounds.minY = Math.min(bounds.minY, child.y! - height / 2);
      bounds.maxX = Math.max(bounds.maxX, child.x! + width / 2);
      bounds.maxY = Math.max(bounds.maxY, child.y! + height / 2);
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
          const width = node.width ?? 40;
          const height = node.height ?? 20;

          bounds.minX = Math.min(bounds.minX, node.x! - width / 2);
          bounds.minY = Math.min(bounds.minY, node.y! - height / 2);
          bounds.maxX = Math.max(bounds.maxX, node.x! + width / 2);
          bounds.maxY = Math.max(bounds.maxY, node.y! + height / 2);
        }
      }
    });

    edges.forEach((edge: Edge) => {
      if (
        edge.points &&
        nodeMap.get(edge?.start || '')?.parentId === groupNode.id &&
        nodeMap.get(edge.end || '')?.parentId === groupNode.id
      ) {
        edge.points.forEach((point) => {
          bounds.minX = Math.min(bounds.minX, point.x);
          bounds.minY = Math.min(bounds.minY, point.y);
          bounds.maxX = Math.max(bounds.maxX, point.x);
          bounds.maxY = Math.max(bounds.maxY, point.y);
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

  function processGroupHierarchy(groupIds: string[]) {
    groupIds.forEach((groupId) => {
      const childGroups = groupHierarchy.get(groupId) || [];
      if (childGroups.length > 0) {
        processGroupHierarchy(childGroups);
      }
    });

    groupIds.forEach((groupId) => {
      const groupNode = nodeMap.get(groupId);
      if (!groupNode) {
        return;
      }

      const directChildren = data4Layout.nodes.filter((n) => n.parentId === groupId);

      if (directChildren.length === 0) {
        groupNode.width = groupPadding * 4;
        groupNode.height = groupPadding * 4;
        return;
      }

      const bounds = calculateGroupBounds(
        groupNode,
        directChildren,
        data4Layout.edges,
        nodeMap,
        data4Layout
      );

      groupNode.x = (bounds.minX + bounds.maxX) / 2;
      groupNode.y = (bounds.minY + bounds.maxY) / 2;
      groupNode.width = bounds.maxX - bounds.minX + groupPadding * 2;
      groupNode.height = bounds.maxY - bounds.minY + groupPadding * 2;
    });
  }

  processGroupHierarchy(rootGroups);

  for (let iter = 0; iter < maxIterations; iter++) {
    const cooling = 1 - (iter / maxIterations) * coolingFactor;
    const displacements = new Map<string, { x: number; y: number }>();

    data4Layout.nodes
      .filter((n) => n.isGroup)
      .forEach((g) => displacements.set(g.id, { x: 0, y: 0 }));

    const groups = data4Layout.nodes.filter((n) => n.isGroup);
    for (let i = 0; i < groups.length; i++) {
      const g1 = groups[i];
      for (let j = i + 1; j < groups.length; j++) {
        const g2 = groups[j];

        if (g1.parentId !== g2.parentId) {
          continue;
        }

        const dx = g2.x! - g1.x!;
        const dy = g2.y! - g1.y!;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (g1.width! + g2.width!) / 2 + groupPadding;

        if (dist < minDist) {
          const force = (minDist - dist) * 0.1 * cooling;
          const disp1 = displacements.get(g1.id)!;
          const disp2 = displacements.get(g2.id)!;

          disp1.x -= (dx / dist) * force;
          disp1.y -= (dy / dist) * force;
          disp2.x += (dx / dist) * force;
          disp2.y += (dy / dist) * force;
        }
      }
    }

    groups.forEach((g) => {
      const disp = displacements.get(g.id)!;

      if (g.parentId) {
        const parent = nodeMap.get(g.parentId);
        if (parent?.isGroup) {
          const parentHalfWidth = parent.width! / 2 - groupPadding;
          const parentHalfHeight = parent.height! / 2 - groupPadding;
          const childHalfWidth = g.width! / 2;
          const childHalfHeight = g.height! / 2;

          const maxDx = parentHalfWidth - childHalfWidth;
          const maxDy = parentHalfHeight - childHalfHeight;

          const currentDx = g.x! + disp.x - parent.x!;
          const currentDy = g.y! + disp.y - parent.y!;

          if (Math.abs(currentDx) > maxDx) {
            disp.x = Math.sign(currentDx) * maxDx + parent.x! - g.x!;
          }

          if (Math.abs(currentDy) > maxDy) {
            disp.y = Math.sign(currentDy) * maxDy + parent.y! - g.y!;
          }
        }
      }

      g.x! += disp.x;
      g.y! += disp.y;

      data4Layout.nodes
        .filter((n) => n.parentId === g.id && !n.isGroup)
        .forEach((child) => {
          child.x! += disp.x;
          child.y! += disp.y;
        });
    });
  }

  processGroupHierarchy(rootGroups);
}

function getPositionForNode(node: Node): { x: number; y: number } {
  return { x: node.x ?? 0, y: node.y ?? 0 };
}

function adjustEdges(data4Layout: LayoutData, nodeMap: Map<string, Node>) {
  const edgeCountMap = new Map<string, number>();
  const edgeSeenMap = new Map<string, number>();

  data4Layout.edges.forEach((edge) => {
    const sortedPair = [edge.start, edge.end].sort();
    const edgeKey = sortedPair.join('--');
    edgeCountMap.set(edgeKey, (edgeCountMap.get(edgeKey) || 0) + 1);
  });

  data4Layout.edges.forEach((edge: Edge, index) => {
    if (!edge.start || !edge.end) {
      return;
    }

    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);
    if (!startNode || !endNode || (!startNode.isGroup && !endNode.isGroup)) {
      return;
    }

    edge.id = `${edge.start}--${edge.end}--${index}`;

    if (startNode.x != null && startNode.y != null && endNode.x != null && endNode.y != null) {
      const dx = endNode.x - startNode.x;
      const dy = endNode.y - startNode.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      const sortedPair = [edge.start, edge.end].sort();
      const edgeKey = sortedPair.join('--');
      const totalCount = edgeCountMap.get(edgeKey)!;
      const seenCount = edgeSeenMap.get(edgeKey) || 0;
      edgeSeenMap.set(edgeKey, seenCount + 1);
      const hasIndirectPath = hasAlternativePath(edge.start, edge.end, data4Layout.edges);
      const isParallelEdge = totalCount > 1;
      const isForward = edge.start === sortedPair[0];

      let curveOffset = 0;
      if (isParallelEdge || hasIndirectPath || !isForward) {
        let offsetIndex = seenCount - totalCount / 2;
        if (!isForward) {
          offsetIndex = -offsetIndex;
        }

        const isStartGroup = startNode.isGroup;
        const isEndGroup = endNode.isGroup;
        const hasValidParentIds =
          (isStartGroup || startNode.parentId !== undefined) &&
          (isEndGroup || endNode.parentId !== undefined);
        if (
          hasValidParentIds &&
          (isStartGroup || isEndGroup) &&
          (edge.start === edge.end || startNode.parentId !== endNode.parentId)
        ) {
          if (startNode.parentId !== endNode.parentId) {
            curveOffset = len * 0.4 * (offsetIndex || 1);
          } else {
            curveOffset = len * 0.05 * (offsetIndex || 1);
          }
        }
        // else {
        //   curveOffset = len * 0.01 * (offsetIndex || 1);
        // }
      }
      const mx = (startNode.x + endNode.x) / 2;
      const my = (startNode.y + endNode.y) / 2;
      const offsetX = (-dy / len) * curveOffset;
      const offsetY = (dx / len) * curveOffset;
      const controlPoint = { x: mx + offsetX, y: my + offsetY };
      const from = startNode.isGroup
        ? intersectGroupBox(
            { x: startNode.x, y: startNode.y },
            startNode.width ?? 100,
            startNode.height ?? 100,
            {
              x: endNode.x,
              y: endNode.y,
            }
          )
        : (startNode.intersect?.(controlPoint) ?? { x: startNode.x, y: startNode.y });
      const to = endNode.isGroup
        ? intersectGroupBox(
            { x: endNode.x, y: endNode.y },
            endNode.width ?? 100,
            endNode.height ?? 100,
            {
              x: startNode.x,
              y: startNode.y,
            }
          )
        : (endNode.intersect?.(controlPoint) ?? { x: endNode.x, y: endNode.y });
      edge.points = curveOffset !== 0 ? [from, controlPoint, to] : [from, to];
    }
  });

  data4Layout.edges.forEach((edge, index) => {
    if (!edge.start || !edge.end || edge.start === edge.end) {
      return;
    }

    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);
    if (!startNode || !endNode || startNode.isGroup || endNode.isGroup) {
      return;
    }

    edge.id = `${edge.start}--${edge.end}--${index}`;

    if (startNode.x != null && startNode.y != null && endNode.x != null && endNode.y != null) {
      let points = calculateInitialEdgePath(
        startNode,
        endNode,
        edge,
        edgeCountMap,
        edgeSeenMap,
        data4Layout
      );

      const overlappingNodes = findNodesIntersectingEdge(
        points,
        data4Layout.nodes,
        edge.start,
        edge.end
      );

      if (overlappingNodes.length > 0) {
        points = adjustPathToAvoidNodes(points, overlappingNodes, startNode, endNode);
      }

      edge.points = points;
    }
  });

  data4Layout.edges.forEach((edge, index) => {
    if (!edge.start || !edge.end || edge.start !== edge.end) {
      return;
    }
    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);
    if (!startNode || !endNode) {
      return;
    }

    edge.id = `${edge.start}--${edge.end}--${index}`;

    if (startNode.x != null && startNode.y != null && endNode.x != null && endNode.y != null) {
      const loopWidth = (startNode.width || 20) / 4;
      const center = { x: startNode.x, y: startNode.y };

      const directions = getDirectionUsage(data4Layout.edges, startNode, edge, nodeMap);
      const directionObject = chooseFreeDirection(directions);
      const { start, cp1, cp2, end } = getSelfLoopPoints(
        directionObject.direction,
        center,
        startNode,
        loopWidth,
        directionObject.count
      );

      edge.points = [start, cp1, cp2, end];
    }
  });
}

function calculateInitialEdgePath(
  startNode: Node,
  endNode: Node,
  edge: Edge,
  edgeCountMap: Map<string, number>,
  edgeSeenMap: Map<string, number>,
  data4Layout: LayoutData
): { x: number; y: number }[] {
  let points: { x: number; y: number }[] = [];
  if (!edge.start || !edge.end) {
    return points;
  }
  if (startNode?.x == null || startNode?.y == null || endNode?.x == null || endNode?.y == null) {
    return points;
  }
  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  const sortedPair = [edge.start, edge.end].sort();
  const edgeKey = sortedPair.join('--');
  const totalCount = edgeCountMap.get(edgeKey)!;
  const seenCount = edgeSeenMap.get(edgeKey) || 0;
  edgeSeenMap.set(edgeKey, seenCount + 1);

  const hasIndirectPath = hasAlternativePath(edge.start, edge.end, data4Layout.edges);
  const isParallelEdge = totalCount > 1;
  const isForward = edge.start === sortedPair[0];

  let curveOffset = 0;

  if (isParallelEdge || hasIndirectPath || !isForward) {
    let offsetIndex = seenCount - (totalCount - 1) / 2;
    if (!isForward) {
      offsetIndex = -offsetIndex;
    }
    curveOffset = len * 0.08 * offsetIndex;
  }

  const mx = (startNode.x + endNode.x) / 2;
  const my = (startNode.y + endNode.y) / 2;
  const offsetX = (-dy / len) * curveOffset;
  const offsetY = (dx / len) * curveOffset;
  const controlPoint = { x: mx + offsetX, y: my + offsetY };

  const from = startNode.isEdgeLabel
    ? { x: startNode.x, y: startNode.y }
    : getShapeIntersection(startNode, controlPoint);
  const to = endNode.isGroup
    ? intersectGroupBox(
        { x: endNode.x, y: endNode.y },
        endNode.width ?? 100,
        endNode.height ?? 100,
        {
          x: startNode.x,
          y: startNode.y,
        }
      )
    : (endNode.intersect?.(controlPoint) ?? { x: endNode.x, y: endNode.y });

  points = curveOffset !== 0 ? [from, controlPoint, to] : [from, to];

  return points;
}

function findNodesIntersectingEdge(
  edgePoints: { x: number; y: number }[],
  nodes: Node[],
  startNodeId: string,
  endNodeId: string
): Node[] {
  const intersectingNodes: Node[] = [];

  if (edgePoints.length < 2) {
    return intersectingNodes;
  }

  const segments: { start: Point; end: Point }[] = [];
  for (let i = 0; i < edgePoints.length - 1; i++) {
    segments.push({
      start: edgePoints[i],
      end: edgePoints[i + 1],
    });
  }

  for (const node of nodes) {
    if (node.id === startNodeId || node.id === endNodeId || node.isGroup) {
      continue;
    }

    if (node.x == null || node.y == null) {
      continue;
    }

    const nodeBox = {
      x: node.x,
      y: node.y,
      width: node.width || 30,
      height: node.height || 30,
      padding: 10,
    };

    for (const segment of segments) {
      if (lineIntersectsNodeBox(segment.start, segment.end, nodeBox)) {
        intersectingNodes.push(node);
        break;
      }
    }
  }

  return intersectingNodes;
}

function lineIntersectsNodeBox(
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  nodeBox: any
): boolean {
  const box = {
    left: nodeBox.x - nodeBox.width / 2 - nodeBox.padding,
    right: nodeBox.x + nodeBox.width / 2 + nodeBox.padding,
    top: nodeBox.y - nodeBox.height / 2 - nodeBox.padding,
    bottom: nodeBox.y + nodeBox.height / 2 + nodeBox.padding,
  };

  return lineIntersectsRectangle(lineStart, lineEnd, box);
}

function lineIntersectsRectangle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  rect: any
): boolean {
  if (pointInRectangle(p1, rect) || pointInRectangle(p2, rect)) {
    return true;
  }

  const edges = [
    [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
    ],
    [
      { x: rect.right, y: rect.top },
      { x: rect.right, y: rect.bottom },
    ],
    [
      { x: rect.right, y: rect.bottom },
      { x: rect.left, y: rect.bottom },
    ],
    [
      { x: rect.left, y: rect.bottom },
      { x: rect.left, y: rect.top },
    ],
  ];

  for (const [edgeStart, edgeEnd] of edges) {
    if (lineSegmentsIntersect(p1, p2, edgeStart, edgeEnd)) {
      return true;
    }
  }

  return false;
}

function pointInRectangle(point: any, rect: any): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

function lineSegmentsIntersect(p1: any, p2: any, p3: any, p4: any): boolean {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (denom === 0) {
    return false;
  }

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function adjustPathToAvoidNodes(
  points: { x: number; y: number }[],
  overlappingNodes: Node[],
  startNode: Node,
  endNode: Node
): { x: number; y: number }[] {
  if (overlappingNodes.length === 0) {
    return points;
  }

  let adjustedPoints = [...points];

  for (const node of overlappingNodes) {
    adjustedPoints = createDetourAroundNode(adjustedPoints, node, startNode, endNode);
  }

  return adjustedPoints;
}

function createDetourAroundNode(
  points: { x: number; y: number }[],
  obstructingNode: Node,
  startNode: Node,
  endNode: Node
): any[] {
  let newPoints: { x: number; y: number }[] = [];
  if (
    !startNode.x ||
    !endNode.x ||
    !obstructingNode.x ||
    !startNode.y ||
    !endNode.y ||
    !obstructingNode.y
  ) {
    return newPoints;
  }

  const nodeRadius = Math.max(obstructingNode.width ?? 30, obstructingNode.height ?? 30) / 2;
  const detourDistance = nodeRadius + 30;

  const mainDirection = {
    x: endNode.x - startNode.x,
    y: endNode.y - startNode.y,
  };
  const mainLength = Math.sqrt(
    mainDirection.x * mainDirection.x + mainDirection.y * mainDirection.y
  );

  mainDirection.x /= mainLength;
  mainDirection.y /= mainLength;

  const perpDirection = {
    x: -mainDirection.y,
    y: mainDirection.x,
  };

  const nodeToStart = {
    x: startNode.x - obstructingNode.x,
    y: startNode.y - obstructingNode.y,
  };

  const crossProduct = nodeToStart.x * perpDirection.x + nodeToStart.y * perpDirection.y;
  const sideMultiplier = crossProduct > 0 ? 1 : -1;

  const detourPoint1 = {
    x: obstructingNode.x + perpDirection.x * detourDistance * sideMultiplier,
    y: obstructingNode.y + perpDirection.y * detourDistance * sideMultiplier,
  };

  const detourPoint2 = {
    x:
      obstructingNode.x +
      perpDirection.x * detourDistance * sideMultiplier +
      mainDirection.x * nodeRadius,
    y:
      obstructingNode.y +
      perpDirection.y * detourDistance * sideMultiplier +
      mainDirection.y * nodeRadius,
  };

  if (points.length === 2) {
    return [points[0], detourPoint1, points[1]];
  }

  if (points.length === 3) {
    return [points[0], detourPoint1, points[2]];
  }

  const midIndex = Math.floor(points.length / 2);
  newPoints = [...points];
  newPoints.splice(midIndex, 0, detourPoint1, detourPoint2);

  return newPoints;
}

function getShapeIntersection(node: Node, externalPoint: { x: number; y: number }) {
  const width = node.width ?? 30;
  const height = node.height ?? 30;
  const shape = node.shape ?? 'rectangle';
  const centerX = node.x ?? 0;
  const centerY = node.y ?? 0;

  const padding = 1.5;
  const paddedWidth = shape === 'diamond' ? width / 4 : width / 2 + padding;
  const paddedHeight = shape === 'diamond' ? height / 4 : height / 2 + padding;

  const angle = Math.atan2(externalPoint.y - centerY, externalPoint.x - centerX);
  if (shape === 'rectangle') {
    const aspectRatio = height / width;
    const halfWidth = width / 2 + padding;
    const halfHeight = height / 2 + padding;

    if (aspectRatio > 2) {
      const verticalIntersect = {
        x: centerX + halfHeight * Math.tan(angle),
        y: centerY + (angle > 0 ? halfHeight : -halfHeight),
      };

      if (Math.abs(Math.cos(angle)) > 0.5) {
        const horizontalIntersect = {
          x: centerX + (Math.cos(angle) > 0 ? halfWidth : -halfWidth),
          y: centerY + halfWidth * Math.tan(angle),
        };

        return Math.abs(angle) < Math.PI / 4 ? horizontalIntersect : verticalIntersect;
      }
      return verticalIntersect;
    }

    const ratioX = halfWidth / Math.abs(Math.cos(angle));
    const ratioY = halfHeight / Math.abs(Math.sin(angle));
    const ratio = Math.min(ratioX, ratioY);

    return {
      x: centerX + ratio * Math.cos(angle),
      y: centerY + ratio * Math.sin(angle),
    };
  }
  if (shape === 'diamond') {
    const tanTheta = Math.tan(angle);
    const cotTheta = 1 / tanTheta;

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      return {
        x: centerX + paddedWidth,
        y: centerY + paddedWidth * tanTheta,
      };
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      return {
        x: centerX + paddedHeight * cotTheta,
        y: centerY + paddedHeight,
      };
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
      return {
        x: centerX - paddedHeight * cotTheta,
        y: centerY - paddedHeight,
      };
    } else {
      return {
        x: centerX - paddedWidth,
        y: centerY - paddedWidth * tanTheta,
      };
    }
  } else if (shape === 'circle') {
    const radius = Math.min(width, height) / 2 + padding;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  } else {
    const ratioX = paddedWidth / Math.abs(Math.cos(angle));
    const ratioY = paddedHeight / Math.abs(Math.sin(angle));
    const ratio = Math.min(ratioX, ratioY);

    return {
      x: centerX + ratio * Math.cos(angle),
      y: centerY + ratio * Math.sin(angle),
    };
  }
}

function hasAlternativePath(start: string, end: string, edges: Edge[]): boolean {
  return edges.some(
    (e1) =>
      e1.start === start &&
      e1.end !== end &&
      edges.some((e2) => e2.start === e1.end && e2.end === end)
  );
}

function intersectGroupBox(
  center: { x: number; y: number },
  width: number,
  height: number,
  externalPoint: { x: number; y: number }
) {
  const dx = externalPoint.x - center.x;
  const dy = externalPoint.y - center.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const halfW = width / 2;
  const halfH = height / 2;

  if (absDx * halfH > absDy * halfW) {
    const sign = dx > 0 ? 1 : -1;
    return { x: center.x + sign * halfW, y: center.y + (halfW * dy) / absDx };
  } else {
    const sign = dy > 0 ? 1 : -1;
    return { x: center.x + (halfH * dx) / absDy, y: center.y + sign * halfH };
  }
}

function getDirectionUsage(
  edges: Edge[],
  node: Node,
  currentEdge: Edge,
  nodeMap: Map<string, Node>
) {
  const usage = { top: 0, right: 0, bottom: 0, left: 0 };

  edges.forEach((e: Edge) => {
    if (e.start === currentEdge.start && e.end !== currentEdge.end) {
      const target = nodeMap.get(e?.end || '');
      if (target?.x != null && target.y != null) {
        const angle = Math.atan2(target.y - node.y!, target.x - node.x!);
        const deg = (angle * 180) / Math.PI;

        if (deg > -45 && deg <= 45) {
          usage.right++;
        } else if (deg > 45 && deg <= 135) {
          usage.bottom++;
        } else if (deg <= -45 && deg > -135) {
          usage.top++;
        } else {
          usage.left++;
        }
      }
    } else if (e.start === currentEdge.start && e.end === currentEdge.start) {
      const points = e.points;
      if (points && points.length === 4) {
        const cp1 = points[1];
        const dx = cp1.x - node.x!;
        const dy = cp1.y - node.y!;
        const angle = Math.atan2(dy, dx);
        const deg = (angle * 180) / Math.PI;

        if (deg > -45 && deg <= 45) {
          usage.right++;
        } else if (deg > 45 && deg <= 135) {
          usage.bottom++;
        } else if (deg <= -45 && deg > -135) {
          usage.top++;
        } else {
          usage.left++;
        }
      }
    }
  });

  return usage;
}

function chooseFreeDirection(directions: Record<string, number>): {
  direction: string;
  count: number;
} {
  const sorted = Object.entries(directions).sort((a, b) => a[1] - b[1]);
  return {
    direction: sorted[0][0],
    count: sorted[0][1],
  };
}

function getSelfLoopPoints(
  direction: string,
  center: { x: number; y: number },
  node: Node,
  width: number,
  directionCount = 0
) {
  const nodeWidth = node.width ?? 50;
  const nodeHeight = node.height ?? 40;
  const radiusX = nodeWidth * 0.6;
  const radiusY = nodeHeight * 0.6;
  const cpFactor = 1;

  const verticalOffset = width * 0.3 * directionCount;
  const horizontalOffset = width * 0.3 * directionCount;
  const radiusGrowth = 1 + directionCount * 0.25;

  switch (direction) {
    case 'right':
      return {
        start: {
          x: center.x + nodeWidth / 2,
          y: center.y - width + verticalOffset,
        },
        end: {
          x: center.x + nodeWidth / 2,
          y: center.y + width + verticalOffset,
        },
        cp1: {
          x: center.x + nodeWidth / 2 + radiusX * radiusGrowth,
          y: center.y - width * cpFactor + verticalOffset,
        },
        cp2: {
          x: center.x + nodeWidth / 2 + radiusX * radiusGrowth,
          y: center.y + width * cpFactor + verticalOffset,
        },
      };
    case 'bottom':
      return {
        start: {
          x: center.x - width + horizontalOffset,
          y: center.y + nodeHeight / 2,
        },
        end: {
          x: center.x + width + horizontalOffset,
          y: center.y + nodeHeight / 2,
        },
        cp1: {
          x: center.x - width * cpFactor + horizontalOffset,
          y: center.y + nodeHeight / 2 + radiusY * radiusGrowth,
        },
        cp2: {
          x: center.x + width * cpFactor + horizontalOffset,
          y: center.y + nodeHeight / 2 + radiusY * radiusGrowth,
        },
      };
    case 'left':
      return {
        start: {
          x: center.x - nodeWidth / 2,
          y: center.y + width - verticalOffset,
        },
        end: {
          x: center.x - nodeWidth / 2,
          y: center.y - width - verticalOffset,
        },
        cp1: {
          x: center.x - nodeWidth / 2 - radiusX * radiusGrowth,
          y: center.y + width * cpFactor - verticalOffset,
        },
        cp2: {
          x: center.x - nodeWidth / 2 - radiusX * radiusGrowth,
          y: center.y - width * cpFactor - verticalOffset,
        },
      };
    default:
      return {
        start: {
          x: center.x + width - horizontalOffset,
          y: center.y - nodeHeight / 2,
        },
        end: {
          x: center.x - width - horizontalOffset,
          y: center.y - nodeHeight / 2,
        },
        cp1: {
          x: center.x + width * cpFactor - horizontalOffset,
          y: center.y - nodeHeight / 2 - radiusY * radiusGrowth,
        },
        cp2: {
          x: center.x - width * cpFactor - horizontalOffset,
          y: center.y - nodeHeight / 2 - radiusY * radiusGrowth,
        },
      };
  }
}

function resolveGroupOverlaps(
  data4Layout: LayoutData,
  groupPadding: number,
  nodeMap: Map<string, Node>
): void {
  const groupNodes = data4Layout.nodes.filter((n) => n.isGroup);

  const groupBounds = new Map<string, GroupBounds>();

  groupNodes.forEach((group) => {
    const bounds = calculateGroupBounds(group, data4Layout, nodeMap, groupPadding);
    groupBounds.set(group.id, bounds);
  });

  let maxIterations = 20;
  let hasOverlaps = true;

  while (hasOverlaps && maxIterations > 0) {
    hasOverlaps = false;
    maxIterations--;

    for (let i = 0; i < groupNodes.length; i++) {
      const group1 = groupNodes[i];
      const bounds1 = groupBounds.get(group1.id)!;

      for (let j = i + 1; j < groupNodes.length; j++) {
        const group2 = groupNodes[j];
        const bounds2 = groupBounds.get(group2.id)!;

        if (group1.parentId === group2.id || group2.parentId === group1.id) {
          continue;
        }

        const overlap = calculateOverlap(bounds1, bounds2);

        if (overlap.hasOverlap) {
          hasOverlaps = true;

          const hasEdgesBetweenGroups = data4Layout.edges.some(
            (edge) =>
              (edge.start === group1.id && edge.end === group2.id) ||
              (edge.start === group2.id && edge.end === group1.id)
          );

          const separation = hasEdgesBetweenGroups
            ? calculateSeparationVector(bounds1, bounds2, overlap, groupPadding)
            : calculateHorizontalSeparationVector(bounds1, bounds2, overlap, groupPadding);

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
        } else if (overlap.overlapX > 0 || overlap.overlapY > 0) {
          hasOverlaps = true;

          const separationDistance = groupPadding * 0.1;
          let separationX = 0;
          let separationY = 0;

          if (overlap.overlapX > 0) {
            const dy = bounds2.centerY - bounds1.centerY;
            separationY = dy < 0 ? -separationDistance : separationDistance;
          }

          if (overlap.overlapY > 0) {
            const dx = bounds2.centerX - bounds1.centerX;
            separationX = dx < 0 ? -separationDistance : separationDistance;
          }

          displaceGroup(group1, { x: -separationX / 2, y: -separationY / 2 }, data4Layout);
          displaceGroup(group2, { x: separationX / 2, y: separationY / 2 }, data4Layout);

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
  }
}

function calculateGroupBounds(
  group: Node,
  data4Layout: LayoutData,
  nodeMap: Map<string, Node>,
  groupPadding: number
) {
  const children = data4Layout.nodes.filter((n) => n.parentId === group.id);

  if (children.length === 0) {
    const width = group.width || groupPadding * 2;
    const height = group.height || groupPadding * 2;
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

  const defaultSubWidth = 100;

  children.forEach((child) => {
    const width = child.width ?? (child.isGroup ? defaultSubWidth : 30);
    const height = child.height ?? (child.isGroup ? defaultSubWidth : 30);

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

  const extraPadding = groupPadding * 1.04;
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

function calculateHorizontalSeparationVector(
  bounds1: GroupBounds,
  bounds2: GroupBounds,
  overlap: { overlapX: number; overlapY: number },
  groupPadding: number
): {
  group1: { x: number; y: number };
  group2: { x: number; y: number };
} {
  const dx = bounds2.centerX - bounds1.centerX;

  const horizontalPadding = groupPadding * 4;
  const separationX = Math.max(overlap.overlapX + horizontalPadding, horizontalPadding);

  const direction = dx < 0 ? -1 : 1;

  return {
    group1: { x: (-separationX / 2) * direction, y: 0 },
    group2: { x: (separationX / 2) * direction, y: 0 },
  };
}

function calculateSeparationVector(
  bounds1: GroupBounds,
  bounds2: GroupBounds,
  overlap: { overlapX: number; overlapY: number },
  groupPadding: number
): {
  group1: { x: number; y: number };
  group2: { x: number; y: number };
} {
  const dx = bounds2.centerX - bounds1.centerX;
  const dy = bounds2.centerY - bounds1.centerY;

  let separationX = 0;
  let separationY = 0;

  if (overlap.overlapX > overlap.overlapY) {
    separationX = (overlap.overlapX + groupPadding * 2) / 4;
    if (dx < 0) {
      separationX = -separationX;
    }
  } else {
    separationY = (overlap.overlapY + groupPadding * 2) / 4;
    if (dy < 0) {
      separationY = -separationY;
    }
  }

  return {
    group1: { x: -separationX, y: -separationY },
    group2: { x: separationX, y: separationY },
  };
}

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
