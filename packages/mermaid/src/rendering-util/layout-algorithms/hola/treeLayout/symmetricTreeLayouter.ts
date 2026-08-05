/* eslint-disable @cspell/spellchecker */
import type { LayoutData, Node, Edge } from '../../../types.js';
import {
  DEFAULT_LEVEL_SPACING,
  MIN_HORIZONTAL_GAP,
  MIN_LEVEL_SPACING,
  MIN_VERTICAL_PADDING,
  NODE_SPACING,
  TREE_LAYOUT_MIN_WIDTH,
} from '../Constants.js';
import type { Position, TreeNode, TreeEdge, TreeLayout, TreeStructure } from './types.js';

/**
 * Step 3a: Symmetric Tree Layout Implementation
 * Based on Manning & Atallah algorithm principles for symmetric tree drawing
 */
/* cspell:disable-next-line */
export class SymmetricTreeLayouter {
  private nodeSpacing = NODE_SPACING;
  private defaultLevelSpacing = DEFAULT_LEVEL_SPACING;
  private minVerticalPadding = MIN_VERTICAL_PADDING;
  private minLevelSpacing = MIN_LEVEL_SPACING;
  private minHorizontalGap = MIN_HORIZONTAL_GAP;
  private nodes = new Map<string, TreeNode>();
  private edges: Edge[] = [];
  private levelHeights = new Map<number, number>();

  /**
   * Initialize the Symmetric Tree Layouter with layout data.
   * Sets up node spacing, level spacing, and padding parameters for optimal tree layout.
   * Creates tree nodes from layout data and identifies copy nodes for tree structure.
   *
   * @param layoutData - The layout data containing nodes and edges to be arranged
   */
  constructor(layoutData: LayoutData) {
    this.initializeNodes(layoutData.nodes);
    this.edges = layoutData.edges ?? [];

    this.edges.forEach((edge) => {
      [edge.start, edge.end].forEach((nodeId) => {
        if (nodeId?.includes('_copy') && !this.nodes.has(nodeId)) {
          const coreNodeId = nodeId.replace('_copy', '');
          const coreNode = this.nodes.get(coreNodeId);
          if (coreNode) {
            this.nodes.set(nodeId, {
              ...coreNode,
              id: nodeId,
              x: 0,
              y: 0,
              level: 0,
              subtreeWidth: 0,
            } as TreeNode);
          }
        }
      });
    });
  }

  /**
   * Initialize nodes from layout data and convert them to tree nodes.
   * Sets up initial positioning properties and subtree width tracking.
   * Each node is converted to a TreeNode with additional tree-specific properties.
   *
   * @param nodes - Array of nodes from the layout data
   */
  private initializeNodes(nodes: Node[]): void {
    nodes.forEach((node) => {
      this.nodes.set(node.id, {
        ...node,
        x: 0,
        y: 0,
        level: 0,
        subtreeWidth: 0,
      } as TreeNode);
    });
  }

  /**
   * Main entry point for symmetric tree layout
   * Implements HOLA Step 3a requirements - CORRECTED VERSION
   */
  layoutTree(rootId: string): TreeLayout {
    const treeStructure = this.buildTreeStructure(rootId);

    // Phase 0: Calculate maximum height for each level
    this.calculateLevelHeights(treeStructure);

    // Phase 1: Calculate subtree widths (bottom-up)
    this.calculateSubtreeWidths(treeStructure);

    // Phase 2: Position nodes for symmetry (top-down)
    this.positionNodesSymmetrically(treeStructure);

    // Phase 2.5: Adjust positions for nodes with multiple parents (merge/join nodes)
    // this.adjustMergeNodePositions(treeStructure);

    // Phase 3: Route edges orthogonally
    // const routedEdges = this.routeTreeEdgesOrthogonally(treeStructure);

    // Phase 4: Calculate bounding box
    const boundingBox = this.calculateBoundingBox();
    const rootPosition = this.getRootPosition(rootId);

    const treeEdges = this.edges.map(
      (edge) =>
        ({
          id: edge.id,
          start: edge.start ?? '',
          end: edge.end ?? '',
          points: edge.points ?? [],
        }) as TreeEdge
    );

    return {
      nodes: [...this.nodes.values()],
      edges: treeEdges,
      boundingBox,
      rootPosition,
    };
  }

