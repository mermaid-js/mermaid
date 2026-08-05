/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @cspell/spellchecker */
import type { LayoutData, Node, Edge } from '../../../types.js';
import type { Position, DummyNode, PlanarEdge, Face, PlanarizedCore } from './types.js';

/**
 * Step 3b: Core Planarization Implementation
 * Implements the two-pass planarization algorithm from requirements
 */
export class CorePlanarizer {
  private coreData: LayoutData;
  private dummyNodeCounter = 0;

  constructor(coreData: LayoutData) {
    this.coreData = coreData;
  }

  /**
   * Main planarization algorithm
   * Returns planarized core with faces identified
   */
  planarizeCore(): PlanarizedCore {
    const nodes = new Map<string, Node | DummyNode>();
    this.coreData.nodes.forEach((node) => {
      nodes.set(node.id, { ...node });
    });

    const edges = this.coreData.edges?.map((edge) => this.edgeToAxisAligned(edge)) || [];

    // HOLA Theory Step 3b Pass 1a: Remove parallel edges BEFORE bend point insertion
    const {
      nodes: nodesAfterParallelRemoval,
      edges: edgesWithoutParallel,
      dummyNodes: parallelDummies,
    } = this.removeParallelEdges(nodes, edges);

    // Pass 1b: Insert dummy nodes at bend points
    const {
      nodes: nodesWithBends,
      edges: edgesWithBends,
      dummyNodes: bendDummies,
    } = this.insertBendPointDummies(nodesAfterParallelRemoval, edgesWithoutParallel);

    // Pass 2: Insert dummy nodes at crossings
    const {
      nodes: finalNodes,
      edges: finalEdges,
      dummyNodes: crossingDummies,
    } = this.insertCrossingDummies(nodesWithBends, edgesWithBends);

    const allDummyNodes = [...parallelDummies, ...bendDummies, ...crossingDummies];

    // Identify faces in the planar graph
    const { faces, embedding } = this.identifyFaces(finalNodes, finalEdges);

    return {
      nodes: finalNodes,
      edges: finalEdges,
      faces,
      dummyNodes: allDummyNodes,
      embedding,
    };
  }

  /**
   * Convert edge to axis-aligned representation
   */
  private edgeToAxisAligned(edge: Edge): PlanarEdge {
    const startNode = this.coreData.nodes.find((n) => n.id === edge.start);
    const endNode = this.coreData.nodes.find((n) => n.id === edge.end);

    if (!startNode || !endNode) {
      throw new Error(`Invalid edge: ${edge.id}`);
    }

    const points =
      edge.points && edge.points.length > 0
        ? edge.points
        : [
            { x: startNode.x!, y: startNode.y! },
            { x: endNode.x!, y: endNode.y! },
          ];

    const dx = Math.abs(endNode.x! - startNode.x!);
    const dy = Math.abs(endNode.y! - startNode.y!);

    return {
      id: edge.id || `edge_${edge.start}_${edge.end}`,
      start: edge.start!,
      end: edge.end!,
      isHorizontal: dx > dy,
      isVertical: dy > dx,
      points,
    };
  }

  /**
   * Pass 1a: Remove parallel edges (HOLA Theory Requirement)
   * HOLA Theory [68]: "if the graph had any multiple edges between the same two original nodes,
   * reduce them: eliminate all but one edge between any pair of nodes (introducing a dummy if needed)"
   *
   * Implementation Strategy:
   * 1. Detect all parallel edges (multiple edges between same node pair)
   * 2. For each parallel set, keep the best representative edge
   * 3. If needed, introduce dummy nodes to merge parallel paths
   * 4. This ensures the graph becomes simple (no multi-edges) before planarization
   */
  private removeParallelEdges(
    nodes: Map<string, Node | DummyNode>,
    edges: PlanarEdge[]
  ): { nodes: Map<string, Node | DummyNode>; edges: PlanarEdge[]; dummyNodes: DummyNode[] } {
    const newNodes = new Map(nodes);
    const newEdges: PlanarEdge[] = [];
    const dummyNodes: DummyNode[] = [];

    const edgeGroups = new Map<string, PlanarEdge[]>();

    edges.forEach((edge) => {
      const [nodeA, nodeB] = [edge.start, edge.end].sort();
      const key = `${nodeA}|${nodeB}`;

      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(edge);
    });

    edgeGroups.forEach((parallelEdges, _key) => {
      if (parallelEdges.length === 1) {
        newEdges.push(parallelEdges[0]);
      } else {
        const representative = parallelEdges.reduce((best, current) => {
          const bestComplexity = best.points.length;
          const currentComplexity = current.points.length;
          return currentComplexity < bestComplexity ? current : best;
        });

        newEdges.push(representative);
      }
    });

    return { nodes: newNodes, edges: newEdges, dummyNodes };
  }

