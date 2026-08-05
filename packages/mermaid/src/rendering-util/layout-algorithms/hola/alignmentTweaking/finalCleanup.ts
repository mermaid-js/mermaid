import type { Node, Edge } from '../../../types.js';

interface Position {
  x: number;
  y: number;
}

export class FinalCleanup {
  private nodes: Node[];
  private edges: Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * Identify dummy nodes in the graph
   * Dummy nodes are marked with isDummy: true property
   */
  private identifyDummyNodes(): Set<string> {
    const dummies = new Set<string>();

    this.nodes.forEach((node) => {
      if (node.isDummy) {
        dummies.add(node.id);
      }
    });

    return dummies;
  }

  /**
   * Remove dummy nodes from the node list
   * Returns the cleaned node list
   */
  private removeDummyNodes(dummyIds: Set<string>): Node[] {
    return this.nodes.filter((node) => !dummyIds.has(node.id));
  }

  /**
   * Merge edge segments that were split by dummy nodes
   * When a dummy node is removed, we need to connect its predecessor to its successor
   */
  private mergeEdgeSegments(dummyIds: Set<string>): Edge[] {
    if (dummyIds.size === 0) {
      return this.edges;
    }

    const edgeMap = new Map<string, { next: string; edge: Edge }[]>();

    this.edges.forEach((edge) => {
      if (edge.start && edge.end) {
        if (!edgeMap.has(edge.start)) {
          edgeMap.set(edge.start, []);
        }
        edgeMap.get(edge.start)!.push({ next: edge.end, edge });
      }
    });

    const mergedEdges: Edge[] = [];
    const processedEdges = new Set<string>();

    this.edges.forEach((edge) => {
      if (processedEdges.has(edge.id || '')) {
        return;
      }

      if (!edge.start || !edge.end) {
        mergedEdges.push(edge);
        processedEdges.add(edge.id || '');
        return;
      }

      const startIsDummy = dummyIds.has(edge.start);
      const endIsDummy = dummyIds.has(edge.end);

      if (!startIsDummy && !endIsDummy) {
        mergedEdges.push(edge);
        processedEdges.add(edge.id || '');
        return;
      }

      let realStart = edge.start;
      let realEnd = edge.end;
      const bendPoints: Position[] = [];

      while (dummyIds.has(realStart)) {
        let found = false;
        for (const [src, connections] of edgeMap.entries()) {
          for (const conn of connections) {
            if (conn.next === realStart) {
              const dummyNode = this.nodes.find((n) => n.id === realStart);
              if (dummyNode?.x !== undefined && dummyNode.y !== undefined) {
                bendPoints.unshift({ x: dummyNode.x, y: dummyNode.y });
              }
              realStart = src;
              found = true;
              break;
            }
          }
          if (found) {
            break;
          }
        }
        if (!found) {
          break;
        }
      }

      while (dummyIds.has(realEnd)) {
        const connections = edgeMap.get(realEnd);
        if (connections && connections.length > 0) {
          const dummyNode = this.nodes.find((n) => n.id === realEnd);
          if (dummyNode?.x !== undefined && dummyNode.y !== undefined) {
            bendPoints.push({ x: dummyNode.x, y: dummyNode.y });
          }
          realEnd = connections[0].next;
        } else {
          break;
        }
      }

      const mergedEdge: Edge = {
        ...edge,
        start: realStart,
        end: realEnd,
        points: bendPoints.length > 0 ? bendPoints : edge.points,
      };

      mergedEdges.push(mergedEdge);
      processedEdges.add(edge.id || '');
    });

    return mergedEdges;
  }

  /**
   * Perform final orthogonal routing for an edge
   * Routes edge from start to end using Manhattan path
   */
  private routeEdgeOrthogonally(edge: Edge): Edge {
    if (!edge.start || !edge.end) {
      return edge;
    }

    const startNode = this.nodes.find((n) => n.id === edge.start);
    const endNode = this.nodes.find((n) => n.id === edge.end);

    if (!startNode || !endNode) {
      return edge;
    }

    const startX = startNode.x ?? 0;
    const startY = startNode.y ?? 0;
    const endX = endNode.x ?? 0;
    const endY = endNode.y ?? 0;

    if (edge.points && edge.points.length > 0) {
      return edge;
    }

    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    if (dx < 1 || dy < 1) {
      return {
        ...edge,
        points: [
          { x: startX, y: startY },
          { x: endX, y: endY },
        ],
      };
    }

    const midPoint: Position = { x: endX, y: startY };

    return {
      ...edge,
      points: [{ x: startX, y: startY }, midPoint, { x: endX, y: endY }],
    };
  }

  /**
   * Re-route all edges orthogonally given final node positions
   * Preserves aesthetic bends and optimizes paths
   */
  private finalEdgeRouting(edges: Edge[]): Edge[] {
    const routedEdges = edges.map((edge) => this.routeEdgeOrthogonally(edge));

    return routedEdges;
  }

  /**
   * Optimize edge paths to minimize unnecessary bends
   * Simplifies polylines where possible
   */
  private optimizeEdgePaths(edges: Edge[]): Edge[] {
    const optimizedEdges = edges.map((edge) => {
      if (!edge.points || edge.points.length <= 2) {
        return edge;
      }

      const simplified: Position[] = [edge.points[0]];

      for (let i = 1; i < edge.points.length - 1; i++) {
        const prev = edge.points[i - 1];
        const curr = edge.points[i];
        const next = edge.points[i + 1];

        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        const isCollinear =
          (Math.abs(dx1) < 1e-6 && Math.abs(dx2) < 1e-6) ||
          (Math.abs(dy1) < 1e-6 && Math.abs(dy2) < 1e-6);

        if (!isCollinear) {
          simplified.push(curr);
        }
      }

      simplified.push(edge.points[edge.points.length - 1]);

      return {
        ...edge,
        points: simplified,
      };
    });

    return optimizedEdges;
  }

  /**
   * Main cleanup function
   * Removes dummies and performs final routing
   *
   * @returns Object with cleaned nodes and routed edges
   */
  cleanup(): { nodes: Node[]; edges: Edge[] } {
    const dummyIds = this.identifyDummyNodes();

    const cleanedNodes = this.removeDummyNodes(dummyIds);

    const mergedEdges = this.mergeEdgeSegments(dummyIds);

    this.nodes = cleanedNodes;
    this.edges = mergedEdges;

    const routedEdges = this.finalEdgeRouting(mergedEdges);

    const optimizedEdges = this.optimizeEdgePaths(routedEdges);

    return {
      nodes: cleanedNodes,
      edges: optimizedEdges,
    };
  }
}
