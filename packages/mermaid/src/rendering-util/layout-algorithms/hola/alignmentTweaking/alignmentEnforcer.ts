import type { Node, Edge } from '../../../types.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../Constants.js';
import type { AlignmentCandidate } from './alignmentDetector.js';

export class AlignmentEnforcer {
  private nodeMap: Map<string, Node>;
  private edges: Edge[];
  private edgeConnections: Map<string, Set<string>>;

  /**
   * Initialize the alignment enforcer with nodes and edges.
   * @param nodes - Array of nodes to process for alignment
   * @param edges - Array of edges defining connections between nodes
   */
  constructor(nodes: Node[], edges: Edge[]) {
    this.nodeMap = new Map(nodes.map((n) => [n.id, n]));
    this.edges = edges;
    this.edgeConnections = new Map();
    nodes.forEach((node) => {
      this.edgeConnections.set(node.id, new Set());
    });
    edges.forEach((edge) => {
      if (edge.start && edge.end) {
        this.edgeConnections.get(edge.start)?.add(edge.end);
        this.edgeConnections.get(edge.end)?.add(edge.start);
      }
    });
  }

  /**
   * Gets the relevant dimension of a node for alignment shift calculations.
   * @param node - The node to measure
   * @param alignmentType - Type of alignment: 'horizontal' or 'vertical'
   * @returns The dimension to use for shift threshold (height for horizontal, width for vertical)
   */
  private getNodeDimensionForAlignment(
    node: Node,
    alignmentType: 'horizontal' | 'vertical'
  ): number {
    if (alignmentType === 'horizontal') {
      return node.height ?? DEFAULT_NODE_HEIGHT;
    } else {
      return node.width ?? DEFAULT_NODE_WIDTH;
    }
  }

  /**
   * Check if nodes in the candidate are connected by edges.
   * @param candidate - Alignment candidate containing nodes to check for connections
   * @returns True if any pair of nodes in the candidate are connected by an edge
   */
  private areNodesEdgeConnected(candidate: AlignmentCandidate): boolean {
    for (let i = 0; i < candidate.nodes.length; i++) {
      for (let j = i + 1; j < candidate.nodes.length; j++) {
        const node1Id = candidate.nodes[i].id;
        const node2Id = candidate.nodes[j].id;
        if (this.edgeConnections.get(node1Id)?.has(node2Id)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if aligning a group of nodes would introduce edge crossings.
   * Uses a conservative heuristic: rejects alignment if any node would shift
   * more than half its dimension (height for horizontal, width for vertical).
   * For edge-connected nodes, allows larger shifts to ensure proper alignment.
   * Does not perform actual edge crossing detection.
   * @param candidate - Alignment candidate to evaluate for crossing risk
   * @returns True if alignment would likely introduce crossings, false if safe
   */
  private wouldIntroduceCrossings(candidate: AlignmentCandidate): boolean {
    const isEdgeConnected = this.areNodesEdgeConnected(candidate);

    const shiftMultiplier = isEdgeConnected ? 2.0 : 0.5;

    for (const node of candidate.nodes) {
      const currentPos = candidate.type === 'horizontal' ? (node.y ?? 0) : (node.x ?? 0);
      const shift = Math.abs(currentPos - candidate.averagePosition);

      const nodeSize = this.getNodeDimensionForAlignment(node, candidate.type) + 10;
      const maxAllowedShift = nodeSize * shiftMultiplier;

      if (shift > maxAllowedShift) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if alignment would violate any existing constraints.
   * For HOLA, we need to respect orthogonal routing and grid structure.
   * @param _candidate - Alignment candidate to check for constraint violations
   * @returns True if alignment would violate constraints, false if acceptable
   */
  private wouldViolateConstraints(_candidate: AlignmentCandidate): boolean {
    return false;
  }

  /**
   * Apply alignment to a group of nodes.
   * Sets all nodes to the same coordinate (y for horizontal, x for vertical).
   *
   * Note: nodeMap stores references to the same node objects passed to the constructor,
   * so updating nodeRef.x or nodeRef.y directly modifies the original node objects.
   * @param candidate - Alignment candidate containing nodes and target position
   */
  private applyAlignment(candidate: AlignmentCandidate): void {
    const { nodes, type, averagePosition } = candidate;

    nodes.forEach((node) => {
      const nodeRef = this.nodeMap.get(node.id);
      if (nodeRef) {
        if (type === 'horizontal') {
          nodeRef.y = Math.round(averagePosition);
        } else {
          nodeRef.x = Math.round(averagePosition);
        }
      } else {
        //
      }
    });
  }

  /**
   * Process a list of alignment candidates and apply valid ones.
   * @param candidates - Array of alignment candidates to evaluate and potentially apply
   * @returns The number of alignments successfully applied
   */
  enforceAlignments(candidates: AlignmentCandidate[]): number {
    let alignmentsApplied = 0;

    for (const candidate of candidates) {
      if (this.wouldIntroduceCrossings(candidate)) {
        continue;
      }

      if (this.wouldViolateConstraints(candidate)) {
        continue;
      }

      this.applyAlignment(candidate);
      alignmentsApplied++;
    }

    return alignmentsApplied;
  }
}