  /**
   * Build tree structure from layout data
   * Identifies parent-child relationships and assigns levels
   */
  public buildTreeStructure(rootId: string): TreeStructure {
    const children = new Map<string, string[]>();
    const parent = new Map<string, string>();
    const levels = new Map<string, number>();

    this.nodes.forEach((_, nodeId) => {
      children.set(nodeId, []);
    });

    const rootNode = this.nodes.get(rootId);
    const isSubgraphContainer =
      rootNode &&
      !this.edges.some((e) => e.start === rootId || e.end === rootId) &&
      (rootNode.width === undefined || rootNode.height === undefined);

    if (isSubgraphContainer) {
      const inDegree = new Map<string, number>();
      this.nodes.forEach((_, nodeId) => {
        if (nodeId !== rootId) {
          inDegree.set(nodeId, 0);
        }
      });

      this.edges.forEach((edge) => {
        if (edge.end && edge.end !== rootId) {
          inDegree.set(edge.end, (inDegree.get(edge.end) ?? 0) + 1);
        }
      });

      const potentialRoots: string[] = [];
      inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
          potentialRoots.push(nodeId);
        }
      });

      if (potentialRoots.length > 0) {
        rootId = potentialRoots[0];
      } else {
        let minDegree = Infinity;
        let minDegreeNode = '';
        inDegree.forEach((degree, nodeId) => {
          if (degree < minDegree) {
            minDegree = degree;
            minDegreeNode = nodeId;
          }
        });
        if (minDegreeNode) {
          rootId = minDegreeNode;
        }
      }
    }

    const queue: { nodeId: string; level: number }[] = [{ nodeId: rootId, level: 0 }];
    const visited = new Set<string>();

    visited.add(rootId);
    levels.set(rootId, 0);
    this.nodes.get(rootId)!.level = 0;

    while (queue.length > 0) {
      const { nodeId: currentId, level } = queue.shift()!;

      this.edges.forEach((edge) => {
        let childId: string | undefined;

        if (edge.start === currentId && !visited.has(edge.end!)) {
          childId = edge.end!;
        } else if (edge.end === currentId && !visited.has(edge.start!)) {
          childId = edge.start!;
        }

        if (childId) {
          visited.add(childId);
          children.get(currentId)!.push(childId);
          parent.set(childId, currentId);
          levels.set(childId, level + 1);
          this.nodes.get(childId)!.level = level + 1;

          queue.push({ nodeId: childId, level: level + 1 });
        }
      });
    }

    return { root: rootId, children, parent, levels };
  }

  /**
   * Calculate the maximum height for each level to determine dynamic spacing
   * This ensures nodes don't overlap vertically regardless of their size
   */
  private calculateLevelHeights(_tree: TreeStructure): void {
    this.levelHeights.clear();

    this.nodes.forEach((node) => {
      const level = node.level;
      const nodeHeight = typeof node.height === 'number' ? node.height : 40;
      const currentMaxHeight = this.levelHeights.get(level) ?? 0;
      this.levelHeights.set(level, Math.max(currentMaxHeight, nodeHeight));
    });
  }

  /**
   * Calculate the Y position for a given level based on cumulative heights
   */
  private getYPositionForLevel(level: number): number {
    if (level === 0) {
      return 0;
    }

    let y = 0;
    for (let i = 0; i < level; i++) {
      const currentLevelHeight = this.levelHeights.get(i) ?? 40;
      const nextLevelHeight = this.levelHeights.get(i + 1) ?? 40;

      const boundarySpacing =
        currentLevelHeight / 2 + this.minVerticalPadding + nextLevelHeight / 2;
      const spacing = Math.max(this.minLevelSpacing, boundarySpacing);

      y += spacing;
    }

    return y;
  }

  /**
   * Calculate subtree widths bottom-up for symmetric positioning.
   * Uses boundary-to-boundary: leaf width = node width; parent width = sum(children) + (n-1)*minHorizontalGap.
   */
  private calculateSubtreeWidths(tree: TreeStructure): void {
    const defaultNodeWidth = 60;

    const calculateWidth = (nodeId: string): number => {
      const node = this.nodes.get(nodeId)!;
      const childIds = tree.children.get(nodeId) ?? [];

      if (childIds.length === 0) {
        const nodeWidth = typeof node.width === 'number' ? node.width : defaultNodeWidth;
        node.subtreeWidth = nodeWidth;
        return node.subtreeWidth;
      }

      let totalChildWidth = 0;
      childIds.forEach((childId) => {
        totalChildWidth += calculateWidth(childId);
      });

      const gapBetweenSiblings =
        childIds.length > 1 ? (childIds.length - 1) * this.minHorizontalGap : 0;
      node.subtreeWidth = totalChildWidth + gapBetweenSiblings;
      return node.subtreeWidth;
    };

    calculateWidth(tree.root);
  }

  /**
   * Position nodes for maximum symmetry using top-down approach
   * Implements HOLA requirement: "maximize symmetry" and "balance subtrees"
   */
  private positionNodesSymmetrically(tree: TreeStructure): void {
    const positionSubtree = (nodeId: string, centerX: number): void => {
      const node = this.nodes.get(nodeId)!;
      const childIds = tree.children.get(nodeId) ?? [];

      node.x = centerX;
      node.y = this.getYPositionForLevel(node.level);

      if (childIds.length === 0) {
        return;
      }

      if (childIds.length === 1) {
        positionSubtree(childIds[0], centerX);
      } else {
        const pairedChildren = this.createCTreePairs(childIds, tree);
        this.positionPairedSubtrees(pairedChildren, centerX, tree);
      }
    };

    positionSubtree(tree.root, 0);
  }

  /**
   * Adjust positions for nodes with multiple parents (merge/join nodes)
   * Centers such nodes between their parent nodes for better symmetry
   * Only adjusts nodes where multiple parents exist at the PREVIOUS level (true convergence)
   */
  private adjustMergeNodePositions(tree: TreeStructure): void {
    const incomingEdgesSet = new Map<string, Set<string>>();

    this.edges.forEach((edge) => {
      const target = edge.end!;
      const source = edge.start!;

      const targetNode = this.nodes.get(target);
      const sourceNode = this.nodes.get(source);

      if (targetNode && sourceNode && sourceNode.level < targetNode.level) {
        if (!incomingEdgesSet.has(target)) {
          incomingEdgesSet.set(target, new Set());
        }
        incomingEdgesSet.get(target)!.add(source);
      }
    });

    const incomingEdges = new Map<string, string[]>();
    incomingEdgesSet.forEach((parentSet, nodeId) => {
      incomingEdges.set(nodeId, [...parentSet]);
    });

    const mergeNodes: string[] = [];
    incomingEdges.forEach((parents, nodeId) => {
      if (parents.length > 1) {
        const parentLevels = parents.map((p) => this.nodes.get(p)?.level ?? -1);

        const levelCounts = new Map<number, number>();
        parentLevels.forEach((level) => {
          if (level >= 0) {
            levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
          }
        });

        const hasParallelParents = [...levelCounts.values()].some((count) => count >= 2);

        if (hasParallelParents) {
          mergeNodes.push(nodeId);
        }
      }
    });

    mergeNodes.forEach((mergeNodeId) => {
      const mergeNode = this.nodes.get(mergeNodeId);
      if (!mergeNode) {
        return;
      }

      const allParents = incomingEdges.get(mergeNodeId)!;

      const parentsByLevel = new Map<number, string[]>();
      allParents.forEach((parentId) => {
        const parentNode = this.nodes.get(parentId);
        if (parentNode) {
          const level = parentNode.level;
          if (!parentsByLevel.has(level)) {
            parentsByLevel.set(level, []);
          }
          parentsByLevel.get(level)!.push(parentId);
        }
      });

      let maxCount = 0;
      let parallelParents: string[] = [];
      parentsByLevel.forEach((parents) => {
        if (parents.length > maxCount) {
          maxCount = parents.length;
          parallelParents = parents;
        }
      });

      if (parallelParents.length < 2) {
        return;
      }

      let sumX = 0;
      parallelParents.forEach((parentId) => {
        const parentNode = this.nodes.get(parentId);
        if (parentNode) {
          sumX += parentNode.x;
        }
      });

      const centerX = sumX / parallelParents.length;
      const offsetX = centerX - mergeNode.x;

      const adjustSubtree = (nodeId: string): void => {
        const node = this.nodes.get(nodeId);
        if (!node) {
          return;
        }

        node.x += offsetX;

        const childIds = tree.children.get(nodeId) ?? [];
        childIds.forEach((childId) => adjustSubtree(childId));
      };

      adjustSubtree(mergeNodeId);
    });
  }

  /**
   * Create c-tree pairs for structural symmetry (Manning & Atallah algorithm)
   * Groups children into pairs based on subtree size and structure for optimal balance
   */
  private createCTreePairs(
    childIds: string[],
    tree: TreeStructure
  ): { left: string; right?: string; size: number }[] {
    const childWidths = childIds.map((childId) => this.nodes.get(childId)!.subtreeWidth);
    const maxChildWidth = Math.max(...childWidths);
    const uniformSize = maxChildWidth;

    const childProperties = childIds.map((childId) => ({
      id: childId,
      size: uniformSize,
      actualWidth: this.nodes.get(childId)!.subtreeWidth,
      depth: this.calculateSubtreeDepth(childId, tree),
      nodeCount: this.calculateSubtreeNodeCount(childId, tree),
    }));

    childProperties.sort((a, b) => {
      return a.size - b.size;
    });

    const pairs: { left: string; right?: string; size: number }[] = [];
    const used = new Set<string>();

    for (let i = 0; i < childProperties.length; i++) {
      if (used.has(childProperties[i].id)) {
        continue;
      }

      const leftChild = childProperties[i];
      used.add(leftChild.id);

      let bestPartner = null;
      let bestScore = Infinity;

      for (let j = i + 1; j < childProperties.length; j++) {
        if (used.has(childProperties[j].id)) {
          continue;
        }

        const rightChild = childProperties[j];

        // Priority 1: Structural isomorphism (perfect match = 0.0)
        const structuralSimilarity = this.computeStructuralSimilarity(
          leftChild.id,
          rightChild.id,
          tree
        );

        // Priority 2: Size/depth/branching differences (heuristic fallback)
        const sizeRatio =
          Math.abs(leftChild.size - rightChild.size) / Math.max(leftChild.size, rightChild.size);
        const depthDiff = Math.abs(leftChild.depth - rightChild.depth);
        const nodeDiff = Math.abs(leftChild.nodeCount - rightChild.nodeCount);

        const pairingScore =
          structuralSimilarity * 0.6 + sizeRatio * 0.2 + depthDiff * 0.1 + nodeDiff * 0.1;

        if (pairingScore < bestScore) {
          bestScore = pairingScore;
          bestPartner = rightChild;
        }
      }

      if (bestPartner && bestScore < 0.5) {
        used.add(bestPartner.id);
        pairs.push({
          left: leftChild.id,
          right: bestPartner.id,
          size: leftChild.actualWidth + this.minHorizontalGap + bestPartner.actualWidth,
        });
      } else {
        pairs.push({
          left: leftChild.id,
          right: undefined,
          size: leftChild.actualWidth,
        });
      }
    }

    return pairs;
  }

  /**
   * Position paired subtrees symmetrically around parent center
   * Manning & Atallah c-tree pairing implementation
   */
  private positionPairedSubtrees(
    pairs: { left: string; right?: string; size: number }[],
    centerX: number,
    tree: TreeStructure
  ): void {
    if (pairs.length === 0) {
      return;
    }

    const gapBetweenPairs = pairs.length > 1 ? (pairs.length - 1) * this.minHorizontalGap : 0;
    const totalWidth = pairs.reduce((sum, pair) => sum + pair.size, 0) + gapBetweenPairs;

    let currentX = centerX - totalWidth / 2;

    pairs.forEach((pair, pairIndex) => {
      if (pair.right) {
        const leftWidth = this.nodes.get(pair.left)!.subtreeWidth;
        const rightWidth = this.nodes.get(pair.right)!.subtreeWidth;
        const leftCenterX = currentX + leftWidth / 2;
        const rightCenterX = currentX + leftWidth + this.minHorizontalGap + rightWidth / 2;

        const positionSubtree = (nodeId: string, subCenterX: number): void => {
          const node = this.nodes.get(nodeId)!;
          const childIds = tree.children.get(nodeId) ?? [];

          node.x = subCenterX;
          node.y = this.getYPositionForLevel(node.level);

          if (childIds.length > 0) {
            if (childIds.length === 1) {
              positionSubtree(childIds[0], subCenterX);
            } else {
              const childPairs = this.createCTreePairs(childIds, tree);
              this.positionPairedSubtrees(childPairs, subCenterX, tree);
            }
          }
        };

        positionSubtree(pair.left, leftCenterX);
        positionSubtree(pair.right, rightCenterX);
      } else {
        const singleWidth = this.nodes.get(pair.left)!.subtreeWidth;
        const singleCenterX = currentX + singleWidth / 2;

        const positionSubtree = (nodeId: string, subCenterX: number): void => {
          const node = this.nodes.get(nodeId)!;
          const childIds = tree.children.get(nodeId) ?? [];

          node.x = subCenterX;
          node.y = this.getYPositionForLevel(node.level);

          if (childIds.length > 0) {
            if (childIds.length === 1) {
              positionSubtree(childIds[0], subCenterX);
            } else {
              const childPairs = this.createCTreePairs(childIds, tree);
              this.positionPairedSubtrees(childPairs, subCenterX, tree);
            }
          }
        };

        positionSubtree(pair.left, singleCenterX);
      }

      currentX += pair.size;
      if (pairIndex < pairs.length - 1) {
        currentX += this.minHorizontalGap;
      }
    });
  }

  /**
   * Calculate subtree depth for structural analysis
   */
  private calculateSubtreeDepth(nodeId: string, tree: TreeStructure): number {
    const children = tree.children.get(nodeId) ?? [];
    if (children.length === 0) {
      return 1;
    }

    let maxChildDepth = 0;
    children.forEach((childId) => {
      const childDepth = this.calculateSubtreeDepth(childId, tree);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    });

    return 1 + maxChildDepth;
  }

  /**
   * Calculate subtree node count for structural balance
   */
  private calculateSubtreeNodeCount(nodeId: string, tree: TreeStructure): number {
    const children = tree.children.get(nodeId) ?? [];
    let count = 1;

    children.forEach((childId) => {
      count += this.calculateSubtreeNodeCount(childId, tree);
    });

    return count;
  }

  /**
   * Compute structural hash for subtree isomorphism detection
   *
   * HOLA Theory: "If the tree is structurally symmetric (left and right subtrees
   * mirror each other), the layout algorithm will place it so that it is perfectly
   * symmetric about a vertical axis through the root[66]"
   *
   * This method computes a canonical hash representing the subtree structure,
   * allowing detection of structurally identical (isomorphic) subtrees.
   *
   * @param nodeId - Root of subtree
   * @param tree - Tree structure
   * @returns Structural hash string (identical for isomorphic subtrees)
   */
  private computeStructuralHash(nodeId: string, tree: TreeStructure): string {
    if (!tree?.children) {
      return 'L';
    }

    const children = tree.children.get(nodeId) ?? [];

    if (children.length === 0) {
      return 'L';
    }

    const childHashes = children.map((childId) => this.computeStructuralHash(childId, tree));

    childHashes.sort();

    return `N(${childHashes.join(',')})`;
  }

  /**
   * Check if two subtrees are structurally isomorphic
   *
   * @param nodeId1 - First subtree root
   * @param nodeId2 - Second subtree root
   * @param tree - Tree structure
   * @returns true if subtrees are structurally identical
   */
  private areSubtreesIsomorphic(nodeId1: string, nodeId2: string, tree: TreeStructure): boolean {
    if (!tree?.children) {
      return false;
    }

    const hash1 = this.computeStructuralHash(nodeId1, tree);
    const hash2 = this.computeStructuralHash(nodeId2, tree);
    return hash1 === hash2;
  }

  /**
   * Compute structural similarity score between two subtrees
   *
   * Returns 0.0 for identical structure, 1.0 for completely different
   * Uses normalized tree edit distance approximation
   *
   * @param nodeId1 - First subtree root
   * @param nodeId2 - Second subtree root
   * @param tree - Tree structure
   * @returns Similarity score [0.0 = identical, 1.0 = completely different]
   */
  private computeStructuralSimilarity(
    nodeId1: string,
    nodeId2: string,
    tree: TreeStructure
  ): number {
    if (!tree?.children) {
      return 1.0;
    }

    if (this.areSubtreesIsomorphic(nodeId1, nodeId2, tree)) {
      return 0.0;
    }

    const size1 = this.calculateSubtreeNodeCount(nodeId1, tree);
    const size2 = this.calculateSubtreeNodeCount(nodeId2, tree);
    const depth1 = this.calculateSubtreeDepth(nodeId1, tree);
    const depth2 = this.calculateSubtreeDepth(nodeId2, tree);

    const children1 = tree.children.get(nodeId1)?.length ?? 0;
    const children2 = tree.children.get(nodeId2)?.length ?? 0;

    const sizeDiff = Math.abs(size1 - size2) / Math.max(size1, size2);
    const depthDiff = Math.abs(depth1 - depth2) / Math.max(depth1, depth2);
    const branchingDiff = Math.abs(children1 - children2) / Math.max(children1, children2, 1);

    return sizeDiff * 0.3 + depthDiff * 0.4 + branchingDiff * 0.3;
  }

  /**
   * Route tree edges with orthogonal connectors
   * Implements HOLA requirement: "orthogonal edge routing in trees"
   */
  private routeTreeEdgesOrthogonally(tree: TreeStructure): TreeEdge[] {
    const routedEdges: TreeEdge[] = [];

    this.edges.forEach((edge) => {
      const startNode = this.nodes.get(edge.start!);
      const endNode = this.nodes.get(edge.end!);

      if (!startNode || !endNode) {
        return;
      }

      const isParentToChild = tree.parent.get(edge.end!) === edge.start;
      const parent = isParentToChild ? startNode : endNode;
      const child = isParentToChild ? endNode : startNode;

      const points: Position[] = [];

      const intermediateY = (parent.y + child.y) / 2;

      points.push(
        { x: parent.x, y: parent.y },
        { x: parent.x, y: intermediateY },
        { x: child.x, y: intermediateY },
        { x: child.x, y: child.y }
      );

      routedEdges.push({
        ...edge,
        points,
      } as TreeEdge);
    });

    return routedEdges;
  }

  /**
   * Calculate bounding box of the tree layout
   */
  private calculateBoundingBox(): TreeLayout['boundingBox'] {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const width = Math.max(maxX - minX, TREE_LAYOUT_MIN_WIDTH);
    const height = Math.max(maxY - minY, this.defaultLevelSpacing);

    return {
      width,
      height,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  /**
   * Get root node position within the tree layout
   */
  private getRootPosition(rootId: string): Position {
    const rootNode = this.nodes.get(rootId)!;
    return { x: rootNode.x, y: rootNode.y };
  }
}
