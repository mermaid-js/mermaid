/* eslint-disable @cspell/spellchecker */
import type { LayoutData, Node, Edge } from '../../../types.js';
import { SymmetricTreeLayouter } from './symmetricTreeLayouter.js';
import { CorePlanarizer } from './corePlanarizer.js';
import { TreePlacer } from './treePlacer.js';
import { performGlobalStressMinimization } from './stressMinimization.js';
import { convertPlanarizedToLayoutData } from './utils.js';
import type { TreeLayout } from './types.js';
import { log } from '../../../../logger.js';
import { DEFAULT_TREE_PADDING } from '../Constants.js';

/**
 * Main function to layout trees symmetrically with planarization and placement
 * Step 3a: Symmetric Layout of Each Tree
 * Step 3b: Planarization of Core for face identification
 * Step 3c: Intelligent Tree Placement into Faces
 */
export function layoutAndPlaceTrees(
  coreWithCoordinates: LayoutData,
  trees: Map<string, LayoutData>,
  uniformEdgeLength: number
): LayoutData {
  const treeLayouts = new Map<string, TreeLayout>();

  // Step 3a: Process each tree independently for symmetric layout
  log.trace('\n STEP 3A: Starting tree layout processing');
  for (const [rootId, treeData] of trees) {
    const layoutEngine = new SymmetricTreeLayouter(treeData);

    let dummyRootId = treeData.nodes.find((node) => node.id.includes('_copy'))?.id;

    if (!dummyRootId && treeData.edges) {
      const copyEdge = treeData.edges.find(
        (edge) => (edge.start?.includes('_copy') ?? false) || (edge.end?.includes('_copy') ?? false)
      );
      if (copyEdge) {
        dummyRootId = copyEdge.start?.includes('_copy') ? copyEdge.start : copyEdge.end;
      }
    }

    dummyRootId = dummyRootId ?? rootId;

    const treeLayout = layoutEngine.layoutTree(dummyRootId);

    log.trace(`Tree ${rootId} layout complete: ${treeLayout.nodes.length} nodes positioned`);

    treeLayouts.set(rootId, treeLayout);
  }

  if (coreWithCoordinates.nodes.length === 0 && treeLayouts.size === 1) {
    const allTreeNodes: Node[] = [];
    const allTreeEdges: Edge[] = [];

    for (const [rootId, treeLayout] of treeLayouts) {
      const treeNodes = treeLayout.nodes
        .filter((node) => {
          if (node.width === undefined || node.height === undefined) {
            log.trace(`Filtering out subgraph container: ${node.id}`);
            return false;
          }
          if (node.id === `${rootId}_copy`) {
            return true;
          }
          if (node.id.includes('_copy')) {
            return false;
          }
          if (node.id === rootId) {
            const hasCopyVersion = treeLayout.nodes.some((n) => n.id === `${rootId}_copy`);
            if (hasCopyVersion) {
              return false;
            }
            return true;
          }
          return true;
        })
        .map((node) => ({
          ...node,
          id: node.id === `${rootId}_copy` ? rootId : node.id,
          label: node.id === `${rootId}_copy` ? rootId : node.id,
          x: node.x,
          y: node.y,
          isGroup: Boolean(node.isGroup),
        }));

      const treeEdges = treeLayout.edges.map((edge) => ({
        ...edge,
        id: edge.id,
        start: edge.start === `${rootId}_copy` ? rootId : edge.start,
        end: edge.end === `${rootId}_copy` ? rootId : edge.end,
        type: 'edge' as const,
        points: edge.points,
      }));

      allTreeNodes.push(...treeNodes);
      allTreeEdges.push(...treeEdges);
    }

    return {
      nodes: allTreeNodes,
      edges: [],
      config: coreWithCoordinates.config,
    };
  }

  if (coreWithCoordinates.nodes.length === 0 && treeLayouts.size > 1) {
    const allTreeNodes: Node[] = [];
    const _allTreeEdges: Edge[] = [];
    const treePadding = DEFAULT_TREE_PADDING;
    let currentOffset = 0;

    for (const [rootId, treeLayout] of treeLayouts) {
      const treeBounds = calculateTreeBounds(treeLayout.nodes);
      const treeWidth = treeBounds.maxX - treeBounds.minX;

      const offsetAdjustment = currentOffset - treeBounds.minX;

      const treeNodes = treeLayout.nodes
        .filter((node) => {
          if (node.id === `${rootId}_copy`) {
            return true;
          }
          if (node.id.includes('_copy')) {
            return false;
          }
          if (node.id === rootId) {
            const hasCopyVersion = treeLayout.nodes.some((n) => n.id === `${rootId}_copy`);
            if (hasCopyVersion) {
              return false;
            }
            return true;
          }
          return true;
        })
        .map((node) => ({
          ...node,
          id: node.id === `${rootId}_copy` ? rootId : node.id,
          label: node.id === `${rootId}_copy` ? rootId : node.id,
          x: node.x + offsetAdjustment,
          y: node.y,
          isGroup: node.isGroup || false,
        })) as unknown as Node[];

      allTreeNodes.push(...treeNodes);

      currentOffset += treeWidth + treePadding;
    }

    return {
      nodes: allTreeNodes,
      edges: [],
      config: coreWithCoordinates.config,
    };
  }

  // Step 3b: Planarize core to identify faces for tree placement
  if (coreWithCoordinates.nodes.length > 0) {
    const planarizer = new CorePlanarizer(coreWithCoordinates);
    const planarizedCore = planarizer.planarizeCore();

    // Step 3c: Place trees into faces if we have trees to place
    if (treeLayouts.size > 0) {
      const treePlacer = new TreePlacer(planarizedCore, treeLayouts, uniformEdgeLength);
      treePlacer.placeTreesInFaces();

      // Step 3d: Post-Placement Stress Minimization
      performGlobalStressMinimization(planarizedCore);

      return convertPlanarizedToLayoutData(planarizedCore, coreWithCoordinates.config);
    }
  }

  return coreWithCoordinates;
}

/**
 * Calculate bounding box of a tree's nodes
 * @param nodes - Nodes in the tree (TreeNode type with x, y but may not have width/height)
 * @returns Bounding box with minX, maxX, minY, maxY
 */
function calculateTreeBounds(nodes: { x: number; y: number; width?: number; height?: number }[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (typeof node.x === 'number' && typeof node.y === 'number') {
      const halfWidth = (node.width || 10) / 2;
      const halfHeight = (node.height || 10) / 2;

      minX = Math.min(minX, node.x - halfWidth);
      maxX = Math.max(maxX, node.x + halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxY = Math.max(maxY, node.y + halfHeight);
    }
  }

  if (!isFinite(minX)) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return { minX, maxX, minY, maxY };
}
