import { GRADIENT_FACTOR } from '../Constants.js';
import type { NodeWithPosition, Position } from './types.js';

/**
 * Computes the boundary-to-boundary distance between two rectangular nodes.
 * Returns the Euclidean distance between node boundaries, considering dimensions.
 * @param node1 - First node with position and dimensions
 * @param node2 - Second node with position and dimensions
 * @returns The Euclidean distance between the boundaries of the two nodes
 */
export function computeNodeDistance(node1: NodeWithPosition, node2: NodeWithPosition): number {
  const width1 = node1.width ?? 0;
  const height1 = node1.height ?? 0;
  const width2 = node2.width ?? 0;
  const height2 = node2.height ?? 0;

  // Calculate rectangle boundaries (assuming x, y are center coordinates)
  const left1 = node1.x - width1 / 2;
  const right1 = node1.x + width1 / 2;
  const top1 = node1.y - height1 / 2;
  const bottom1 = node1.y + height1 / 2;

  const left2 = node2.x - width2 / 2;
  const right2 = node2.x + width2 / 2;
  const top2 = node2.y - height2 / 2;
  const bottom2 = node2.y + height2 / 2;

  let dx = 0;
  if (right1 < left2) {
    dx = left2 - right1;
  } else if (right2 < left1) {
    dx = left1 - right2;
  }

  let dy = 0;
  if (bottom1 < top2) {
    dy = top2 - bottom1;
  } else if (bottom2 < top1) {
    dy = top1 - bottom2;
  }

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute stress based on distance between nodes and graph distances.
 * HOLA Theory: "treat edges as springs with equal ideal lengths"
 * @param nodes - Map of node IDs to their positions and properties
 * @param getGraphDistance - Function to get shortest path distance between two nodes
 * @param uniformEdgeLength - The uniform length to use for all edges in stress calculation
 * @returns The total stress value for the current node layout
 */
export function computeStress(
  nodes: Map<string, NodeWithPosition>,
  getGraphDistance: (id1: string, id2: string) => number,
  uniformEdgeLength: number
): number {
  let stress = 0;
  const nodeIds = [...nodes.keys()];

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const id1 = nodeIds[i];
      const id2 = nodeIds[j];
      const node1 = nodes.get(id1)!;
      const node2 = nodes.get(id2)!;

      const euclideanDist = computeNodeDistance(node1, node2);
      const graphDist = getGraphDistance(id1, id2);

      if (graphDist !== Infinity) {
        const targetDist = uniformEdgeLength * graphDist;

        const weight = 1.0 / (graphDist * graphDist);

        stress += weight * Math.pow(euclideanDist - targetDist, 2);
      }
    }
  }

  return stress;
}

/**
 * Compute gradient for a single node in the stress function.
 * HOLA Theory: Use uniform edge length for all connected pairs with equal weighting.
 * @param nodeId - ID of the node to compute gradient for
 * @param nodes - Map of all node IDs to their positions and properties
 * @param getGraphDistance - Function to get shortest path distance between two nodes
 * @param uniformEdgeLength - The uniform length to use for all edges in gradient calculation
 * @returns Position object containing the gradient vector (x, y) for the specified node
 */
export function computeGradient(
  nodeId: string,
  nodes: Map<string, NodeWithPosition>,
  getGraphDistance: (id1: string, id2: string) => number,
  uniformEdgeLength: number
): Position {
  const node = nodes.get(nodeId)!;
  let gradX = 0;
  let gradY = 0;

  nodes.forEach((otherNode, otherId) => {
    if (otherId === nodeId) {
      return;
    }

    const dx = node.x - otherNode.x;
    const dy = node.y - otherNode.y;
    const centerDist = Math.sqrt(dx * dx + dy * dy);

    if (centerDist < 1e-6) {
      return;
    }

    const euclideanDist = computeNodeDistance(node, otherNode);

    const graphDist = getGraphDistance(nodeId, otherId);
    if (graphDist === Infinity) {
      return;
    }

    const targetDist = uniformEdgeLength * graphDist;

    const weight = 1.0 / (graphDist * graphDist);

    const factor = (GRADIENT_FACTOR * weight * (euclideanDist - targetDist)) / centerDist;

    gradX += factor * dx;
    gradY += factor * dy;
  });

  return { x: gradX, y: gradY };
}

/**
 * Perform gradient descent to minimize stress.
 * @param nodes - Map of node IDs to their positions and properties
 * @param getGraphDistance - Function to get shortest path distance between two nodes
 * @param uniformEdgeLength - The uniform length to use for all edges in stress minimization
 * @param maxIterations - Maximum number of iterations to perform
 * @param learningRate - Learning rate for gradient descent updates
 * @param tolerance - Convergence tolerance - stops when stress change is below this value
 * @returns True if converged within tolerance, false if max iterations reached
 */
export function performStressMinimization(
  nodes: Map<string, NodeWithPosition>,
  getGraphDistance: (id1: string, id2: string) => number,
  uniformEdgeLength: number,
  maxIterations: number,
  learningRate: number,
  tolerance: number
): boolean {
  let prevStress = computeStress(nodes, getGraphDistance, uniformEdgeLength);

  for (let iter = 0; iter < maxIterations; iter++) {
    const updates = new Map<string, Position>();

    nodes.forEach((node, nodeId) => {
      const gradient = computeGradient(nodeId, nodes, getGraphDistance, uniformEdgeLength);
      updates.set(nodeId, {
        x: node.x - learningRate * gradient.x,
        y: node.y - learningRate * gradient.y,
      });
    });

    updates.forEach((newPos, nodeId) => {
      const node = nodes.get(nodeId)!;
      node.x = newPos.x;
      node.y = newPos.y;
    });

    const currentStress = computeStress(nodes, getGraphDistance, uniformEdgeLength);
    if (Math.abs(currentStress - prevStress) < tolerance) {
      return true;
    }
    prevStress = currentStress;
  }

  return false;
}