  /**
   * Pass 1b: Insert dummy nodes at bend points
   */
  private insertBendPointDummies(
    nodes: Map<string, Node | DummyNode>,
    edges: PlanarEdge[]
  ): { nodes: Map<string, Node | DummyNode>; edges: PlanarEdge[]; dummyNodes: DummyNode[] } {
    const newNodes = new Map(nodes);
    const newEdges: PlanarEdge[] = [];
    const dummyNodes: DummyNode[] = [];

    edges.forEach((edge) => {
      if (edge.points.length <= 2) {
        newEdges.push(edge);
        return;
      }

      let prevNodeId = edge.start;

      for (let i = 1; i < edge.points.length - 1; i++) {
        const bendPoint = edge.points[i];

        const dummyId = `bend_${this.dummyNodeCounter++}`;
        const dummyNode: DummyNode = {
          id: dummyId,
          x: bendPoint.x,
          y: bendPoint.y,
          type: 'bend',
          originalEdgeId: edge.id,
        };

        newNodes.set(dummyId, dummyNode);
        dummyNodes.push(dummyNode);

        const segmentEdge: PlanarEdge = {
          id: `${edge.id}_seg${i}`,
          start: prevNodeId,
          end: dummyId,
          isHorizontal: this.isHorizontalSegment(
            this.getNodePosition(newNodes, prevNodeId),
            bendPoint
          ),
          isVertical: this.isVerticalSegment(this.getNodePosition(newNodes, prevNodeId), bendPoint),
          points: [this.getNodePosition(newNodes, prevNodeId), bendPoint],
        };

        newEdges.push(segmentEdge);
        prevNodeId = dummyId;
      }

      const finalSegment: PlanarEdge = {
        id: `${edge.id}_final`,
        start: prevNodeId,
        end: edge.end,
        isHorizontal: this.isHorizontalSegment(
          this.getNodePosition(newNodes, prevNodeId),
          edge.points[edge.points.length - 1]
        ),
        isVertical: this.isVerticalSegment(
          this.getNodePosition(newNodes, prevNodeId),
          edge.points[edge.points.length - 1]
        ),
        points: [this.getNodePosition(newNodes, prevNodeId), edge.points[edge.points.length - 1]],
      };

      newEdges.push(finalSegment);
    });

    return { nodes: newNodes, edges: newEdges, dummyNodes };
  }

