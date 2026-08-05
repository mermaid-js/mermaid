/* eslint-disable @cspell/spellchecker */
import { log } from '../../../../logger.js';
import type { Edge, Node } from '../../../types.js';
import {
  STRESS_MINIMIZATION_CONVERGENCE_THRESHOLD,
  STRESS_MINIMIZATION_DAMPING_FACTOR,
  STRESS_MINIMIZATION_FACTOR,
} from '../Constants.js';
import { calculateBaseEdgeLength } from '../coreLayout/graphUtils.js';
import type { PlanarizedCore, PlanarEdge } from './types.js';

/**
 * Step 3d: Post-Placement Stress Minimization
 * Performs global stress-minimization adjustment after all trees are attached.
 * Uses gradient descent to optimize node positions within established constraints.
 *
 * This function applies force-based stress minimization to improve the overall
 * layout quality by reducing edge length variance and visual tension.
 *
 * @param planarizedCore - The planarized core graph containing nodes and edges
 */
export function performGlobalStressMinimization(planarizedCore: PlanarizedCore): void {
  const allNodes = [...planarizedCore.nodes.values()].filter((n) => !('type' in n)) as Node[];
  const allEdges = planarizedCore.edges;

  if (allNodes.length < 2 || allEdges.length === 0) {
    log.trace('Insufficient nodes or edges for stress minimization');
    return;
  }

  const initialStress = calculateCombinedGraphStress(allNodes, allEdges);
  log.trace(`Initial combined graph stress: ${initialStress.toFixed(2)}`);

  const maxIterations = 30;
  const dampingFactor = STRESS_MINIMIZATION_DAMPING_FACTOR;
  const convergenceThreshold = STRESS_MINIMIZATION_CONVERGENCE_THRESHOLD;
  // const idealEdgeLength = calculateUniformEdgeLength(allNodes); // Standard HOLA edge length

  const edges: Edge[] = planarizedCore.edges
    .filter(
      (edge) =>
        !edge.start.startsWith('bend_') &&
        !edge.start.startsWith('cross_') &&
        !edge.end.startsWith('bend_') &&
        !edge.end.startsWith('cross_')
    )
    .map((edge) => ({
      ...edge,
      id: edge.id,
      start: edge.start,
      end: edge.end,
      type: 'edge',
      points: edge.points,
    }));
  const idealEdgeLength = calculateBaseEdgeLength(allNodes, edges);

  let previousStress = initialStress;
  let iteration = 0;

  const constraintInfo = categorizeNodesForConstraints(planarizedCore);

  while (iteration < maxIterations) {
    const forces = new Map<string, { x: number; y: number }>();

    allNodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    allEdges.forEach((edge) => {
      const node1 = allNodes.find((n) => n.id === edge.start);
      const node2 = allNodes.find((n) => n.id === edge.end);

      if (
        !node1 ||
        !node2 ||
        node1.x === undefined ||
        node1.y === undefined ||
        node2.x === undefined ||
        node2.y === undefined
      ) {
        return;
      }

      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);

      if (currentLength === 0) {
        return;
      }

      const lengthDifference = currentLength - idealEdgeLength;
      const forceStrength = lengthDifference * STRESS_MINIMIZATION_FACTOR;

      const unitX = dx / currentLength;
      const unitY = dy / currentLength;

      const forceX = forceStrength * unitX;
      const forceY = forceStrength * unitY;

      const force1 = forces.get(node1.id)!;
      const force2 = forces.get(node2.id)!;

      force1.x += forceX;
      force1.y += forceY;
      force2.x -= forceX;
      force2.y -= forceY;
    });

    let totalDisplacement = 0;

    allNodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) {
        return;
      }

      const force = forces.get(node.id)!;
      const constraints = constraintInfo.get(node.id);

      if (!constraints) {
        return;
      }

      let displacementX = force.x * dampingFactor;
      let displacementY = force.y * dampingFactor;

      if (constraints.preservePosition) {
        displacementX *= STRESS_MINIMIZATION_FACTOR;
        displacementY *= STRESS_MINIMIZATION_FACTOR;
      }

      if (constraints.maintainOrthogonalAlignment) {
        if (constraints.constrainHorizontal) {
          displacementX *= STRESS_MINIMIZATION_FACTOR;
        }
        if (constraints.constrainVertical) {
          displacementY *= STRESS_MINIMIZATION_FACTOR;
        }
      }

      node.x += displacementX;
      node.y += displacementY;

      totalDisplacement += Math.sqrt(displacementX * displacementX + displacementY * displacementY);
    });

    const currentStress = calculateCombinedGraphStress(allNodes, allEdges);
    const stressImprovement = previousStress - currentStress;
    const improvementRatio = Math.abs(stressImprovement) / initialStress;

    if (improvementRatio < convergenceThreshold || totalDisplacement < 0.5) {
      break;
    }

    if (stressImprovement < 0 && Math.abs(stressImprovement) > initialStress * 0.05) {
      break;
    }

    previousStress = currentStress;
    iteration++;
  }

  const finalStress = calculateCombinedGraphStress(allNodes, allEdges);
  const totalImprovement = ((initialStress - finalStress) / initialStress) * 100;
  log.trace(
    `Global stress minimization completed: ${totalImprovement.toFixed(1)}% improvement (${initialStress.toFixed(2)} → ${finalStress.toFixed(2)})`
  );
}

