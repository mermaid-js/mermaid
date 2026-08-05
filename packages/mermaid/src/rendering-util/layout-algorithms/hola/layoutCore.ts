import { log } from '../../../logger.js';
import type { Edge, LayoutData } from '../../types.js';
import { resolveGroupOverlapsWithAlignment } from './overlapUtils.js';
import { topologicalDecomposition } from './topologicalDecomposition.js';
import { layoutCoreGraph } from './coreGraphLayout.js';
import { layoutAndPlaceTrees } from './treeLayoutAndPlacement.js';
import { tweakAlignment } from './alignmentTweaking/index.js';
import { checkAllChildrenInGroup, layoutGroups } from './applyHola.js';
import { removeCycleEdges, restoreCycleEdges } from './cycleUtils.js';
import routing from './orthogonal-routing/index.js';
import {
  connectOrphanNodesInSubgraphs,
  cleanupOrphanConnections,
} from './subgraphOrphanHandler.js';
import {
  dragIntoSubgraphs,
  assignCoordinatesToOriginalNodes,
  compressDisconnectedComponents,
  detectAndResolveOverlaps,
  getTrueSubgraphs,
  reRender,
  sortGroupNodesToEnd,
  sortTrees,
  sortTrueSubgraphsBottomUp,
} from './reRenderUtil.js';
import { calculateBaseEdgeLength } from './coreLayout/graphUtils.js';
import { calculateGroupBounds } from './utils.js';

const GROUP_PADDING = 15;
const GROUP_OVERLAP_MARGIN = 20;

type LogStep = (stepName: string) => void;

function createStepLogger(): LogStep {
  const startTime = performance.now();
  let lastTime = startTime;

  return (stepName: string) => {
    const currentTime = performance.now();
    const stepDuration = currentTime - lastTime;
    const totalDuration = currentTime - startTime;
    log.info(
      `HOLA Performance - ${stepName}: ${stepDuration.toFixed(2)}ms (${(stepDuration / 1000).toFixed(3)}s) | Total: ${totalDuration.toFixed(2)}ms (${(totalDuration / 1000).toFixed(3)}s)`
    );
    lastTime = currentTime;
  };
}

/**
 * Lay each true subgraph out on its own first, then size its frame around the
 * result, so the outer pass sees groups with real dimensions.
 */
function layoutTrueSubgraphs(data4Layout: LayoutData, uniformEdgeLength: number, logStep: LogStep) {
  if (getTrueSubgraphs(data4Layout).length === 0) {
    return;
  }

  for (const subgraph of sortTrueSubgraphsBottomUp(data4Layout)) {
    const allChildren = data4Layout.nodes.filter((node) => node.parentId === subgraph.id);
    const allChildrenIds = new Set(allChildren.map((node) => node.id));
    const allChildrenEdges = data4Layout.edges.filter(
      (edge) =>
        edge.start && edge.end && allChildrenIds.has(edge.start) && allChildrenIds.has(edge.end)
    );
    const currentLayoutData = {
      ...data4Layout,
      nodes: [...allChildren, subgraph],
      edges: allChildrenEdges,
    };
    reRender(currentLayoutData, uniformEdgeLength);
    currentLayoutData.edges = routing(currentLayoutData, logStep);

    const currentNodeMap = new Map(currentLayoutData.nodes.map((node) => [node.id, node]));
    for (const node of data4Layout.nodes) {
      const originalNode = currentNodeMap.get(node.id);
      if (originalNode && (!node.width || !node.height) && node.isGroup) {
        const bounds = calculateGroupBounds(
          originalNode,
          currentLayoutData,
          currentNodeMap,
          GROUP_PADDING
        );
        node.width = bounds.maxX - bounds.minX + GROUP_PADDING * 2;
        node.height = bounds.maxY - bounds.minY + GROUP_PADDING * 2;
      }
    }
  }
}

function finalizeGroupLayoutAndOverlaps(data4Layout: LayoutData, logStep: LogStep) {
  cleanupOrphanConnections(data4Layout);
  dragIntoSubgraphs(data4Layout);

  logStep('Cleanup & Drag Into Subgraphs');

  compressDisconnectedComponents(data4Layout);
  checkAllChildrenInGroup(data4Layout);

  logStep('Component Compression & Group Check');

  const nodeMap = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  layoutGroups(data4Layout, GROUP_PADDING, nodeMap);
  resolveGroupOverlapsWithAlignment(data4Layout, GROUP_OVERLAP_MARGIN, nodeMap);
  checkAllChildrenInGroup(data4Layout);

  logStep('Initial Group Layout & Overlap Resolution');

  data4Layout.nodes = sortGroupNodesToEnd(data4Layout.nodes);
  logStep('Before Routing');
  data4Layout.edges = routing(data4Layout, logStep);

  logStep('Final Routing');

  layoutGroups(data4Layout, GROUP_PADDING, nodeMap);
  resolveGroupOverlapsWithAlignment(data4Layout, GROUP_OVERLAP_MARGIN, nodeMap);

  logStep('Final Group Layout & Overlap Resolution');
}

/**
 * The HOLA algorithm: human-like orthogonal layout.
 *
 * DOM-free by contract — it reads the sizes measured earlier and writes
 * `node.x/y`, group frames and `edge.points`. Both the browser render and the
 * DDLT tests call this same function, so a fix in one is a fix in the other.
 */
export function runHolaLayoutCore(data4Layout: LayoutData): void {
  log.trace('=== HOLA ALGORITHM START ===');

  const startTime = performance.now();
  const logStep = createStepLogger();

  const removeCycles = data4Layout.config?.hola?.removeCycles ?? true;
  const uniformEdgeLength = calculateBaseEdgeLength(data4Layout.nodes, data4Layout.edges);

  logStep('Edge Length Calculation');

  layoutTrueSubgraphs(data4Layout, uniformEdgeLength, logStep);

  logStep('Subgraph Processing Complete');

  connectOrphanNodesInSubgraphs(data4Layout);

  logStep('Orphan Nodes Connected');

  let cycleEdges: Edge[] = [];
  if (removeCycles) {
    cycleEdges = removeCycleEdges(data4Layout);
  }

  const { core, trees: unsortedTrees } = topologicalDecomposition(data4Layout);

  logStep('Topological Decomposition Complete');

  const trees = sortTrees(unsortedTrees, data4Layout);

  logStep('Tree & Core Sorting Complete');

  const coreWithCoordinates = layoutCoreGraph(core, uniformEdgeLength);

  logStep('Core Graph Layout Complete');

  const layoutAfterTrees = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

  logStep('Tree Layout & Placement Complete');

  const finalLayout = tweakAlignment(layoutAfterTrees);

  logStep('Alignment Tweaking Complete');

  detectAndResolveOverlaps(finalLayout);

  logStep('Overlap Detection & Resolution Complete');

  assignCoordinatesToOriginalNodes(data4Layout, finalLayout);

  logStep('Coordinate Assignment Complete');

  if (removeCycles) {
    restoreCycleEdges(data4Layout, cycleEdges);
  }

  finalizeGroupLayoutAndOverlaps(data4Layout, logStep);

  const totalTime = performance.now() - startTime;
  log.info(
    `HOLA ALGORITHM COMPLETED: Total time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(3)}s)`
  );
}