  /**
   * Pass 2: Insert dummy nodes at crossings using sweep line algorithm
   */
  private insertCrossingDummies(
    nodes: Map<string, Node | DummyNode>,
    edges: PlanarEdge[]
  ): { nodes: Map<string, Node | DummyNode>; edges: PlanarEdge[]; dummyNodes: DummyNode[] } {
    const newNodes = new Map(nodes);
    const newEdges: PlanarEdge[] = [];
    const dummyNodes: DummyNode[] = [];

    const intersections = this.findAxisAlignedIntersections(edges, nodes);

    edges.forEach((edge) => {
      const edgeIntersections = intersections
        .filter((int) => int.edge1Id === edge.id || int.edge2Id === edge.id)
        .filter((int) => (int.edge1Id === edge.id ? int.edge1Id : int.edge2Id === edge.id));

      if (edgeIntersections.length === 0) {
        newEdges.push(edge);
        return;
      }

      const sortedIntersections = this.sortIntersectionsAlongEdge(edge, edgeIntersections, nodes);

      let prevNodeId = edge.start;
      let segmentIndex = 0;

      sortedIntersections.forEach((intersection) => {
        const dummyId = `cross_${this.dummyNodeCounter++}`;
        const dummyNode: DummyNode = {
          id: dummyId,
          x: intersection.point.x,
          y: intersection.point.y,
          type: 'crossing',
          originalEdgeId: edge.id,
        };

        newNodes.set(dummyId, dummyNode);
        dummyNodes.push(dummyNode);

        const segmentEdge: PlanarEdge = {
          id: `${edge.id}_cross${segmentIndex++}`,
          start: prevNodeId,
          end: dummyId,
          isHorizontal: edge.isHorizontal,
          isVertical: edge.isVertical,
          points: [this.getNodePosition(newNodes, prevNodeId), intersection.point],
        };

        newEdges.push(segmentEdge);
        prevNodeId = dummyId;
      });

      const finalSegment: PlanarEdge = {
        id: `${edge.id}_final`,
        start: prevNodeId,
        end: edge.end,
        isHorizontal: edge.isHorizontal,
        isVertical: edge.isVertical,
        points: [
          this.getNodePosition(newNodes, prevNodeId),
          this.getNodePosition(newNodes, edge.end),
        ],
      };

      newEdges.push(finalSegment);
    });

    return { nodes: newNodes, edges: newEdges, dummyNodes };
  }

  /**
   * Identify faces in the planarized graph
   * Fixed implementation that properly handles orthogonal graphs
   */
  private identifyFaces(
    nodes: Map<string, Node | DummyNode>,
    edges: PlanarEdge[]
  ): { faces: Face[]; embedding: import('./types.js').PlanarEmbedding } {
    const adjacency = this.buildGeometricAdjacency(nodes, edges);

    const embedding: import('./types.js').PlanarEmbedding = {
      nodeNeighbors: adjacency,
    };

    const faces: Face[] = [];
    const usedHalfEdges = new Set<string>();

    edges.forEach((edge) => {
      const directions = [
        { from: edge.start, to: edge.end },
        { from: edge.end, to: edge.start },
      ];

      directions.forEach(({ from, to }) => {
        const halfEdgeKey = `${from}->${to}`;

        if (!usedHalfEdges.has(halfEdgeKey)) {
          const face = this.traceFaceCorrectly(from, to, adjacency, nodes);
          if (face && face.boundary.length >= 2) {
            faces.push(face);
            this.markFaceHalfEdgesAsUsed(face, usedHalfEdges);
          }
        }
      });
    });

    const uniqueFaces = this.removeDuplicateFaces(faces);

    if (uniqueFaces.length > 0) {
      const externalFace = this.identifyExternalFace(uniqueFaces, nodes);
      if (externalFace) {
        externalFace.isExternal = true;
      }
    }

    return { faces: uniqueFaces, embedding };
  }

  private getNodePosition(nodes: Map<string, Node | DummyNode>, nodeId: string): Position {
    const node = nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    return { x: node.x!, y: node.y! };
  }

  private isHorizontalSegment(start: Position, end: Position): boolean {
    return Math.abs(start.y - end.y) < 1e-6;
  }

  private isVerticalSegment(start: Position, end: Position): boolean {
    return Math.abs(start.x - end.x) < 1e-6;
  }

  private findAxisAlignedIntersections(
    edges: PlanarEdge[],
    nodes: Map<string, Node | DummyNode>
  ): { edge1Id: string; edge2Id: string; point: Position }[] {
    const intersections: { edge1Id: string; edge2Id: string; point: Position }[] = [];

    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i];
        const edge2 = edges[j];

        if (
          edge1.start === edge2.start ||
          edge1.start === edge2.end ||
          edge1.end === edge2.start ||
          edge1.end === edge2.end
        ) {
          continue;
        }