/**
 * Calculate stress for the combined graph (core + trees)
 * Used in Step 3d global stress minimization.
 *
 * Stress is calculated as the sum of squared differences between actual
 * and ideal edge lengths across all edges in the graph.
 *
 * @param nodes - Array of nodes in the combined graph
 * @param edges - Array of planar edges connecting the nodes
 * @returns Total stress value (lower is better layout quality)
 */
export function calculateCombinedGraphStress(nodes: Node[], edges: PlanarEdge[]): number {
  if (!edges || edges.length === 0) {
    return 0;
  }

  const filteredEdges: Edge[] = edges
    .filter(
      (edge) =>
        !edge.start.startsWith('bend_') &&
        !edge.start.startsWith('cross_') &&
        !edge.end.startsWith('bend_') &&
        !edge.end.startsWith('cross_')
    )
    .map((edge) => ({
      ...edge,
      id: edge.id,
      start: edge.start,
      end: edge.end,
      type: 'edge',
      points: edge.points,
    }));
  let totalStress = 0;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  edges.forEach((edge) => {
    const node1 = nodeMap.get(edge.start);
    const node2 = nodeMap.get(edge.end);

    if (
      node1 &&
      node2 &&
      node1.x !== undefined &&
      node1.y !== undefined &&
      node2.x !== undefined &&
      node2.y !== undefined
    ) {
      const dx = node1.x - node2.x;
      const dy = node1.y - node2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      //const idealLength = calculateUniformEdgeLength(nodes);
      const idealLength = calculateBaseEdgeLength(nodes, filteredEdges);

      const stress = (distance - idealLength) * (distance - idealLength);
      totalStress += stress;
    }
  });

  return totalStress;
}

/**
 * Categorize nodes for constraint preservation in Step 3d
 * Identifies which nodes need position/alignment constraints maintained.
 *
 * This function analyzes node types and relationships to determine
 * appropriate movement constraints during stress minimization.
 * Core nodes and tree roots typically have stronger position constraints
 * to preserve the overall structural integrity of the layout.
 *
 * @param planarizedCore - The planarized core graph structure
 * @returns Map of node IDs to their constraint configuration objects
 */
export function categorizeNodesForConstraints(planarizedCore: PlanarizedCore): Map<
  string,
  {
    preservePosition: boolean;
    maintainOrthogonalAlignment: boolean;
    constrainHorizontal: boolean;
    constrainVertical: boolean;
  }
> {
  const constraints = new Map<
    string,
    {
      preservePosition: boolean;
      maintainOrthogonalAlignment: boolean;
      constrainHorizontal: boolean;
      constrainVertical: boolean;
    }
  >();

  [...planarizedCore.nodes.values()].forEach((node) => {
    if ('type' in node) {
      return;
    }

    const nodeId = node.id;

    const isCoreNode = !nodeId.includes('_') && !nodeId.includes('-');
    const isTreeRoot = nodeId.includes('_copy');

    constraints.set(nodeId, {
      preservePosition: isCoreNode || isTreeRoot,
      maintainOrthogonalAlignment: true,
      constrainHorizontal: false,
      constrainVertical: false,
    });
  });

  return constraints;
}
