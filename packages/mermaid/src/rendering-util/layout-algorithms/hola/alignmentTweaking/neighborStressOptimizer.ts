import type { Node, Edge } from '../../../types.js';
import type { NodeWithPosition } from '../coreLayout/types.js';
import { computeNodeDistance } from '../coreLayout/stressMinimizationUtils.js';
import { calculateBaseEdgeLength } from '../coreLayout/graphUtils.js';
import { log } from '../../../../logger.js';

interface Position {
  x: number;
  y: number;
}

export class NeighborStressOptimizer {
  private nodes: Map<string, NodeWithPosition>;
  private edges: Edge[];
  private adjacencyMap!: Map<string, Set<string>>;
  private uniformEdgeLength: number;

  /**
   * Initialize the neighbor stress optimizer with nodes and edges.
   * @param nodes - Array of nodes to optimize spacing for
   * @param edges - Array of edges defining connections between nodes
   * @param uniformEdgeLength - Optional uniform edge length; calculated automatically if not provided
   */
  constructor(nodes: Node[], edges: Edge[], uniformEdgeLength?: number) {
    this.nodes = new Map();
    nodes.forEach((node) => {
      this.nodes.set(node.id, {
        ...node,
        x: node.x ?? 0,
        y: node.y ?? 0,
      });
    });

    this.edges = edges;

    this.uniformEdgeLength = uniformEdgeLength ?? calculateBaseEdgeLength(nodes, edges);

    this.buildAdjacencyMap();
  }

  /**
   * Get the uniform edge length value used for stress calculations.
   * This follows the same pattern as StressMinimizer.getUniformEdgeLength().
   * @returns The uniform edge length for target distance calculations
   */
  private getUniformEdgeLength(): number {
    return this.uniformEdgeLength;
  }

  /**
   * Build adjacency map to quickly identify neighbors (directly connected nodes).
   * Creates bidirectional connections for each edge in the graph.
   */
  private buildAdjacencyMap(): void {
    this.adjacencyMap = new Map();

    this.nodes.forEach((_, nodeId) => {
      this.adjacencyMap.set(nodeId, new Set());
    });

    this.edges.forEach((edge) => {
      if (edge.start && edge.end) {
        this.adjacencyMap.get(edge.start)?.add(edge.end);
        this.adjacencyMap.get(edge.end)?.add(edge.start);
      }
    });
  }

  /**
   * Compute neighbor stress - only considers directly connected node pairs.
   * This is the key difference from global stress: we ignore long-range pairs.
   *
   * HOLA Theory: Uses boundary-to-boundary distance like the core StressMinimizer.
   * @returns Total neighbor stress value for the current node configuration
   */
  private computeNeighborStress(): number {
    let stress = 0;

    this.nodes.forEach((node, nodeId) => {
      const neighbors = this.adjacencyMap.get(nodeId);
      if (!neighbors) {
        return;
      }

      neighbors.forEach((neighborId) => {
        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) {
          return;
        }

        const euclideanDist = computeNodeDistance(node, neighbor);

        const targetDist = this.getUniformEdgeLength();

        const graphDist = 1;
        const weight = 1.0 / (graphDist * graphDist);

        stress += weight * Math.pow(euclideanDist - targetDist, 2);
      });
    });

    return stress / 2;
  }

  /**
   * Compute gradient for a single node based on neighbor stress only.
   * Only considers forces from directly connected neighbors.
   *
   * HOLA Theory: Uses center-to-center for direction, boundary-to-boundary for force magnitude.
   * This matches the implementation in StressMinimizer's computeGradient.
   * @param nodeId - ID of the node to compute gradient for
   * @returns Position object containing the gradient vector (x, y) for the specified node
   */
  private computeNeighborGradient(nodeId: string): Position {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { x: 0, y: 0 };
    }

    let gradX = 0;
    let gradY = 0;

    const neighbors = this.adjacencyMap.get(nodeId);
    if (!neighbors) {
      return { x: 0, y: 0 };
    }

    neighbors.forEach((neighborId) => {
      const neighbor = this.nodes.get(neighborId);
      if (!neighbor) {
        return;
      }

      const dx = node.x - neighbor.x;
      const dy = node.y - neighbor.y;
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      if (centerDist < 1e-6) {
        return;
      }

      gradX += 3 * dx;
      gradY += 3 * dy;
    });

    return { x: gradX, y: gradY };
  }

  /**
   * Run neighbor stress minimization to evenly distribute connected nodes.
   * Uses gradient descent with only neighbor-based forces.
   * @param maxIterations - Maximum number of iterations to perform (default: 50)
   * @param tolerance - Convergence threshold for stress change (default: 1e-4)
   * @returns Updated nodes with even spacing between neighbors
   */
  optimize(maxIterations = 50, tolerance = 1e-4): Node[] {
    let prevStress = this.computeNeighborStress();

    const learningRate = 0.0000001;

    for (let iter = 0; iter < maxIterations; iter++) {
      const updates = new Map<string, Position>();

      this.nodes.forEach((node, nodeId) => {
        const gradient = this.computeNeighborGradient(nodeId);
        updates.set(nodeId, gradient);
      });

      this.nodes.forEach((node, nodeId) => {
        const gradient = updates.get(nodeId);
        if (gradient) {
          node.x -= learningRate * gradient.x;
          node.y -= learningRate * gradient.y;
        }
      });

      if ((iter + 1) % 5 === 0) {
        const currentStress = this.computeNeighborStress();
        const stressChange = Math.abs(prevStress - currentStress);

        log.trace(
          `  Iteration ${iter + 1}: stress = ${currentStress.toFixed(2)}, change = ${stressChange.toFixed(4)}`
        );

        if (stressChange < tolerance) {
          log.trace(`Converged after ${iter + 1} iterations`);
          break;
        }

        prevStress = currentStress;
      }
    }

    const finalStress = this.computeNeighborStress();
    log.trace(`  Final neighbor stress: ${finalStress.toFixed(2)}`);

    return [...this.nodes.values()].map((node) => ({
      ...node,
      x: Math.round(node.x),
      y: Math.round(node.y),
    })) as Node[];
  }

  /**
   * Get statistics about neighbor distances for debugging.
   * HOLA Theory: Uses boundary-to-boundary distance like stress computation.
   * @returns Object containing min, max, average, and standard deviation of neighbor distances
   */
  getNeighborDistanceStats(): {
    min: number;
    max: number;
    avg: number;
    stdDev: number;
  } {
    const distances: number[] = [];

    this.nodes.forEach((node, nodeId) => {
      const neighbors = this.adjacencyMap.get(nodeId);
      if (!neighbors) {
        return;
      }

      neighbors.forEach((neighborId) => {
        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) {
          return;
        }

        const dist = computeNodeDistance(node, neighbor);
        distances.push(dist);
      });
    });

    if (distances.length === 0) {
      return { min: 0, max: 0, avg: 0, stdDev: 0 };
    }

    const min = Math.min(...distances);
    const max = Math.max(...distances);
    const avg = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    return { min, max, avg, stdDev };
  }
}