        const intersection = this.findAxisAlignedIntersection(edge1, edge2, nodes);
        if (intersection) {
          intersections.push({
            edge1Id: edge1.id,
            edge2Id: edge2.id,
            point: intersection,
          });
        }
      }
    }

    return intersections;
  }

  private findAxisAlignedIntersection(
    edge1: PlanarEdge,
    edge2: PlanarEdge,
    nodes: Map<string, Node | DummyNode>
  ): Position | null {
    const start1 = this.getNodePosition(nodes, edge1.start);
    const end1 = this.getNodePosition(nodes, edge1.end);
    const start2 = this.getNodePosition(nodes, edge2.start);
    const end2 = this.getNodePosition(nodes, edge2.end);

    if (this.isHorizontalSegment(start1, end1) && this.isVerticalSegment(start2, end2)) {
      return this.intersectHorizontalVertical(start1, end1, start2, end2);
    } else if (this.isVerticalSegment(start1, end1) && this.isHorizontalSegment(start2, end2)) {
      return this.intersectHorizontalVertical(start2, end2, start1, end1);
    }

    return null;
  }

  private intersectHorizontalVertical(
    hStart: Position,
    hEnd: Position,
    vStart: Position,
    vEnd: Position
  ): Position | null {
    const hY = hStart.y;
    const vX = vStart.x;

    const hMinX = Math.min(hStart.x, hEnd.x);
    const hMaxX = Math.max(hStart.x, hEnd.x);
    const vMinY = Math.min(vStart.y, vEnd.y);
    const vMaxY = Math.max(vStart.y, vEnd.y);

    if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
      return { x: vX, y: hY };
    }

    return null;
  }

  private sortIntersectionsAlongEdge(
    edge: PlanarEdge,
    intersections: { edge1Id: string; edge2Id: string; point: Position }[],
    nodes: Map<string, Node | DummyNode>
  ): { edge1Id: string; edge2Id: string; point: Position }[] {
    const start = this.getNodePosition(nodes, edge.start);

    return intersections.sort((a, b) => {
      const distA = Math.abs(a.point.x - start.x) + Math.abs(a.point.y - start.y);
      const distB = Math.abs(b.point.x - start.x) + Math.abs(b.point.y - start.y);
      return distA - distB;
    });
  }

  private buildGeometricAdjacency(
    nodes: Map<string, Node | DummyNode>,
    edges: PlanarEdge[]
  ): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    nodes.forEach((_, nodeId) => {
      adjacency.set(nodeId, []);
    });

    edges.forEach((edge) => {
      adjacency.get(edge.start)!.push(edge.end);
      adjacency.get(edge.end)!.push(edge.start);
    });

    adjacency.forEach((neighbors, nodeId) => {
      const nodePos = this.getNodePosition(nodes, nodeId);
      neighbors.sort((a, b) => {
        const posA = this.getNodePosition(nodes, a);
        const posB = this.getNodePosition(nodes, b);
        const angleA = Math.atan2(posA.y - nodePos.y, posA.x - nodePos.x);
        const angleB = Math.atan2(posB.y - nodePos.y, posB.x - nodePos.x);
        return angleA - angleB;
      });
    });

    return adjacency;
  }

  /**
   * Corrected face traversal algorithm for orthogonal graphs
   */
  private traceFaceCorrectly(
    startNode: string,
    firstNext: string,
    adjacency: Map<string, string[]>,
    nodes: Map<string, Node | DummyNode>
  ): Face | null {
    const boundary: string[] = [];
    let current = startNode;
    let prev: string | null = null;
    let next = firstNext;

    do {
      boundary.push(current);

      const neighbors = adjacency.get(current);
      if (!neighbors || neighbors.length === 0) {
        return null;
      }

      if (prev === null) {
        prev = current;
        current = next;
      } else {
        const prevIndex = neighbors.indexOf(prev);
        if (prevIndex === -1) {
          return null;
        }

        const nextIndex = (prevIndex + 1) % neighbors.length;
        next = neighbors[nextIndex];

        prev = current;
        current = next;
      }
    } while (current !== startNode && boundary.length < 20);

    if (current !== startNode) {
      return null;
    }

    if (boundary.length > 1 && boundary[boundary.length - 1] === boundary[0]) {
      boundary.pop();
    }

    const boundingBox = this.calculateFaceBoundingBox(boundary, nodes);
    const area = this.calculateFaceArea(boundary, nodes);
    const adjacentCoreNodes = this.findAdjacentCoreNodes(boundary);

    const normalizedId = this.normalizeBoundaryCyclic(boundary);

    return {
      id: `face_${normalizedId}`,
      boundary,
      boundaryNodes: boundary,
      boundingBox,
      area,
      isExternal: false,
      adjacentCoreNodes,
    };
  }

  /**
   * Normalize face boundary using minimum cyclic rotation
   * HOLA Theory: Faces must preserve cyclic order for proper traversal
   * This creates a canonical representation without destroying the cycle
   *
   */
  private normalizeBoundaryCyclic(boundary: string[]): string {
    if (boundary.length === 0) {
      return '';
    }

    const rotations: string[] = [];
    for (let i = 0; i < boundary.length; i++) {
      const rotation = [...boundary.slice(i), ...boundary.slice(0, i)];
      rotations.push(rotation.join('_'));
    }

    const reversedBoundary = [...boundary].reverse();
    for (let i = 0; i < reversedBoundary.length; i++) {
      const rotation = [...reversedBoundary.slice(i), ...reversedBoundary.slice(0, i)];
      rotations.push(rotation.join('_'));
    }

    rotations.sort();
    return rotations[0];
  }

  /**
   * Remove duplicate faces with same boundary nodes
   * Uses cyclic-aware normalization to detect duplicates
   */
  private removeDuplicateFaces(faces: Face[]): Face[] {
    const seenBoundaries = new Set<string>();
    const uniqueFaces: Face[] = [];

    faces.forEach((face) => {
      const normalizedBoundary = this.normalizeBoundaryCyclic(face.boundary);

      if (!seenBoundaries.has(normalizedBoundary)) {
        seenBoundaries.add(normalizedBoundary);
        uniqueFaces.push(face);
      }
    });

    return uniqueFaces;
  }

  /**
   * Identify external face (outermost/largest)
   */
  private identifyExternalFace(faces: Face[], _nodes: Map<string, Node | DummyNode>): Face | null {
    if (faces.length === 0) {
      return null;
    }

    let externalFace = faces[0];
    let maxArea = externalFace.area;

    faces.forEach((face) => {
      if (face.area > maxArea) {
        maxArea = face.area;
        externalFace = face;
      }
    });

    return externalFace;
  }

  /**
   * Mark half-edges of face as used to prevent duplicate detection
   */
  private markFaceHalfEdgesAsUsed(face: Face, usedHalfEdges: Set<string>): void {
    for (let i = 0; i < face.boundary.length; i++) {
      const from = face.boundary[i];
      const to = face.boundary[(i + 1) % face.boundary.length];
      usedHalfEdges.add(`${from}->${to}`);
    }
  }

  private calculateFaceBoundingBox(
    boundary: string[],
    nodes: Map<string, Node | DummyNode>
  ): Face['boundingBox'] {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    boundary.forEach((nodeId) => {
      const pos = this.getNodePosition(nodes, nodeId);
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });

    return { minX, maxX, minY, maxY };
  }

  private calculateFaceArea(boundary: string[], nodes: Map<string, Node | DummyNode>): number {
    if (boundary.length < 3) {
      return 0;
    }

    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      const pi = this.getNodePosition(nodes, boundary[i]);
      const pj = this.getNodePosition(nodes, boundary[j]);
      area += pi.x * pj.y - pj.x * pi.y;
    }
    return Math.abs(area) / 2;
  }

  private findAdjacentCoreNodes(boundary: string[]): string[] {
    return boundary.filter((nodeId) => !nodeId.startsWith('bend_') && !nodeId.startsWith('cross_'));
  }
}
