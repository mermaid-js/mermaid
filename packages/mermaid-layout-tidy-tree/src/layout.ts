import { BoundingBox, Layout } from 'non-layered-tidy-tree-layout';
import type { MermaidConfig, LayoutData } from 'mermaid';
import type {
  LayoutResult,
  TidyTreeNode,
  PositionedNode,
  PositionedEdge,
  Node,
  Edge,
} from './types.js';

/**
 * Execute the tidy-tree layout algorithm on generic layout data
 *
 * This function takes layout data and uses the non-layered-tidy-tree-layout
 * algorithm to calculate optimal node positions for tree structures.
 *
 * @param data - The layout data containing nodes, edges, and configuration
 * @param config - Mermaid configuration object
 * @returns Promise resolving to layout result with positioned nodes and edges
 */
export function executeTidyTreeLayout(
  data: LayoutData,
  _config: MermaidConfig
): Promise<LayoutResult> {
  let intersectionShift = 50;

  return new Promise((resolve, reject) => {
    try {
      if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        throw new Error('No nodes found in layout data');
      }

      if (!data.edges || !Array.isArray(data.edges)) {
        data.edges = [];
      }

      const { leftTree, rightTree, rootNode } = convertToDualTreeFormat(data);

      const gap = 20;
      const bottomPadding = 40;
      intersectionShift = 30;

      const bb = new BoundingBox(gap, bottomPadding);
      const layout = new Layout(bb);

      let leftResult = null;
      let rightResult = null;
      let leftBoundingBox = null;
      let rightBoundingBox = null;

      if (leftTree) {
        const leftLayoutResult = layout.layout(leftTree);
        leftResult = leftLayoutResult.result;
        leftBoundingBox = leftLayoutResult.boundingBox;
      }

      if (rightTree) {
        const rightLayoutResult = layout.layout(rightTree);
        rightResult = rightLayoutResult.result;
        rightBoundingBox = rightLayoutResult.boundingBox;
      }

      const positionedNodes = combineAndPositionTrees(
        rootNode,
        leftResult,
        rightResult,
        leftBoundingBox,
        rightBoundingBox,
        data
      );
      const positionedEdges = calculateEdgePositions(
        data.edges,
        positionedNodes,
        intersectionShift
      );

      resolve({
        nodes: positionedNodes,
        edges: positionedEdges,
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert LayoutData to dual-tree format (left and right trees)
 *
 * This function builds two separate tree structures from the nodes and edges,
 * alternating children between left and right trees.
 */
function convertToDualTreeFormat(data: LayoutData): {
  leftTree: TidyTreeNode | null;
  rightTree: TidyTreeNode | null;
  rootNode: TidyTreeNode;
} {
  const { nodes, edges } = data;

  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  const children = new Map<string, string[]>();
  const parents = new Map<string, string>();

  edges.forEach((edge) => {
    const parentId = edge.start;
    const childId = edge.end;

    if (parentId && childId) {
      if (!children.has(parentId)) {
        children.set(parentId, []);
      }
      children.get(parentId)!.push(childId);
      parents.set(childId, parentId);
    }
  });

  const rootNodeData = nodes.find((node) => !parents.has(node.id));
  if (!rootNodeData && nodes.length === 0) {
    throw new Error('No nodes available to create tree');
  }

  const actualRoot = rootNodeData ?? nodes[0];

  const rootNode: TidyTreeNode = {
    id: actualRoot.id,
    width: actualRoot.width ?? 100,
    height: actualRoot.height ?? 50,
    _originalNode: actualRoot,
  };

  const rootChildren = children.get(actualRoot.id) ?? [];
  const leftChildren: string[] = [];
  const rightChildren: string[] = [];

  rootChildren.forEach((childId, index) => {
    if (index % 2 === 0) {
      leftChildren.push(childId);
    } else {
      rightChildren.push(childId);
    }
  });

  const leftTree = leftChildren.length > 0 ? buildSubTree(leftChildren, children, nodeMap) : null;

  const rightTree =
    rightChildren.length > 0 ? buildSubTree(rightChildren, children, nodeMap) : null;

  return { leftTree, rightTree, rootNode };
}

/**
 * Build a subtree from a list of root children
 * For horizontal trees, we need to transpose width/height since the tree will be rotated 90°
 */
function buildSubTree(
  rootChildren: string[],
  children: Map<string, string[]>,
  nodeMap: Map<string, Node>
): TidyTreeNode {
  const virtualRoot: TidyTreeNode = {
    id: `virtual-root-${Math.random()}`,
    width: 1,
    height: 1,
    children: rootChildren
      .map((childId) => nodeMap.get(childId))
      .filter((child): child is Node => child !== undefined)
      .map((child) => convertNodeToTidyTreeTransposed(child, children, nodeMap)),
  };

  return virtualRoot;
}

/**
 * Recursively convert a node and its children to tidy-tree format
 * This version transposes width/height for horizontal tree layout
 */
function convertNodeToTidyTreeTransposed(
  node: Node,
  children: Map<string, string[]>,
  nodeMap: Map<string, Node>
): TidyTreeNode {
  const childIds = children.get(node.id) ?? [];
  const childNodes = childIds
    .map((childId) => nodeMap.get(childId))
    .filter((child): child is Node => child !== undefined)
    .map((child) => convertNodeToTidyTreeTransposed(child, children, nodeMap));

  return {
    id: node.id,
    width: node.height ?? 50,
    height: node.width ?? 100,
    children: childNodes.length > 0 ? childNodes : undefined,
    _originalNode: node,
  };
}
/**
 * Combine and position the left and right trees around the root node
 * Creates a bidirectional layout where left tree grows left and right tree grows right
 */
function combineAndPositionTrees(
  rootNode: TidyTreeNode,
  leftResult: TidyTreeNode | null,
  rightResult: TidyTreeNode | null,
  _leftBoundingBox: any,
  _rightBoundingBox: any,
  _data: LayoutData
): PositionedNode[] {
  const positionedNodes: PositionedNode[] = [];

  const rootX = 0;
  const rootY = 0;

  const treeSpacing = rootNode.width / 2 + 30;
  const leftTreeNodes: PositionedNode[] = [];
  const rightTreeNodes: PositionedNode[] = [];

  if (leftResult?.children) {
    positionLeftTreeBidirectional(leftResult.children, leftTreeNodes, rootX - treeSpacing, rootY);
  }

  if (rightResult?.children) {
    positionRightTreeBidirectional(
      rightResult.children,
      rightTreeNodes,
      rootX + treeSpacing,
      rootY
    );
  }

  let leftTreeCenterY = 0;
  let rightTreeCenterY = 0;

  if (leftTreeNodes.length > 0) {
    const leftTreeXPositions = [...new Set(leftTreeNodes.map((node) => node.x))].sort(
      (a, b) => b - a
    );
    const firstLevelLeftX = leftTreeXPositions[0];
    const firstLevelLeftNodes = leftTreeNodes.filter((node) => node.x === firstLevelLeftX);

    if (firstLevelLeftNodes.length > 0) {
      const leftMinY = Math.min(
        ...firstLevelLeftNodes.map((node) => node.y - (node.height ?? 50) / 2)
      );
      const leftMaxY = Math.max(
        ...firstLevelLeftNodes.map((node) => node.y + (node.height ?? 50) / 2)
      );
      leftTreeCenterY = (leftMinY + leftMaxY) / 2;
    }
  }

  if (rightTreeNodes.length > 0) {
    const rightTreeXPositions = [...new Set(rightTreeNodes.map((node) => node.x))].sort(
      (a, b) => a - b
    );
    const firstLevelRightX = rightTreeXPositions[0];
    const firstLevelRightNodes = rightTreeNodes.filter((node) => node.x === firstLevelRightX);

    if (firstLevelRightNodes.length > 0) {
      const rightMinY = Math.min(
        ...firstLevelRightNodes.map((node) => node.y - (node.height ?? 50) / 2)
      );
      const rightMaxY = Math.max(
        ...firstLevelRightNodes.map((node) => node.y + (node.height ?? 50) / 2)
      );
      rightTreeCenterY = (rightMinY + rightMaxY) / 2;
    }
  }

  const leftTreeOffset = -leftTreeCenterY;
  const rightTreeOffset = -rightTreeCenterY;

  positionedNodes.push({
    id: String(rootNode.id),
    x: rootX,
    y: rootY + 20,
    section: 'root',
    width: rootNode._originalNode?.width ?? rootNode.width,
    height: rootNode._originalNode?.height ?? rootNode.height,
    originalNode: rootNode._originalNode,
  });

  const leftTreeNodesWithOffset = leftTreeNodes.map((node) => ({
    id: node.id,
    x: node.x - (node.width ?? 0) / 2,
    y: node.y + leftTreeOffset + (node.height ?? 0) / 2,
    section: 'left' as const,
    width: node.width,
    height: node.height,
    originalNode: node.originalNode,
  }));

  const rightTreeNodesWithOffset = rightTreeNodes.map((node) => ({
    id: node.id,
    x: node.x + (node.width ?? 0) / 2,
    y: node.y + rightTreeOffset + (node.height ?? 0) / 2,
    section: 'right' as const,
    width: node.width,
    height: node.height,
    originalNode: node.originalNode,
  }));

  positionedNodes.push(...leftTreeNodesWithOffset);
  positionedNodes.push(...rightTreeNodesWithOffset);

  return positionedNodes;
}

/**
 * Position nodes from the left tree in a bidirectional layout (grows to the left)
 * Rotates the tree 90 degrees counterclockwise so it grows horizontally to the left
 */
function positionLeftTreeBidirectional(
  nodes: TidyTreeNode[],
  positionedNodes: PositionedNode[],
  offsetX: number,
  offsetY: number
): void {
  nodes.forEach((node) => {
    const distanceFromRoot = node.y ?? 0;
    const verticalPosition = node.x ?? 0;

    const originalWidth = node._originalNode?.width ?? 100;
    const originalHeight = node._originalNode?.height ?? 50;

    const adjustedY = offsetY + verticalPosition;

    positionedNodes.push({
      id: String(node.id),
      x: offsetX - distanceFromRoot,
      y: adjustedY,
      width: originalWidth,
      height: originalHeight,
      originalNode: node._originalNode,
    });

    if (node.children) {
      positionLeftTreeBidirectional(node.children, positionedNodes, offsetX, offsetY);
    }
  });
}

/**
 * Position nodes from the right tree in a bidirectional layout (grows to the right)
 * Rotates the tree 90 degrees clockwise so it grows horizontally to the right
 */
function positionRightTreeBidirectional(
  nodes: TidyTreeNode[],
  positionedNodes: PositionedNode[],
  offsetX: number,
  offsetY: number
): void {
  nodes.forEach((node) => {
    const distanceFromRoot = node.y ?? 0;
    const verticalPosition = node.x ?? 0;

    const originalWidth = node._originalNode?.width ?? 100;
    const originalHeight = node._originalNode?.height ?? 50;

    const adjustedY = offsetY + verticalPosition;

    positionedNodes.push({
      id: String(node.id),
      x: offsetX + distanceFromRoot,
      y: adjustedY,
      width: originalWidth,
      height: originalHeight,
      originalNode: node._originalNode,
    });

    if (node.children) {
      positionRightTreeBidirectional(node.children, positionedNodes, offsetX, offsetY);
    }
  });
}

/**
 * Calculate the intersection point of a line with a circle
 * @param circle - Circle coordinates and radius
 * @param lineStart - Starting point of the line
 * @param lineEnd - Ending point of the line
 * @returns The intersection point
 */
function computeCircleEdgeIntersection(
  circle: { x: number; y: number; width: number; height: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): { x: number; y: number } {
  const radius = Math.min(circle.width, circle.height) / 2;

  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return lineStart;
  }

  const nx = dx / length;
  const ny = dy / length;

  return {
    x: circle.x - nx * radius,
    y: circle.y - ny * radius,
  };
}

/**
 * Calculate intersection point of a line with a rectangle
 * This is a simplified version that we'll use instead of importing from mermaid
 */
function intersection(
  node: { x: number; y: number; width?: number; height?: number },
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): { x: number; y: number } {
  const nodeWidth = node.width ?? 100;
  const nodeHeight = node.height ?? 50;

  const centerX = node.x;
  const centerY = node.y;

  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  if (dx === 0 && dy === 0) {
    return { x: centerX, y: centerY };
  }

  const halfWidth = nodeWidth / 2;
  const halfHeight = nodeHeight / 2;

  let intersectionX = centerX;
  let intersectionY = centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      intersectionX = centerX + halfWidth;
      intersectionY = centerY + (halfWidth * dy) / dx;
    } else {
      intersectionX = centerX - halfWidth;
      intersectionY = centerY - (halfWidth * dy) / dx;
    }
  } else {
    if (dy > 0) {
      intersectionY = centerY + halfHeight;
      intersectionX = centerX + (halfHeight * dx) / dy;
    } else {
      intersectionY = centerY - halfHeight;
      intersectionX = centerX - (halfHeight * dx) / dy;
    }
  }

  return { x: intersectionX, y: intersectionY };
}

/**
 * Calculate edge positions based on positioned nodes
 * Now includes tree membership and node dimensions for precise edge calculations
 * Edges now stop at shape boundaries instead of extending to centers
 */
function calculateEdgePositions(
  edges: Edge[],
  positionedNodes: PositionedNode[],
  intersectionShift: number
): PositionedEdge[] {
  const nodeInfo = new Map<string, PositionedNode>();
  positionedNodes.forEach((node) => {
    nodeInfo.set(node.id, node);
  });

  return edges.map((edge) => {
    const sourceNode = nodeInfo.get(edge.start ?? '');
    const targetNode = nodeInfo.get(edge.end ?? '');

    if (!sourceNode || !targetNode) {
      return {
        id: edge.id,
        source: edge.start ?? '',
        target: edge.end ?? '',
        startX: 0,
        startY: 0,
        midX: 0,
        midY: 0,
        endX: 0,
        endY: 0,
        points: [{ x: 0, y: 0 }],
        sourceSection: undefined,
        targetSection: undefined,
        sourceWidth: undefined,
        sourceHeight: undefined,
        targetWidth: undefined,
        targetHeight: undefined,
      };
    }

    const sourceCenter = { x: sourceNode.x, y: sourceNode.y };
    const targetCenter = { x: targetNode.x, y: targetNode.y };

    const isSourceRound = ['circle', 'cloud', 'bang'].includes(
      sourceNode.originalNode?.shape ?? ''
    );
    const isTargetRound = ['circle', 'cloud', 'bang'].includes(
      targetNode.originalNode?.shape ?? ''
    );

    let startPos = isSourceRound
      ? computeCircleEdgeIntersection(
          {
            x: sourceNode.x,
            y: sourceNode.y,
            width: sourceNode.width ?? 100,
            height: sourceNode.height ?? 100,
          },
          targetCenter,
          sourceCenter
        )
      : intersection(sourceNode, sourceCenter, targetCenter);

    let endPos = isTargetRound
      ? computeCircleEdgeIntersection(
          {
            x: targetNode.x,
            y: targetNode.y,
            width: targetNode.width ?? 100,
            height: targetNode.height ?? 100,
          },
          sourceCenter,
          targetCenter
        )
      : intersection(targetNode, targetCenter, sourceCenter);

    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;

    const points = [startPos];
    if (sourceNode.section === 'left') {
      points.push({
        x: sourceNode.x - (sourceNode.width ?? 0) / 2 - intersectionShift,
        y: sourceNode.y,
      });
    } else if (sourceNode.section === 'right') {
      points.push({
        x: sourceNode.x + (sourceNode.width ?? 0) / 2 + intersectionShift,
        y: sourceNode.y,
      });
    }
    if (targetNode.section === 'left') {
      points.push({
        x: targetNode.x + (targetNode.width ?? 0) / 2 + intersectionShift,
        y: targetNode.y,
      });
    } else if (targetNode.section === 'right') {
      points.push({
        x: targetNode.x - (targetNode.width ?? 0) / 2 - intersectionShift,
        y: targetNode.y,
      });
    }

    points.push(endPos);

    const secondPoint = points.length > 1 ? points[1] : targetCenter;
    startPos = isSourceRound
      ? computeCircleEdgeIntersection(
          {
            x: sourceNode.x,
            y: sourceNode.y,
            width: sourceNode.width ?? 100,
            height: sourceNode.height ?? 100,
          },
          secondPoint,
          sourceCenter
        )
      : intersection(sourceNode, secondPoint, sourceCenter);
    points[0] = startPos;

    const secondLastPoint = points.length > 1 ? points[points.length - 2] : sourceCenter;
    endPos = isTargetRound
      ? computeCircleEdgeIntersection(
          {
            x: targetNode.x,
            y: targetNode.y,
            width: targetNode.width ?? 100,
            height: targetNode.height ?? 100,
          },
          secondLastPoint,
          targetCenter
        )
      : intersection(targetNode, secondLastPoint, targetCenter);
    points[points.length - 1] = endPos;

    return {
      id: edge.id,
      source: edge.start ?? '',
      target: edge.end ?? '',
      startX: startPos.x,
      startY: startPos.y,
      midX,
      midY,
      endX: endPos.x,
      endY: endPos.y,
      points,
      sourceSection: sourceNode?.section,
      targetSection: targetNode?.section,
      sourceWidth: sourceNode?.width,
      sourceHeight: sourceNode?.height,
      targetWidth: targetNode?.width,
      targetHeight: targetNode?.height,
    };
  });
}

/**
 * Validate layout data structure
 * @param data - The data to validate
 * @returns True if data is valid, throws error otherwise
 */
export function validateLayoutData(data: LayoutData): boolean {
  if (!data) {
    throw new Error('Layout data is required');
  }

  if (!data.config) {
    throw new Error('Configuration is required in layout data');
  }

  if (!Array.isArray(data.nodes)) {
    throw new Error('Nodes array is required in layout data');
  }

  if (!Array.isArray(data.edges)) {
    throw new Error('Edges array is required in layout data');
  }

  return true;
}
