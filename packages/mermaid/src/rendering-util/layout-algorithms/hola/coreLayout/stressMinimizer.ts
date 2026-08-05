/* eslint-disable @cspell/spellchecker */
import { log } from '../../../../logger.js';
import type { LayoutData, Node, Edge } from '../../../types.js';
import type { NodeWithPosition } from './types.js';
import { performStressMinimization } from './stressMinimizationUtils.js';
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_PADDING,
  STRESS_MINIMIZER_LEARNING_RATE,
} from '../Constants.js';

export class StressMinimizer {
  private nodes = new Map<string, NodeWithPosition>();
  private edges: Edge[] = [];
  private distances = new Map<string, Map<string, number>>();
  private uniformEdgeLength: number;

  /**
   * Initializes the stress minimizer with layout data and uniform edge length
   * @param layoutData - The layout data containing nodes and edges
   * @param uniformEdgeLength - The uniform length to use for all edges in stress minimization
   */
  constructor(layoutData: LayoutData, uniformEdgeLength: number) {
    this.uniformEdgeLength = uniformEdgeLength;
    this.edges = layoutData.edges;
    this.initializeNodes(layoutData.nodes);
    this.computeAllPairsShortestPaths();
  }

  /**
   * Initializes nodes using BFS-layered placement seeded from the highest-degree node.
   * Each BFS layer is placed on a ring at radius = layer * uniformEdgeLength, with nodes
   * evenly distributed around the ring. This gives connected nodes nearby starting positions
   * so stress minimization converges faster and produces fewer crossings — especially for
   * high-degree hub nodes whose neighbors are naturally placed on the ring around them.
   */
  private initializeNodes(nodes: Node[]): void {
    const nodeCount = nodes.length;
    if (nodeCount === 0) {
      return;
    }

    const edgeLength = this.getUniformEdgeLength();

    // Deterministic seeded PRNG (LCG) for reproducible jitter
    const LCG_A = 1664525;
    const LCG_C = 1013904223;
    const LCG_M = 2 ** 8;
    let seed = 0xdeadbeef;
    const lcgNext = (): number => {
      seed = (LCG_A * seed + LCG_C) % LCG_M;
      return seed / LCG_M;
    };

    let maxPadding = DEFAULT_PADDING;
    let maxNodeWidth = DEFAULT_NODE_WIDTH;
    let maxNodeHeight = DEFAULT_NODE_HEIGHT;
    for (const node of nodes) {
      if (node.isGroup) {
        continue;
      }
      maxNodeWidth = Math.max(maxNodeWidth, node.width ?? DEFAULT_NODE_WIDTH);
      maxNodeHeight = Math.max(maxNodeHeight, node.height ?? DEFAULT_NODE_HEIGHT);
      maxPadding = Math.max(maxPadding, node.padding ?? DEFAULT_PADDING);
    }
    const minSpacing = Math.max(
      maxNodeWidth + maxPadding * 2,
      maxNodeHeight + maxPadding * 2,
      edgeLength
    );
    const jitter = minSpacing * 0.15;

    log.debug(
      `[HOLA] initializeNodes | nodeCount=${nodeCount} edgeLength=${edgeLength.toFixed(1)} minSpacing=${minSpacing.toFixed(1)} jitter=${jitter.toFixed(1)}`
    );

    // Build adjacency list from edges for BFS
    const adj = new Map<string, string[]>();
    for (const node of nodes) {
      adj.set(node.id, []);
    }
    for (const edge of this.edges) {
      if (edge.start && edge.end) {
        adj.get(edge.start)?.push(edge.end);
        adj.get(edge.end)?.push(edge.start);
      }
    }

    // Pick seed: highest-degree node (most connections)
    let seedId = nodes[0].id;
    let maxDeg = 0;
    for (const node of nodes) {
      const deg = adj.get(node.id)?.length ?? 0;
      if (deg > maxDeg) {
        maxDeg = deg;
        seedId = node.id;
      }
    }

    log.debug(`[HOLA] initializeNodes | seed=${seedId} deg=${maxDeg}`);

    // BFS to assign each node a layer
    const layer = new Map<string, number>();
    const layerMembers = new Map<number, string[]>();
    const queue: string[] = [seedId];
    layer.set(seedId, 0);
    layerMembers.set(0, [seedId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLayer = layer.get(current)!;
      for (const neighbor of adj.get(current) ?? []) {
        if (!layer.has(neighbor)) {
          const nextLayer = currentLayer + 1;
          layer.set(neighbor, nextLayer);
          if (!layerMembers.has(nextLayer)) {
            layerMembers.set(nextLayer, []);
          }
          layerMembers.get(nextLayer)!.push(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Disconnected nodes (unreachable from seed) get their own layer beyond the BFS tree.
    let maxLayer = 0;
    for (const l of layer.values()) {
      if (l > maxLayer) {
        maxLayer = l;
      }
    }
    const disconnected: string[] = [];
    for (const node of nodes) {
      if (!layer.has(node.id)) {
        maxLayer += 1;
        layer.set(node.id, maxLayer);
        layerMembers.set(maxLayer, [node.id]);
        disconnected.push(node.id);
      }
    }
    if (disconnected.length > 0) {
      log.debug(
        `[HOLA] initializeNodes | disconnected nodes (placed beyond BFS tree): [${disconnected.join(', ')}]`
      );
    }

    log.debug(
      `[HOLA] initializeNodes | BFS layers=${maxLayer + 1} layerSizes=[${[...layerMembers.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([l, m]) => `L${l}:${m.length}`)
        .join(', ')}]`
    );

    // Place each layer on a ring at radius = layer * edgeLength
    // Layer 0 (seed) goes at the origin.
    const nodeById = new Map<string, Node>();
    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    for (const [l, members] of layerMembers.entries()) {
      if (l === 0) {
        const node = nodeById.get(members[0])!;
        const x = (lcgNext() - 0.5) * jitter;
        const y = (lcgNext() - 0.5) * jitter;
        this.nodes.set(node.id, { ...node, x, y });
        log.debug(
          `[HOLA] initializeNodes | L0 seed=${node.id} pos=(${x.toFixed(1)},${y.toFixed(1)})`
        );
        continue;
      }

      const count = members.length;
      const bfsRadius = l * edgeLength;
      const minRadiusForSpacing = (count * minSpacing) / (2 * Math.PI);
      const ringRadius = Math.max(bfsRadius, minRadiusForSpacing);

      log.debug(
        `[HOLA] initializeNodes | L${l} ring radius=${ringRadius.toFixed(1)} (bfs=${bfsRadius.toFixed(1)} minForCount=${minRadiusForSpacing.toFixed(1)}) nodes=${count} [${members.join(', ')}]`
      );

      members.forEach((nodeId, idx) => {
        const angle = (2 * Math.PI * idx) / count;
        let x = ringRadius * Math.cos(angle);
        let y = ringRadius * Math.sin(angle);

        x += (lcgNext() - 0.5) * jitter;
        y += (lcgNext() - 0.5) * jitter;

        const node = nodeById.get(nodeId)!;
        this.nodes.set(nodeId, { ...node, x, y });
        log.debug(
          `[HOLA] initializeNodes |   ${nodeId} angle=${((angle * 180) / Math.PI).toFixed(1)}° pos=(${x.toFixed(1)},${y.toFixed(1)})`
        );
      });
    }
  }

  /**
   * Computes shortest paths between all pairs of nodes using Floyd-Warshall algorithm
   * This is used to determine graph-theoretic distances for stress minimization
   */
  private computeAllPairsShortestPaths(): void {
    const nodeIds = [...this.nodes.keys()];
    const n = nodeIds.length;
    const dist: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(Infinity));
    const nodeIndex = new Map<string, number>();

    nodeIds.forEach((id, i) => {
      nodeIndex.set(id, i);
      dist[i][i] = 0;
    });

    this.edges.forEach((edge) => {
      if (edge.start && edge.end) {
        const i = nodeIndex.get(edge.start)!;
        const j = nodeIndex.get(edge.end)!;
        dist[i][j] = 1;
        dist[j][i] = 1;
      }
    });

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }

    nodeIds.forEach((id, i) => {
      const distMap = new Map<string, number>();
      nodeIds.forEach((otherId, j) => {
        distMap.set(otherId, dist[i][j]);
      });
      this.distances.set(id, distMap);
    });
  }

  /**
   * Gets the shortest graph distance between two nodes
   * @param id1 - ID of the first node
   * @param id2 - ID of the second node
   * @returns The shortest path distance between the nodes, or Infinity if not connected
   */
  private getGraphDistance(id1: string, id2: string): number {
    return this.distances.get(id1)?.get(id2) ?? Infinity;
  }

  /**
   * Gets the uniform edge length for stress minimization
   * HOLA Theory Compliance: "treat edges as springs with equal ideal lengths"
   * @returns The uniform edge length value calculated based on max node diagonal to prevent overlaps
   */
  private getUniformEdgeLength(): number {
    return this.uniformEdgeLength;
  }

  /**
   * Performs stress minimization to optimize node positions based on graph distances
   * HOLA Theory Step 2a: First run stress minimization to convergence
   * @param maxIterations - Maximum number of iterations (default: 100, auto-adjusted based on node count)
   * @param tolerance - Convergence tolerance for stopping criteria (default: 1e-3)
   * @returns Map of node IDs to their optimized positions
   */
  minimize(maxIterations = this.nodes.size * 50, tolerance = 1e-6): Map<string, NodeWithPosition> {
    const learningRate = STRESS_MINIMIZER_LEARNING_RATE;

    performStressMinimization(
      this.nodes,
      this.getGraphDistance.bind(this),
      this.uniformEdgeLength,
      maxIterations,
      learningRate,
      tolerance
    );

    return this.nodes;
  }

  /**
   * HOLA Theory: "followed by the application of overlap removal constraints"
   * Iteratively separates overlapping nodes using constraint-based separation.
   */
  removeOverlaps(): Map<string, NodeWithPosition> {
    const padding = 20;
    const maxIterations = 50;

    for (let iter = 0; iter < maxIterations; iter++) {
      let hasOverlap = false;
      const nodeIds = [...this.nodes.keys()];

      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const id1 = nodeIds[i];
          const id2 = nodeIds[j];
          const node1 = this.nodes.get(id1)!;
          const node2 = this.nodes.get(id2)!;

          const overlap = this.calculateOverlap(node1, node2, padding);

          if (overlap.overlapX > 0 || overlap.overlapY > 0) {
            hasOverlap = true;
            this.separateNodes(node1, node2, overlap, padding);
          }
        }
      }

      if (!hasOverlap) {
        break;
      }
    }

    return this.nodes;
  }

  /**
   * Calculate overlap between two nodes including padding
   * @param node1 - First node to check for overlap
   * @param node2 - Second node to check for overlap
   * @param padding - Additional padding to include in overlap calculation
   * @returns Object containing overlap amounts in X and Y dimensions
   */
  private calculateOverlap(
    node1: NodeWithPosition,
    node2: NodeWithPosition,
    padding: number
  ): { overlapX: number; overlapY: number } {
    const width1 = (node1.width ?? 0) + padding;
    const height1 = (node1.height ?? 0) + padding;
    const width2 = (node2.width ?? 0) + padding;
    const height2 = (node2.height ?? 0) + padding;

    const left1 = node1.x - width1 / 2;
    const right1 = node1.x + width1 / 2;
    const top1 = node1.y - height1 / 2;
    const bottom1 = node1.y + height1 / 2;

    const left2 = node2.x - width2 / 2;
    const right2 = node2.x + width2 / 2;
    const top2 = node2.y - height2 / 2;
    const bottom2 = node2.y + height2 / 2;

    const overlapX = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
    const overlapY = Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2));

    return { overlapX, overlapY };
  }

  /**
   * Separate two overlapping nodes by moving them apart along the axis of minimum separation
   * @param node1 - First overlapping node to separate
   * @param node2 - Second overlapping node to separate
   * @param overlap - Object containing overlap amounts in X and Y dimensions
   * @param _padding - Padding value (currently unused but kept for interface consistency)
   */
  private separateNodes(
    node1: NodeWithPosition,
    node2: NodeWithPosition,
    overlap: { overlapX: number; overlapY: number },
    _padding: number
  ): void {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;

    if (overlap.overlapX > 0 && overlap.overlapY > 0) {
      if (overlap.overlapX <= overlap.overlapY) {
        const separation = overlap.overlapX / 2 + 1;
        if (dx >= 0) {
          node1.x -= separation;
          node2.x += separation;
        } else {
          node1.x += separation;
          node2.x -= separation;
        }
      } else {
        const separation = overlap.overlapY / 2 + 1;
        if (dy >= 0) {
          node1.y -= separation;
          node2.y += separation;
        } else {
          node1.y += separation;
          node2.y -= separation;
        }
      }
    }
  }
}
