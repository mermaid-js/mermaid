import { BoundingBox, Layout } from 'non-layered-tidy-tree-layout';
import type { MermaidConfig } from '../../../config.type.js';
import { log } from '../../../logger.js';
import type { LayoutData, Node, Edge } from '../../types.js';
import type { LayoutResult, TidyTreeNode, PositionedNode, PositionedEdge } from './types.js';

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
  log.debug('Starting tidy-tree layout algorithm');

  return new Promise((resolve, reject) => {
    try {
      // Validate input data
      if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        throw new Error('No nodes found in layout data');
      }

      if (!data.edges || !Array.isArray(data.edges)) {
        data.edges = []; // Allow empty edges for single-node trees
      }

      // Convert layout data to dual-tree format (left and right trees)
      const { leftTree, rightTree, rootNode } = convertToDualTreeFormat(data);

      // Configure tidy-tree layout
      const gap = 20; // Horizontal gap between nodes
      const bottomPadding = 40; // Vertical gap between levels
      const bb = new BoundingBox(gap, bottomPadding);
      const layout = new Layout(bb);

      // Execute layout algorithm for both trees
      let leftResult = null;
      let rightResult = null;
      let leftBoundingBox = null;
      let rightBoundingBox = null;

      if (leftTree) {
        console.log('combineAndPositionTrees leftTree', JSON.stringify(leftTree));
        const leftLayoutResult = layout.layout(leftTree);
        leftResult = leftLayoutResult.result;
        leftBoundingBox = leftLayoutResult.boundingBox;
      }

      if (rightTree) {
        console.log('combineAndPositionTrees leftTree', JSON.stringify(rightTree));
        const rightLayoutResult = layout.layout(rightTree);
        rightResult = rightLayoutResult.result;
        rightBoundingBox = rightLayoutResult.boundingBox;
      }

      // Combine and position the trees
      const positionedNodes = combineAndPositionTrees(
        rootNode,
        leftResult,
        rightResult,
        leftBoundingBox,
        rightBoundingBox,
        data
      );
      const positionedEdges = calculateEdgePositions(data.edges, positionedNodes);

      log.debug(
        `Tidy-tree layout completed: ${positionedNodes.length} nodes, ${positionedEdges.length} edges`
      );
      if (leftBoundingBox || rightBoundingBox) {
        log.debug(
          `Left bounding box: ${leftBoundingBox ? `left=${leftBoundingBox.left}, right=${leftBoundingBox.right}, top=${leftBoundingBox.top}, bottom=${leftBoundingBox.bottom}` : 'none'}`
        );
        log.debug(
          `Right bounding box: ${rightBoundingBox ? `left=${rightBoundingBox.left}, right=${rightBoundingBox.right}, top=${rightBoundingBox.top}, bottom=${rightBoundingBox.bottom}` : 'none'}`
        );
      }

      resolve({
        nodes: positionedNodes,
        edges: positionedEdges,
      });
    } catch (error) {
      log.error('Error in tidy-tree layout algorithm:', error);
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

  // Create a map of nodes for quick lookup
  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Build adjacency list to represent parent-child relationships
  const children = new Map<string, string[]>();
  const parents = new Map<string, string>();

  edges.forEach((edge) => {
    const parentId = edge.start;
    const childId = edge.end;

    if (!children.has(parentId)) {
      children.set(parentId, []);
    }
    children.get(parentId)!.push(childId);
    parents.set(childId, parentId);
  });

  // Find root node (node with no parent)
  const rootNodeData = nodes.find((node) => !parents.has(node.id));
  if (!rootNodeData) {
    // If no clear root, use the first node
    if (nodes.length === 0) {
      throw new Error('No nodes available to create tree');
    }
    log.warn('No root node found, using first node as root');
  }

  const actualRoot = rootNodeData || nodes[0];

  // Create root node
  const rootNode: TidyTreeNode = {
    id: actualRoot.id,
    width: actualRoot.width || 100,
    height: actualRoot.height || 50,
    _originalNode: actualRoot,
  };

  // Get root's children and split them alternately
  const rootChildren = children.get(actualRoot.id) || [];
  const leftChildren: string[] = [];
  const rightChildren: string[] = [];

  rootChildren.forEach((childId, index) => {
    if (index % 2 === 0) {
      leftChildren.push(childId);
    } else {
      rightChildren.push(childId);
    }
  });

  // Build left and right trees
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
  // Create a virtual root for this subtree
  const virtualRoot: TidyTreeNode = {
    id: `virtual-root-${Math.random()}`,
    width: 1, // Minimal size for virtual root
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
  const childIds = children.get(node.id) || [];
  const childNodes = childIds
    .map((childId) => nodeMap.get(childId))
    .filter((child): child is Node => child !== undefined)
    .map((child) => convertNodeToTidyTreeTransposed(child, children, nodeMap));

  // Transpose width and height for horizontal layout
  // When tree grows horizontally, the original width becomes the height in the layout
  // and the original height becomes the width in the layout
  return {
    id: node.id,
    width: node.height || 50, // Original height becomes layout width
    height: node.width || 100, // Original width becomes layout height
    children: childNodes.length > 0 ? childNodes : undefined,
    // Store original node data for later use
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

  console.log('combineAndPositionTrees', {
    leftResult,
    rightResult,
  });

  // Calculate root position (center of the layout)
  const rootX = 0;
  const rootY = 0;

  // Calculate spacing between trees
  const treeSpacing = 150; // Horizontal spacing from root to tree

  // First, collect node positions for each tree separately
  const leftTreeNodes: PositionedNode[] = [];
  const rightTreeNodes: PositionedNode[] = [];

  // Position left tree (grows to the left)
  if (leftResult?.children) {
    positionLeftTreeBidirectional(leftResult.children, leftTreeNodes, rootX - treeSpacing, rootY);
  }

  // Position right tree (grows to the right)
  if (rightResult?.children) {
    positionRightTreeBidirectional(
      rightResult.children,
      rightTreeNodes,
      rootX + treeSpacing,
      rootY
    );
  }

  // Calculate center points for each tree separately
  let leftTreeCenterY = 0;
  let rightTreeCenterY = 0;

  if (leftTreeNodes.length > 0) {
    const leftMinY = Math.min(...leftTreeNodes.map((node) => node.y));
    const leftMaxY = Math.max(...leftTreeNodes.map((node) => node.y));
    leftTreeCenterY = (leftMinY + leftMaxY) / 2;
  }

  if (rightTreeNodes.length > 0) {
    const rightMinY = Math.min(...rightTreeNodes.map((node) => node.y));
    const rightMaxY = Math.max(...rightTreeNodes.map((node) => node.y));
    rightTreeCenterY = (rightMinY + rightMaxY) / 2;
  }

  // Calculate different offsets for each tree to center them around the root
  const leftTreeOffset = -leftTreeCenterY;
  const rightTreeOffset = -rightTreeCenterY;

  // Add the centered root
  positionedNodes.push({
    id: String(rootNode.id),
    x: rootX,
    y: rootY, // Root stays at center
  });

  // Add left tree nodes with their specific offset
  leftTreeNodes.forEach((node) => {
    positionedNodes.push({
      id: node.id,
      x: node.x,
      y: node.y + leftTreeOffset,
    });
  });

  // Add right tree nodes with their specific offset
  rightTreeNodes.forEach((node) => {
    positionedNodes.push({
      id: node.id,
      x: node.x,
      y: node.y + rightTreeOffset,
    });
  });

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
    // For left tree: transpose the tidy-tree coordinates
    // Tidy-tree Y becomes our X distance from root (grows left)
    // Tidy-tree X becomes our Y position (tree levels) - this gives proper spacing
    const distanceFromRoot = node.y ?? 0; // How far left from root
    const treeLevel = node.x ?? 0; // Use X coordinate for tree level (proper vertical spacing)

    positionedNodes.push({
      id: String(node.id),
      x: offsetX - distanceFromRoot, // Negative to grow left from root
      y: offsetY + treeLevel, // Use tidy-tree's Y as Y (tree levels)
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
    // For right tree: transpose the tidy-tree coordinates
    // Tidy-tree Y becomes our X distance from root (grows right)
    // Tidy-tree X becomes our Y position (tree levels) - this gives proper spacing
    const distanceFromRoot = node.y ?? 0; // How far right from root
    const treeLevel = node.x ?? 0; // Use X coordinate for tree level (proper vertical spacing)

    positionedNodes.push({
      id: String(node.id),
      x: offsetX + distanceFromRoot, // Positive to grow right from root
      y: offsetY + treeLevel, // Use tidy-tree's Y as Y (tree levels)
    });

    if (node.children) {
      positionRightTreeBidirectional(node.children, positionedNodes, offsetX, offsetY);
    }
  });
}

/**
 * Calculate edge positions based on positioned nodes
 */
function calculateEdgePositions(
  edges: Edge[],
  positionedNodes: PositionedNode[]
): PositionedEdge[] {
  const nodePositions = new Map<string, { x: number; y: number }>();
  positionedNodes.forEach((node) => {
    nodePositions.set(node.id, { x: node.x, y: node.y });
  });

  return edges.map((edge) => {
    const startPos = nodePositions.get(edge.start || '') || { x: 0, y: 0 };
    const endPos = nodePositions.get(edge.end || '') || { x: 0, y: 0 };

    // Calculate midpoint for edge
    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;

    return {
      id: edge.id,
      source: edge.start || '',
      target: edge.end || '',
      startX: startPos.x,
      startY: startPos.y,
      midX,
      midY,
      endX: endPos.x,
      endY: endPos.y,
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
