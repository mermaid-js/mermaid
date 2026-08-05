/* eslint-disable @cspell/spellchecker */
import { log } from '../../../../logger.js';
import type { Edge } from '../../../types.js';
import type { NodeWithPosition, Position, Chain, AlignmentConstraint, BendPoint } from './types.js';
import { computeStress, computeGradient } from './stressMinimizationUtils.js';

export class OrthogonalLayouter {
  private nodes: Map<string, NodeWithPosition>;
  private edges: Edge[];
  private adjacencyList = new Map<string, string[]>();
  private anchorConstraints = new Map<string, AlignmentConstraint>();
  private chainConstraints: AlignmentConstraint[] = [];
  private get alignmentConstraints(): AlignmentConstraint[] {
    return [...this.anchorConstraints.values(), ...this.chainConstraints];
  }
  private chains: Chain[] = [];
  private uniformEdgeLength: number;
  private graphDistances = new Map<string, Map<string, number>>();
  private chainNodeDirections = new Map<string, Map<string, 'north' | 'south' | 'east' | 'west'>>();
  private prePositionedNodes = new Set<string>();

  constructor(nodes: Map<string, NodeWithPosition>, edges: Edge[], uniformEdgeLength: number) {
    this.nodes = nodes;
    this.edges = edges;
    this.uniformEdgeLength = uniformEdgeLength;
    this.buildAdjacencyList();
    this.computeAllPairsShortestPaths();
    this.identifyChains();
  }

  private computeAllPairsShortestPaths(): void {
    this.nodes.forEach((_, sourceId) => {
      const dist = new Map<string, number>();
      dist.set(sourceId, 0);
      const queue: string[] = [sourceId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentDist = dist.get(current)!;
        for (const neighbor of this.adjacencyList.get(current) ?? []) {
          if (!dist.has(neighbor)) {
            dist.set(neighbor, currentDist + 1);
            queue.push(neighbor);
          }
        }
      }

      this.graphDistances.set(sourceId, dist);
    });
  }

  private buildAdjacencyList(): void {
    this.nodes.forEach((_, nodeId) => {
      this.adjacencyList.set(nodeId, []);
    });

    this.edges.forEach((edge) => {
      if (edge.start && edge.end) {
        this.adjacencyList.get(edge.start)?.push(edge.end);
        this.adjacencyList.get(edge.end)?.push(edge.start);
      }
    });
  }

  private getDegree(nodeId: string): number {
    return this.adjacencyList.get(nodeId)?.length ?? 0;
  }

  private identifyChains(): void {
    const visited = new Set<string>();
    const degree2Nodes = [...this.nodes.keys()].filter((nodeId) => this.getDegree(nodeId) === 2);

    log.debug(
      `[HOLA] identifyChains | total nodes=${this.nodes.size} degree-2 nodes=${degree2Nodes.length}`
    );

    degree2Nodes.forEach((seedNode) => {
      if (visited.has(seedNode)) {
        return;
      }

      const probeVisited = new Set<string>([seedNode]);
      let chainStart = seedNode;

      let probing = true;
      while (probing) {
        const neighbors = this.adjacencyList.get(chainStart) ?? [];
        const backward = neighbors.find((n) => !probeVisited.has(n));

        if (!backward) {
          probing = false;
        } else if (this.getDegree(backward) !== 2) {
          probing = false;
        } else {
          probeVisited.add(backward);
          chainStart = backward;
        }
      }

      const chain: string[] = [];
      let current = chainStart;
      const chainStartNeighbors = this.adjacencyList.get(chainStart) ?? [];
      let comingFrom = chainStartNeighbors.find((n) => this.getDegree(n) !== 2) ?? '';

      while (current && this.getDegree(current) === 2 && !visited.has(current)) {
        visited.add(current);
        chain.push(current);

        const neighbors = this.adjacencyList.get(current) ?? [];
        const next = neighbors.find((n) => n !== comingFrom && !visited.has(n));
        comingFrom = current;
        current = next ?? '';
      }

      if (chain.length >= 1) {
        const firstNode = chain[0];
        const lastNode = chain[chain.length - 1];

        const startNeighbors = this.adjacencyList.get(firstNode) ?? [];
        const endNeighbors = this.adjacencyList.get(lastNode) ?? [];
        const chainSet = new Set(chain);
        const hasExternalNeighbor = chain.some((n) =>
          (this.adjacencyList.get(n) ?? []).some(
            (nb) => !chainSet.has(nb) && this.getDegree(nb) !== 2
          )
        );
        const isCycle = endNeighbors.includes(firstNode) && !hasExternalNeighbor;

        if (isCycle) {
          log.debug(
            `[HOLA] identifyChains | cycle detected length=${chain.length} nodes=[${chain.join('→')}]`
          );
          this.chains.push({
            nodes: chain,
            startNode: firstNode,
            endNode: lastNode,
            isCycle: true,
          });
        } else {
          let chainStartNode: string;
          let chainEndNode: string;

          if (firstNode === lastNode) {
            chainStartNode = startNeighbors[0] ?? firstNode;
            chainEndNode = startNeighbors[1] ?? startNeighbors[0] ?? lastNode;
          } else {
            chainStartNode = startNeighbors.find((n) => this.getDegree(n) !== 2) ?? firstNode;
            chainEndNode = endNeighbors.find((n) => this.getDegree(n) !== 2) ?? lastNode;
          }

          log.debug(
            `[HOLA] identifyChains | chain detected ${chainStartNode}→[${chain.join('→')}]→${chainEndNode} length=${chain.length}`
          );
          this.chains.push({
            nodes: chain,
            startNode: chainStartNode,
            endNode: chainEndNode,
            isCycle: false,
          });
        }
      }
    });

    log.debug(
      `[HOLA] identifyChains done | chains=${this.chains.length} cycles=${this.chains.filter((c) => c.isCycle).length}`
    );
  }

  configureNodes(): void {
    const highDegreeNodes = [...this.nodes.keys()]
      .filter((nodeId) => this.getDegree(nodeId) >= 3)
      .sort((a, b) => this.getDegree(b) - this.getDegree(a));

    log.debug(
      `[HOLA] configureNodes | high-degree nodes (≥3): [${highDegreeNodes.map((id) => `${id}(deg=${this.getDegree(id)})`).join(', ')}]`
    );

    highDegreeNodes.forEach((nodeId) => {
      this.configureNode(nodeId);
    });

    this.applyGridAlignmentConstraints();
  }

  private performPostAlignmentStressRelaxation(): void {
    const maxIterations = this.nodes.size * 50;
    const learningRate = 0.00000001; //0.00000000005;
    const tolerance = 1e-6;
    const constrainedCount = [...this.nodes.keys()].filter((id) =>
      this.hasStrictAlignmentConstraint(id)
    ).length;

    let prevStress = computeStress(
      this.nodes,
      this.getGraphDistance.bind(this),
      this.uniformEdgeLength
    );

    log.debug(
      `[HOLA] stressRelaxation start | maxIter=${maxIterations} constrained=${constrainedCount}/${this.nodes.size} initialStress=${prevStress.toFixed(2)}`
    );

    let lastIter = 0;
    for (let iter = 0; iter < maxIterations; iter++) {
      lastIter = iter;
      const updates = new Map<string, Position>();

      this.nodes.forEach((node, nodeId) => {
        if (!this.hasStrictAlignmentConstraint(nodeId)) {
          const gradient = computeGradient(
            nodeId,
            this.nodes,
            this.getGraphDistance.bind(this),
            this.uniformEdgeLength
          );
          updates.set(nodeId, {
            x: node.x - learningRate * gradient.x,
            y: node.y - learningRate * gradient.y,
          });
        }
      });

      updates.forEach((newPos, nodeId) => {
        const node = this.nodes.get(nodeId)!;
        node.x = newPos.x;
        node.y = newPos.y;
      });

      const currentStress = computeStress(
        this.nodes,
        this.getGraphDistance.bind(this),
        this.uniformEdgeLength
      );
      if (Math.abs(currentStress - prevStress) < tolerance) {
        log.debug(
          `[HOLA] stressRelaxation converged at iter=${lastIter} stress=${currentStress.toFixed(2)}`
        );
        break;
      }
      prevStress = currentStress;
    }
  }

  private hasStrictAlignmentConstraint(nodeId: string): boolean {
    return this.alignmentConstraints.some(
      (constraint) => constraint.nodeId === nodeId || constraint.alignTo === nodeId
    );
  }

  private getGraphDistance(id1: string, id2: string): number {
    return this.graphDistances.get(id1)?.get(id2) ?? Infinity;
  }

  private configureNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)!;
    const neighbors = this.adjacencyList.get(nodeId) ?? [];

    if (neighbors.length < 2) {
      return;
    }

    const neighborInfo: {
      id: string;
      angle: number;
      distance: number;
      clockwiseOrder: number;
    }[] = [];

    neighbors.forEach((neighborId) => {
      const neighbor = this.nodes.get(neighborId)!;
      const dx = neighbor.x - node.x;
      const dy = neighbor.y - node.y;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);

      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

      neighborInfo.push({
        id: neighborId,
        angle: normalizedAngle,
        distance,
        clockwiseOrder: 0,
      });
    });

    neighborInfo.sort((a, b) => a.angle - b.angle);

    neighborInfo.forEach((info, index) => {
      info.clockwiseOrder = index;
    });

    log.debug(
      `[HOLA] configureNode(${nodeId}) | center=(${node.x.toFixed(1)},${node.y.toFixed(1)}) neighbor angles: [${neighborInfo.map((n) => `${n.id}=${((n.angle * 180) / Math.PI).toFixed(1)}° pos=(${this.nodes.get(n.id)!.x.toFixed(1)},${this.nodes.get(n.id)!.y.toFixed(1)})`).join(', ')}]`
    );

    const proposedAssignment = this.buildProposedAssignment(nodeId, neighborInfo);

    let finalAssignment: Map<string, 'north' | 'south' | 'east' | 'west'>;
    if (this.validateCompleteAssignment(nodeId, proposedAssignment, neighborInfo)) {
      finalAssignment = proposedAssignment;
      log.debug(`[HOLA] configureNode(${nodeId}) | proposed assignment valid`);
    } else {
      log.warn(
        `[HOLA] configureNode(${nodeId}) | proposed assignment FAILED validation, falling back to maximal`
      );
      finalAssignment = this.findMaximalValidAssignment(nodeId, neighborInfo);
    }

    const assignmentStr = [...finalAssignment.entries()].map(([n, d]) => `${n}→${d}`).join(', ');
    log.debug(
      `[HOLA] configureNode(${nodeId}) | neighbors=${neighbors.length} assigned=${finalAssignment.size}/${neighbors.length} assignment=[${assignmentStr}]`
    );

    finalAssignment.forEach((direction, neighborId) => {
      if (this.getDegree(neighborId) === 2) {
        log.debug(
          `[HOLA] configureNode(${nodeId}) | SKIP constraint for chain node ${neighborId}→${direction} (degree=2, handled by configureChains)`
        );
        // Record the direction so configureChain can use it as a constrained exit direction.
        if (!this.chainNodeDirections.has(nodeId)) {
          this.chainNodeDirections.set(nodeId, new Map());
        }
        this.chainNodeDirections.get(nodeId)!.set(neighborId, direction);
        return;
      }
      const existing = this.anchorConstraints.get(neighborId);
      if (!existing) {
        this.anchorConstraints.set(neighborId, { nodeId: neighborId, direction, alignTo: nodeId });
      } else {
        const existingAnchorDegree = this.getDegree(existing.alignTo);
        const currentAnchorDegree = this.getDegree(nodeId);
        if (currentAnchorDegree > existingAnchorDegree) {
          log.debug(
            `[HOLA] configureNode(${nodeId}) | REPLACE constraint on ${neighborId}: ` +
              `${existing.direction} of ${existing.alignTo}(deg=${existingAnchorDegree}) → ` +
              `${direction} of ${nodeId}(deg=${currentAnchorDegree})`
          );
          this.anchorConstraints.set(neighborId, {
            nodeId: neighborId,
            direction,
            alignTo: nodeId,
          });
        } else {
          log.debug(
            `[HOLA] configureNode(${nodeId}) | SKIP conflict on ${neighborId}: ` +
              `keeping ${existing.direction} of ${existing.alignTo}(deg=${existingAnchorDegree}) ` +
              `over ${direction} of ${nodeId}(deg=${currentAnchorDegree})`
          );
        }
      }
    });
  }

  /**
   * Calculate angular displacement between two angles (shortest arc)
   */
  private calculateAngularDisplacement(angle1: number, angle2: number): number {
    const diff = Math.abs(angle1 - angle2);
    return Math.min(diff, 2 * Math.PI - diff);
  }

  applyGridAlignmentConstraints(): void {
    const spacing = this.uniformEdgeLength;

    this.alignmentConstraints.forEach((constraint) => {
      const node = this.nodes.get(constraint.nodeId);
      const alignToNode = this.nodes.get(constraint.alignTo);

      if (!node || !alignToNode) {
        return;
      }

      if (this.getDegree(constraint.nodeId) >= 3) {
        // skip
      } else if (constraint.axisOnly) {
        switch (constraint.direction) {
          case 'north':
          case 'south':
            node.x = alignToNode.x;
            break;
          case 'east':
          case 'west':
            node.y = alignToNode.y;
            break;
        }
      } else {
        switch (constraint.direction) {
          case 'north':
            node.x = alignToNode.x;
            if (node.y > alignToNode.y - spacing) {
              node.y = alignToNode.y - spacing;
            }
            break;
          case 'south':
            node.x = alignToNode.x;
            if (node.y < alignToNode.y + spacing) {
              node.y = alignToNode.y + spacing;
            }
            break;
          case 'east':
            node.y = alignToNode.y;
            if (node.x < alignToNode.x + spacing) {
              node.x = alignToNode.x + spacing;
            }
            break;
          case 'west':
            node.y = alignToNode.y;
            if (node.x > alignToNode.x - spacing) {
              node.x = alignToNode.x - spacing;
            }
            break;
        }
      }
      log.debug(
        `[HOLA] applyConstraint | ${constraint.nodeId} placed ${constraint.direction} of ${constraint.alignTo}${constraint.axisOnly ? ' [axisOnly]' : ''} → pos=(${node.x.toFixed(1)},${node.y.toFixed(1)})`
      );
    });
  }

  /**
   * HOLA Theory: Validate sign constraints (orthogonal ordering preservation)
   * Paper requirement: "if ux less than vx before, then ux less than or equal vx after configuration"
   * Ensures cardinal assignments don't reverse relative positions
   */
  private validateSignConstraints(
    neighborNode: NodeWithPosition,
    centerNode: NodeWithPosition,
    targetDirection: 'north' | 'south' | 'east' | 'west'
  ): boolean {
    const dx = neighborNode.x - centerNode.x;
    const dy = neighborNode.y - centerNode.y;

    switch (targetDirection) {
      case 'east':
        return dx >= 0;
      case 'west':
        return dx <= 0;
      case 'north':
        return dy <= 0;
      case 'south':
        return dy >= 0;
    }
  }

  /**
   * HOLA Theory: Validate cyclic order preservation
   * Paper: "prohibit any assignment that would alter the cyclic order of the neighbours of v"
   * Checks ALL pairs of neighbors to detect cyclic order violations with wrap-around
   */
  private validateCyclicOrder(
    proposedAssignments: Map<string, 'north' | 'south' | 'east' | 'west'>,
    sortedNeighbors: { id: string; angle: number }[],
    debugLabel?: string
  ): boolean {
    const assignedNeighbors = sortedNeighbors.filter((n) => proposedAssignments.has(n.id));

    if (assignedNeighbors.length < 2) {
      return true;
    }

    const cardinalAngles = {
      east: 0,
      south: Math.PI / 2,
      west: Math.PI,
      north: (3 * Math.PI) / 2,
    };

    const targetAngles = assignedNeighbors.map(
      (n) => cardinalAngles[proposedAssignments.get(n.id)!]
    );

    if (debugLabel) {
      log.debug(
        `[HOLA] validateCyclicOrder(${debugLabel}) | checking [${assignedNeighbors.map((n, i) => `${n.id}(src=${((n.angle * 180) / Math.PI).toFixed(1)}°→tgt=${((targetAngles[i] * 180) / Math.PI).toFixed(1)}°)`).join(', ')}]`
      );
    }

    const isComplete = assignedNeighbors.length === sortedNeighbors.length;
    const n = targetAngles.length;
    const pairsToCheck = isComplete ? n : n - 1;

    for (let i = 0; i < pairsToCheck; i++) {
      const j = (i + 1) % n;
      const forwardDist = (targetAngles[j] - targetAngles[i] + 2 * Math.PI) % (2 * Math.PI);
      const backwardDist = (targetAngles[i] - targetAngles[j] + 2 * Math.PI) % (2 * Math.PI);

      if (backwardDist < forwardDist) {
        if (debugLabel) {
          log.debug(
            `[HOLA] validateCyclicOrder(${debugLabel}) | FAIL on pair (${assignedNeighbors[i].id}→${((targetAngles[i] * 180) / Math.PI).toFixed(0)}°, ${assignedNeighbors[j].id}→${((targetAngles[j] * 180) / Math.PI).toFixed(0)}°): backward=${((backwardDist * 180) / Math.PI).toFixed(1)}° < forward=${((forwardDist * 180) / Math.PI).toFixed(1)}°`
          );
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Build proposed cardinal assignment for all neighbors with minimal angular displacement.
   * CN-4 (req.md Step 7): collect all (neighbor, direction) pairs sorted by displacement cost
   * and assign greedily — the globally cheapest pair is always assigned first, regardless of
   * the angular order of neighbors.
   */
  private buildProposedAssignment(
    nodeId: string,
    sortedNeighbors: { id: string; angle: number }[]
  ): Map<string, 'north' | 'south' | 'east' | 'west'> {
    const assignment = new Map<string, 'north' | 'south' | 'east' | 'west'>();
    const usedDirections = new Set<'north' | 'south' | 'east' | 'west'>();
    const usedNeighbors = new Set<string>();
    const cardinalAngles: Record<string, number> = {
      east: 0,
      south: Math.PI / 2,
      west: Math.PI,
      north: (3 * Math.PI) / 2,
    };
    const cardinalDirections: ('east' | 'south' | 'west' | 'north')[] = [
      'east',
      'south',
      'west',
      'north',
    ];

    const candidates: {
      neighborId: string;
      direction: 'north' | 'south' | 'east' | 'west';
      cost: number;
    }[] = [];

    sortedNeighbors.forEach((neighbor) => {
      cardinalDirections.forEach((direction) => {
        const cost = this.calculateAngularDisplacement(neighbor.angle, cardinalAngles[direction]);
        candidates.push({ neighborId: neighbor.id, direction, cost });
      });
    });

    candidates.sort((a, b) => a.cost - b.cost);

    for (const { neighborId, direction } of candidates) {
      if (usedNeighbors.has(neighborId) || usedDirections.has(direction)) {
        continue;
      }
      assignment.set(neighborId, direction);
      usedNeighbors.add(neighborId);
      usedDirections.add(direction);
    }

    return assignment;
  }

  /**
   * Validate complete assignment against both HOLA topology constraints
   * Checks sign constraints for each neighbor and cyclic order for the entire set
   */
  private validateCompleteAssignment(
    centerNodeId: string,
    assignment: Map<string, 'north' | 'south' | 'east' | 'west'>,
    sortedNeighbors: { id: string; angle: number }[]
  ): boolean {
    const centerNode = this.nodes.get(centerNodeId)!;

    for (const [neighborId, direction] of assignment.entries()) {
      const neighborNode = this.nodes.get(neighborId)!;
      if (!this.validateSignConstraints(neighborNode, centerNode, direction)) {
        return false;
      }
    }

    if (!this.validateCyclicOrder(assignment, sortedNeighbors)) {
      if (typeof process !== 'undefined' && process.env?.DEBUG_HOLA) {
        // const neighborIds = [...assignment.keys()].join(', ');
      }
      return false;
    }

    return true;
  }

  /**
   * Fallback: find maximal valid subset when complete assignment fails validation
   * Tries to assign each neighbor to a valid cardinal direction that satisfies constraints
   * Neighbors without valid assignments remain at stress-optimized positions
   */
  private findMaximalValidAssignment(
    centerNodeId: string,
    sortedNeighbors: { id: string; angle: number }[]
  ): Map<string, 'north' | 'south' | 'east' | 'west'> {
    const assignment = new Map();
    const usedDirections = new Set<string>();
    const cardinalAngles: Record<string, number> = {
      east: 0,
      south: Math.PI / 2,
      west: Math.PI,
      north: (3 * Math.PI) / 2,
    };
    const centerNode = this.nodes.get(centerNodeId)!;

    for (const neighbor of sortedNeighbors) {
      const neighborNode = this.nodes.get(neighbor.id)!;
      let assigned = false;

      const cardinalDirections: ('east' | 'south' | 'west' | 'north')[] = [
        'east',
        'south',
        'west',
        'north',
      ];
      cardinalDirections.sort(
        (a, b) =>
          this.calculateAngularDisplacement(neighbor.angle, cardinalAngles[a]) -
          this.calculateAngularDisplacement(neighbor.angle, cardinalAngles[b])
      );

      for (const direction of cardinalDirections) {
        if (usedDirections.has(direction)) {
          continue;
        }

        if (!this.validateSignConstraints(neighborNode, centerNode, direction)) {
          log.debug(
            `[HOLA] findMaximalValidAssignment(${centerNodeId}) | neighbor=${neighbor.id} direction=${direction} REJECTED by signConstraints`
          );
          continue;
        }

        const testAssignment = new Map(assignment);
        testAssignment.set(neighbor.id, direction);

        if (
          this.validateCyclicOrder(
            testAssignment,
            sortedNeighbors,
            `${centerNodeId}:${neighbor.id}→${direction}`
          )
        ) {
          assignment.set(neighbor.id, direction);
          usedDirections.add(direction);
          assigned = true;
          log.debug(
            `[HOLA] findMaximalValidAssignment(${centerNodeId}) | neighbor=${neighbor.id} direction=${direction} ACCEPTED → assignment now [${[...assignment.entries()].map(([n, d]) => `${n}→${d}`).join(', ')}]`
          );
          break;
        } else {
          log.debug(
            `[HOLA] findMaximalValidAssignment(${centerNodeId}) | neighbor=${neighbor.id} direction=${direction} REJECTED by cyclicOrder (current: [${[...assignment.entries()].map(([n, d]) => `${n}→${d}`).join(', ')}])`
          );
        }
      }

      if (!assigned) {
        log.warn(
          `[HOLA] findMaximalValidAssignment(${centerNodeId}) | neighbor=${neighbor.id} UNASSIGNED — no valid direction found (usedDirs=[${[...usedDirections].join(',')}])`
        );
      }
    }

    return assignment;
  }

  private getUniformEdgeLength(): number {
    return this.uniformEdgeLength;
  }
  private isEdgeLabelRelated(edge: Edge): boolean {
    if (edge.id && (edge.id.includes('to-label') || edge.id.includes('from-label'))) {
      return true;
    }

    const startNode = edge.start ? this.nodes.get(edge.start) : null;
    const endNode = edge.end ? this.nodes.get(edge.end) : null;

    if (
      startNode &&
      ((startNode as any).isLabelNode === true || (startNode as any).isEdgeLabel === true)
    ) {
      return true;
    }

    if (
      endNode &&
      ((endNode as any).isLabelNode === true || (endNode as any).isEdgeLabel === true)
    ) {
      return true;
    }

    return false;
  }
  private sortEdgesByPriority(): Edge[] {
    return [...this.edges].sort((a, b) => {
      const aIsLabelEdge = this.isEdgeLabelRelated(a);
      const bIsLabelEdge = this.isEdgeLabelRelated(b);

      if (!aIsLabelEdge && bIsLabelEdge) {
        return -1;
      }
      if (aIsLabelEdge && !bIsLabelEdge) {
        return 1;
      }

      return 0;
    });
  }
  /**
   * Ensure ALL edges become orthogonal (horizontal or vertical).
   * For each edge, ensure both nodes are aligned either vertically (same X) or horizontally (same Y).
   * Simple rule: if d// x less than dy, align vertically (same X), el// se align horizontally (same Y).
   */
  orthogonalizeAllEdges(): void {
    log.debug(
      `[HOLA] orthogonalizeAllEdges start | nodes=${this.nodes.size} edges=${this.edges.length} chains=${this.chains.length}`
    );

    this.configureNodes();
    log.debug(`[HOLA] configureNodes done | anchorConstraints=${this.anchorConstraints.size}`);

    this.performPostAlignmentStressRelaxation();
    log.debug(`[HOLA] stress relaxation #1 done`);

    this.prePositionAnchorNeighbors();

    this.configureChains();
    log.debug(
      `[HOLA] configureChains done | anchorConstraints=${this.anchorConstraints.size} chainConstraints=${this.chainConstraints.length}`
    );

    this.applyGridAlignmentConstraints();

    this.alignUncoveredEdges();

    this.performPostAlignmentStressRelaxation();
  }

  configureChains(): void {
    const cycles = this.chains.filter((c) => c.isCycle).length;
    const paths = this.chains.length - cycles;
    log.debug(
      `[HOLA] configureChains | total=${this.chains.length} paths=${paths} cycles=${cycles}`
    );
    this.chains.forEach((chain) => {
      if (chain.isCycle) {
        this.configureCycle(chain);
      } else {
        this.configureChain(chain);
      }
    });
  }

  private configureChain(chain: Chain): void {
    const startNode = this.nodes.get(chain.startNode);
    const endNode = this.nodes.get(chain.endNode);

    if (!startNode || !endNode) {
      return;
    }

    if (chain.nodes.length === 0) {
      this.routeDirectEdge(startNode, endNode);
      return;
    }

    const firstChainNodeId = chain.nodes[0];
    const lastChainNodeId = chain.nodes[chain.nodes.length - 1];
    const isSingleNodeChain = chain.nodes.length === 1;
    const startConstrained = isSingleNodeChain
      ? this.getConstrainedDirection(startNode, firstChainNodeId)
      : this.alignmentConstraints.find(
          (c) => c.nodeId === firstChainNodeId && c.alignTo === startNode.id
        )?.direction;
    const endConstrained = isSingleNodeChain
      ? this.getConstrainedDirection(endNode, lastChainNodeId)
      : this.alignmentConstraints.find(
          (c) => c.nodeId === lastChainNodeId && c.alignTo === endNode.id
        )?.direction;

    const startCandidates: ('north' | 'south' | 'east' | 'west' | undefined)[] = startConstrained
      ? [startConstrained]
      : this.getCandidateDirections(startNode, firstChainNodeId);

    let endCandidates: ('north' | 'south' | 'east' | 'west' | undefined)[] = endConstrained
      ? [endConstrained]
      : this.getCandidateDirections(endNode, lastChainNodeId);

    if (startConstrained && endConstrained) {
      const isStartH = startConstrained === 'east' || startConstrained === 'west';
      const isEndH = endConstrained === 'east' || endConstrained === 'west';
      if (isStartH === isEndH) {
        const geoCandidates = this.getCandidateDirections(endNode, lastChainNodeId);
        endCandidates = [...new Set([...endCandidates, ...geoCandidates])];
      }
    }

    let bestSequence: BendPoint[] = [];
    let minCost = Infinity;

    for (const sd of startCandidates) {
      for (const ed of endCandidates) {
        const sequence = this.findOptimalBendSequence(chain, startNode, endNode, sd, ed);
        const cost = this.evaluateBendSequenceCostWith45DegreePreference(
          chain,
          sequence,
          startNode,
          endNode
        );
        if (cost < minCost) {
          minCost = cost;
          bestSequence = sequence;
        }
      }
    }

    log.debug(
      `[HOLA] configureChain(${chain.startNode}→${chain.endNode}) | chainNodes=${chain.nodes.length} startDir=${startCandidates.join('|')} endDir=${endCandidates.join('|')} bends=${bestSequence.length} cost=${minCost.toFixed(2)}`
    );
    this.applyBendSequence(chain, bestSequence);
  }

  /**
   * HOLA Theory Compliance: Respect existing alignments when determining endpoint directions.
   * Returns the constrained direction if one exists, or undefined if unconstrained.
   * "if the connections at u and w have already been aligned by the node configuration step"
   */
  private getConstrainedDirection(
    fromNode: NodeWithPosition,
    toNodeId: string
  ): 'north' | 'south' | 'east' | 'west' | undefined {
    const existingConstraint = this.alignmentConstraints.find(
      (constraint) =>
        (constraint.nodeId === toNodeId && constraint.alignTo === fromNode.id) ||
        (constraint.nodeId === fromNode.id && constraint.alignTo === toNodeId)
    );
    if (existingConstraint) {
      return existingConstraint.direction;
    }

    return this.chainNodeDirections.get(fromNode.id)?.get(toNodeId);
  }

  /**
   * Returns the two possible exit directions (horizontal and vertical) for an unconstrained
   * endpoint, based on the relative position of the target node.
   */
  private getCandidateDirections(
    fromNode: NodeWithPosition,
    toNodeId: string
  ): ('north' | 'south' | 'east' | 'west')[] {
    const toNode = this.nodes.get(toNodeId)!;
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const horizontal: 'east' | 'west' = dx >= 0 ? 'east' : 'west';
    const vertical: 'south' | 'north' = dy >= 0 ? 'south' : 'north';
    return [horizontal, vertical];
  }

  private routeDirectEdge(startNode: NodeWithPosition, endNode: NodeWithPosition): void {
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      endNode.y = startNode.y;
      const direction = dx >= 0 ? 'east' : 'west';
      log.debug(
        `[HOLA] routeDirectEdge(${startNode.id}→${endNode.id}) | direction=${direction} dx=${dx.toFixed(1)} dy=${dy.toFixed(1)}`
      );
      this.anchorConstraints.set(endNode.id, {
        nodeId: endNode.id,
        direction,
        alignTo: startNode.id,
      });
    } else {
      endNode.x = startNode.x;
      const direction = dy >= 0 ? 'south' : 'north';
      log.debug(
        `[HOLA] routeDirectEdge(${startNode.id}→${endNode.id}) | direction=${direction} dx=${dx.toFixed(1)} dy=${dy.toFixed(1)}`
      );
      this.anchorConstraints.set(endNode.id, {
        nodeId: endNode.id,
        direction,
        alignTo: startNode.id,
      });
    }
  }

  /**
   * After chain configuration, some edges connect a chain endpoint node (degree-2, positioned
   * by a chain) directly to an anchor without going through a chain's nodes list. These edges
   * were never made orthogonal by configureChain. Snap the non-anchor endpoint onto the
   * anchor's axis so the edge becomes horizontal or vertical.
   */
  private alignUncoveredEdges(): void {
    const chainIntermediates = new Set<string>();
    this.chains.forEach((chain) => chain.nodes.forEach((n) => chainIntermediates.add(n)));

    this.edges.forEach((edge) => {
      if (!edge.start || !edge.end) {
        return;
      }
      const a = this.nodes.get(edge.start);
      const b = this.nodes.get(edge.end);
      if (!a || !b) {
        return;
      }

      const aIsAnchor = this.getDegree(edge.start) >= 3;
      const bIsAnchor = this.getDegree(edge.end) >= 3;

      if (
        (aIsAnchor && bIsAnchor) ||
        chainIntermediates.has(edge.start) ||
        chainIntermediates.has(edge.end)
      ) {
        return;
      }

      if (Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1) {
        return;
      }

      if (aIsAnchor) {
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        if (dx <= dy) {
          b.x = a.x;
        } else {
          b.y = a.y;
        }
        log.debug(
          `[HOLA] alignUncoveredEdges | snapped ${edge.end} to anchor ${edge.start} → pos=(${b.x.toFixed(1)},${b.y.toFixed(1)})`
        );
      } else if (bIsAnchor) {
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        if (dx <= dy) {
          a.x = b.x;
        } else {
          a.y = b.y;
        }
        log.debug(
          `[HOLA] alignUncoveredEdges | snapped ${edge.start} to anchor ${edge.end} → pos=(${a.x.toFixed(1)},${a.y.toFixed(1)})`
        );
      }
    });
  }

  /**
   * Before configureChains runs, snap degree-2 chain endpoint nodes that are direct neighbors
   * of anchors onto the anchor's axis according to the direction stored in chainNodeDirections.
   * This ensures chain routing sees the correct target position for those nodes so the path
   * from the chain's interior to the endpoint is orthogonal.
   */
  private prePositionAnchorNeighbors(): void {
    const anchorCount = new Map<string, number>();
    this.chainNodeDirections.forEach((neighborMap) => {
      neighborMap.forEach((_, neighborId) => {
        anchorCount.set(neighborId, (anchorCount.get(neighborId) ?? 0) + 1);
      });
    });

    const chainInteriorNodes = new Set<string>();
    this.chains.forEach((chain) => chain.nodes.forEach((n) => chainInteriorNodes.add(n)));

    this.chainNodeDirections.forEach((neighborMap, anchorId) => {
      const anchor = this.nodes.get(anchorId);
      if (!anchor) {
        return;
      }
      neighborMap.forEach((direction, neighborId) => {
        if ((anchorCount.get(neighborId) ?? 0) > 1) {
          log.debug(
            `[HOLA] prePositionAnchorNeighbors | SKIP ${neighborId} (shared by ${anchorCount.get(neighborId)} anchors — handled by configureChain)`
          );
          return;
        }
        if (chainInteriorNodes.has(neighborId)) {
          log.debug(
            `[HOLA] prePositionAnchorNeighbors | SKIP ${neighborId} (chain interior node — placed by applyBendSequence)`
          );
          return;
        }
        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) {
          return;
        }
        const spacing = this.getUniformEdgeLength();
        switch (direction) {
          case 'north':
            neighbor.x = anchor.x;
            neighbor.y = anchor.y - spacing;
            break;
          case 'south':
            neighbor.x = anchor.x;
            neighbor.y = anchor.y + spacing;
            break;
          case 'east':
            neighbor.x = anchor.x + spacing;
            neighbor.y = anchor.y;
            break;
          case 'west':
            neighbor.x = anchor.x - spacing;
            neighbor.y = anchor.y;
            break;
        }
        this.prePositionedNodes.add(neighborId);
        log.debug(
          `[HOLA] prePositionAnchorNeighbors | ${neighborId} fully placed ${direction} of anchor ${anchorId} → pos=(${neighbor.x.toFixed(1)},${neighbor.y.toFixed(1)})`
        );
      });
    });
  }

  /**
   * HOLA Theory Requirement 31: Greedy bend placement algorithm with 45° slope optimization
   * "HOLA's strategy measures the slope of segments: an edge whose current slope is ±1 (45°)
   * is a natural place for a 90° bend"
   */
  private findOptimalBendSequence(
    chain: Chain,
    startNode: NodeWithPosition,
    endNode: NodeWithPosition,
    startDirection?: 'north' | 'south' | 'east' | 'west',
    endDirection?: 'north' | 'south' | 'east' | 'west'
  ): BendPoint[] {
    const possibleSequences = this.generateMinimalBendSequences(
      startNode,
      endNode,
      startDirection,
      endDirection
    );

    let bestSequence: BendPoint[] = [];
    let minCost = Infinity;

    possibleSequences.forEach((sequence) => {
      const totalCost = this.evaluateBendSequenceCostWith45DegreePreference(
        chain,
        sequence,
        startNode,
        endNode
      );
      if (totalCost < minCost) {
        minCost = totalCost;
        bestSequence = sequence;
      }
    });

    return bestSequence;
  }

  /**
   * HOLA Theory: Generate minimal bend sequences (RRL, LLR patterns) per requirement.txt
   * "there is a limited set of possible minimal bend sequences to connect u to w orthogonally"
   * Complete enumeration of all minimal bend patterns as required by theory
   */
  private generateMinimalBendSequences(
    startNode: NodeWithPosition,
    endNode: NodeWithPosition,
    startDirection?: 'north' | 'south' | 'east' | 'west',
    endDirection?: 'north' | 'south' | 'east' | 'west'
  ): BendPoint[][] {
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const edgeLength = this.getUniformEdgeLength();

    if (Math.abs(dx) < 1e-6 || Math.abs(dy) < 1e-6) {
      return [[]];
    }

    const sequences: BendPoint[][] = [];

    if (startDirection && endDirection) {
      sequences.push(
        ...this.generateDirectionalBendSequences(startNode, endNode, startDirection, endDirection)
      );
    } else {
      const lShapedSequences = [
        [
          {
            position: { x: endNode.x, y: startNode.y },
            cost: 0,
          },
        ],
        [
          {
            position: { x: startNode.x, y: endNode.y },
            cost: 0,
          },
        ],
      ];

      sequences.push(...lShapedSequences);

      if (Math.abs(dx) > edgeLength && Math.abs(dy) > edgeLength) {
        const completeBendSequences = [
          [
            { position: { x: startNode.x + Math.abs(dx) * 0.5, y: startNode.y }, cost: 0 },
            { position: { x: startNode.x + Math.abs(dx) * 0.5, y: endNode.y }, cost: 0 },
          ],
          [
            { position: { x: startNode.x, y: startNode.y + Math.abs(dy) * 0.5 }, cost: 0 },
            { position: { x: endNode.x, y: startNode.y + Math.abs(dy) * 0.5 }, cost: 0 },
          ],
          [
            { position: { x: startNode.x + Math.abs(dx) * 0.33, y: startNode.y }, cost: 0 },
            {
              position: {
                x: startNode.x + Math.abs(dx) * 0.33,
                y: startNode.y + Math.abs(dy) * 0.67,
              },
              cost: 0,
            },
            { position: { x: endNode.x, y: startNode.y + Math.abs(dy) * 0.67 }, cost: 0 },
          ],
          [
            { position: { x: startNode.x, y: startNode.y + Math.abs(dy) * 0.33 }, cost: 0 },
            {
              position: {
                x: startNode.x + Math.abs(dx) * 0.67,
                y: startNode.y + Math.abs(dy) * 0.33,
              },
              cost: 0,
            },
            { position: { x: startNode.x + Math.abs(dx) * 0.67, y: endNode.y }, cost: 0 },
          ],
          [
            { position: { x: startNode.x + Math.abs(dx) * 0.67, y: startNode.y }, cost: 0 },
            {
              position: {
                x: startNode.x + Math.abs(dx) * 0.67,
                y: startNode.y + Math.abs(dy) * 0.33,
              },
              cost: 0,
            },
            { position: { x: endNode.x, y: startNode.y + Math.abs(dy) * 0.33 }, cost: 0 },
          ],
          [
            { position: { x: startNode.x, y: startNode.y + Math.abs(dy) * 0.67 }, cost: 0 },
            {
              position: {
                x: startNode.x + Math.abs(dx) * 0.33,
                y: startNode.y + Math.abs(dy) * 0.67,
              },
              cost: 0,
            },
            { position: { x: startNode.x + Math.abs(dx) * 0.33, y: endNode.y }, cost: 0 },
          ],
        ];

        sequences.push(...completeBendSequences);
      }
    }

    return sequences;
  }

  /**
   * Generate bend sequences based on specific start and end directions
   */
  private generateDirectionalBendSequences(
    startNode: NodeWithPosition,
    endNode: NodeWithPosition,
    startDirection: 'north' | 'south' | 'east' | 'west',
    endDirection: 'north' | 'south' | 'east' | 'west'
  ): BendPoint[][] {
    const sequences: BendPoint[][] = [];

    let startExit: Position;
    let endEntry: Position;

    const edgeLength = this.getUniformEdgeLength();
    switch (startDirection) {
      case 'north':
        startExit = { x: startNode.x, y: startNode.y - edgeLength };
        break;
      case 'south':
        startExit = { x: startNode.x, y: startNode.y + edgeLength };
        break;
      case 'east':
        startExit = { x: startNode.x + edgeLength, y: startNode.y };
        break;
      case 'west':
        startExit = { x: startNode.x - edgeLength, y: startNode.y };
        break;
    }

    switch (endDirection) {
      case 'north':
        endEntry = { x: endNode.x, y: endNode.y - edgeLength };
        break;
      case 'south':
        endEntry = { x: endNode.x, y: endNode.y + edgeLength };
        break;
      case 'east':
        endEntry = { x: endNode.x + edgeLength, y: endNode.y };
        break;
      case 'west':
        endEntry = { x: endNode.x - edgeLength, y: endNode.y };
        break;
    }

    if (Math.abs(startExit.x - endEntry.x) < 1e-6) {
      sequences.push([]);
    } else if (Math.abs(startExit.y - endEntry.y) < 1e-6) {
      sequences.push([]);
    } else {
      sequences.push(
        [{ position: { x: endEntry.x, y: startExit.y }, cost: 0 }],
        [{ position: { x: startExit.x, y: endEntry.y }, cost: 0 }]
      );

      if (startDirection === endDirection) {
        const isStartH = startDirection === 'east' || startDirection === 'west';
        if (isStartH) {
          const midY = (startExit.y + endEntry.y) / 2;
          sequences.push([
            { position: { x: startExit.x, y: midY }, cost: 0 },
            { position: { x: endEntry.x, y: midY }, cost: 0 },
          ]);
        } else {
          const midX = (startExit.x + endEntry.x) / 2;
          sequences.push([
            { position: { x: midX, y: startExit.y }, cost: 0 },
            { position: { x: midX, y: endEntry.y }, cost: 0 },
          ]);
        }
      }
    }

    return sequences;
  }

  /**
   * HOLA Theory: Calculate cost based on deviation from 45° slopes per requirement.txt
   * "The cost of introducing a bend at a given edge or node is defined as an increasing function
   * of how far its current slope/angle deviates from a perfect ±1 (45°) slope"
   */
  private evaluateBendSequenceCostWith45DegreePreference(
    chain: Chain,
    bendSequence: BendPoint[],
    startNode: NodeWithPosition,
    endNode: NodeWithPosition
  ): number {
    let totalCost = 0;

    const pathPoints = [startNode, ...bendSequence.map((bp) => bp.position), endNode];

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const segmentCost = this.calculateSegmentSlopeDeviationCost(pathPoints[i], pathPoints[i + 1]);
      totalCost += segmentCost;
    }

    totalCost += bendSequence.length * 0.5;

    if (chain.nodes.length > 0) {
      totalCost += this.calculateChainNodePlacementCost(chain, pathPoints);
    }

    return totalCost;
  }

  /**
   * Cost for a path segment when choosing between bend layout options.
   * We prefer perfectly axis-aligned segments (horizontal or vertical) since
   * HOLA produces an orthogonal layout. A segment that is exactly horizontal
   * or vertical costs 0; deviation toward 45° (diagonal) is penalised.
   */
  private calculateSegmentSlopeDeviationCost(point1: Position, point2: Position): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    if (Math.abs(dx) < 1e-6) {
      return 0;
    }
    if (Math.abs(dy) < 1e-6) {
      return 0;
    }

    const absSlope = Math.abs(dy / dx);
    const deviation = 1 - Math.abs(1 - absSlope) / (1 + absSlope);
    return deviation * 4.0;
  }

  /**
   * Calculate cost for placing intermediate chain nodes along the path
   */
  private calculateChainNodePlacementCost(chain: Chain, pathPoints: Position[]): number {
    if (chain.nodes.length === 0) {
      return 0;
    }

    let placementCost = 0;

    chain.nodes.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId)!;

      let minDeviationCost = Infinity;

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const segmentStart = pathPoints[i];
        const segmentEnd = pathPoints[i + 1];

        const ratio = (index + 1) / (chain.nodes.length + 1);
        const optimalPos = {
          x: segmentStart.x + ratio * (segmentEnd.x - segmentStart.x),
          y: segmentStart.y + ratio * (segmentEnd.y - segmentStart.y),
        };

        const distance = Math.sqrt(
          Math.pow(node.x - optimalPos.x, 2) + Math.pow(node.y - optimalPos.y, 2)
        );

        minDeviationCost = Math.min(minDeviationCost, distance / 100);
      }

      placementCost += minDeviationCost;
    });

    return placementCost;
  }

  private applyBendSequence(chain: Chain, bendPoints: BendPoint[]): void {
    if (chain.nodes.length === 0 || bendPoints.length === 0) {
      return;
    }

    const startNode = this.nodes.get(chain.startNode)!;
    const endNode = this.nodes.get(chain.endNode)!;
    log.debug(
      `[HOLA] applyBendSequence(${chain.startNode}→${chain.endNode}) | chainNodes=${chain.nodes.length} bends=${bendPoints.length} bendPositions=[${bendPoints.map((b) => `(${b.position.x.toFixed(1)},${b.position.y.toFixed(1)})`).join(',')}]`
    );

    const allPoints: (NodeWithPosition | { x: number; y: number; id?: string })[] = [
      startNode,
      ...bendPoints.map((bp) => bp.position),
      endNode,
    ];

    const totalNodes = chain.nodes.length;

    chain.nodes.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId)!;

      if (totalNodes <= bendPoints.length) {
        node.x = bendPoints[index].position.x;
        node.y = bendPoints[index].position.y;
      } else {
        if (index < bendPoints.length) {
          node.x = bendPoints[index].position.x;
          node.y = bendPoints[index].position.y;
        } else {
          const lastBend = allPoints[bendPoints.length];
          const lastPoint = allPoints[allPoints.length - 1];
          const remaining = totalNodes - bendPoints.length;
          const posInSegment = index - bendPoints.length + 1;
          const ratio = posInSegment / (remaining + 1);

          const dx = lastPoint.x - lastBend.x;
          const dy = lastPoint.y - lastBend.y;
          const isHorizontal = Math.abs(dx) >= Math.abs(dy);

          if (isHorizontal) {
            node.y = lastBend.y;
            node.x = lastBend.x + ratio * dx;
          } else {
            node.x = lastBend.x;
            node.y = lastBend.y + ratio * dy;
          }
        }
      }
    });

    const chainNodeSet = new Set(chain.nodes);
    const orderedNodeIds = [chain.startNode, ...chain.nodes, chain.endNode];
    for (let i = 0; i < orderedNodeIds.length - 1; i++) {
      const aId = orderedNodeIds[i];
      const bId = orderedNodeIds[i + 1];
      const a = this.nodes.get(aId)!;
      const b = this.nodes.get(bId)!;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const isHorizontal = Math.abs(dx) >= Math.abs(dy);
      const bIsChainIntermediate = chainNodeSet.has(bId) || this.prePositionedNodes.has(bId);

      if (isHorizontal) {
        const direction = dx >= 0 ? 'east' : 'west';
        if (bIsChainIntermediate) {
          this.chainConstraints.push({ nodeId: bId, direction, alignTo: aId, axisOnly: true });
        } else {
          this.anchorConstraints.set(bId, { nodeId: bId, direction, alignTo: aId });
        }
      } else {
        const direction = dy >= 0 ? 'south' : 'north';
        if (bIsChainIntermediate) {
          this.chainConstraints.push({ nodeId: bId, direction, alignTo: aId, axisOnly: true });
        } else {
          this.anchorConstraints.set(bId, { nodeId: bId, direction, alignTo: aId });
        }
      }
    }
  }

  /**
   * HOLA Extension: Configure degree-2 cycles for grid alignment
   * Handles cycles where all nodes have degree 2 and form a closed loop.
   * Applies "projection onto alignment constraints" per requirement.txt line 31.
   */
  private configureCycle(chain: Chain): void {
    if (chain.nodes.length < 3) {
      return;
    }

    const gridSize = this.getUniformEdgeLength();
    const n = chain.nodes.length;

    if (n === 3) {
      this.configureTriangleCycle(chain, gridSize);
    } else if (n === 4) {
      this.configureQuadrilateralCycle(chain, gridSize);
    } else {
      this.configureLargeCycle(chain, gridSize);
    }
  }

  /**
   * Configure 3-node triangle cycle in L-shape
   */
  private configureTriangleCycle(chain: Chain, gridSize: number): void {
    const nodes = chain.nodes.map((id) => this.nodes.get(id)!);

    nodes[1].x = nodes[0].x + gridSize;
    nodes[1].y = nodes[0].y;

    nodes[2].x = nodes[0].x;
    nodes[2].y = nodes[0].y + gridSize;
  }

  /**
   * Configure 4-node cycle - detect if rectangular and arrange in 2x2 grid
   */
  private configureQuadrilateralCycle(chain: Chain, gridSize: number): void {
    const nodeIds = chain.nodes;
    const nodes = nodeIds.map((id) => this.nodes.get(id)!);

    const cycleAdj = new Map<string, string[]>();
    nodeIds.forEach((id) => {
      cycleAdj.set(id, this.adjacencyList.get(id)?.filter((n) => nodeIds.includes(n)) ?? []);
    });

    const isRectangular = this.detectRectangularStructure(nodeIds, cycleAdj);

    if (isRectangular) {
      this.arrangeRectangularCycle(nodeIds, nodes, cycleAdj, gridSize);
    } else {
      this.configureLargeCycle(chain, gridSize);
    }
  }

  /**
   * Detect if 4 nodes form a rectangular structure
   * Rectangle: each node connects to exactly 2 others, and opposite corners don't connect
   */
  private detectRectangularStructure(nodeIds: string[], cycleAdj: Map<string, string[]>): boolean {
    if (nodeIds.length !== 4) {
      return false;
    }

    for (const id of nodeIds) {
      if (cycleAdj.get(id)?.length !== 2) {
        return false;
      }
    }

    for (let i = 0; i < 4; i++) {
      const n0 = nodeIds[i];
      const n1 = nodeIds[(i + 1) % 4];
      const n2 = nodeIds[(i + 2) % 4];
      const n3 = nodeIds[(i + 3) % 4];

      const adj0 = cycleAdj.get(n0) ?? [];
      const adj2 = cycleAdj.get(n2) ?? [];

      if (adj0.includes(n1) && adj0.includes(n3) && !adj0.includes(n2) && !adj2.includes(n0)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Arrange 4 nodes in a rectangular 2x2 grid ensuring edges are orthogonal
   */
  private arrangeRectangularCycle(
    nodeIds: string[],
    nodes: NodeWithPosition[],
    cycleAdj: Map<string, string[]>,
    gridSize: number
  ): void {
    let cornerIdx = -1;
    for (let i = 0; i < 4; i++) {
      const n0 = nodeIds[i];
      const n1 = nodeIds[(i + 1) % 4];
      const n2 = nodeIds[(i + 2) % 4];
      const n3 = nodeIds[(i + 3) % 4];

      const adj0 = cycleAdj.get(n0) ?? [];

      if (adj0.includes(n1) && adj0.includes(n3) && !adj0.includes(n2)) {
        cornerIdx = i;
        break;
      }
    }

    if (cornerIdx === -1) {
      this.configureLargeCycle(
        {
          nodes: nodeIds,
          startNode: nodeIds[0],
          endNode: nodeIds[nodeIds.length - 1],
          isCycle: true,
        },
        gridSize
      );
      return;
    }

    const n0Idx = cornerIdx;
    const n1Idx = (cornerIdx + 1) % 4;
    const n2Idx = (cornerIdx + 2) % 4;
    const n3Idx = (cornerIdx + 3) % 4;

    const anchor = nodes[n0Idx];

    nodes[n1Idx].x = anchor.x + gridSize;
    nodes[n1Idx].y = anchor.y;

    nodes[n3Idx].x = anchor.x;
    nodes[n3Idx].y = anchor.y + gridSize;

    nodes[n2Idx].x = anchor.x + gridSize;
    nodes[n2Idx].y = anchor.y + gridSize;
  }

  /**
   * Configure cycles with 5+ nodes in rectangular grid pattern
   */
  private configureLargeCycle(chain: Chain, gridSize: number): void {
    const nodes = chain.nodes.map((id) => this.nodes.get(id)!);
    const n = nodes.length;

    const anchorNode = nodes[0];
    const baseX = anchorNode.x;
    const baseY = anchorNode.y;

    let cols = Math.max(2, Math.ceil(Math.sqrt(n)));
    let rows = Math.max(2, Math.ceil(n / cols));

    if (rows === 1) {
      rows = 2;
    }

    if (cols === 1) {
      cols = 2;
    }

    const positions = this.generateCyclePerimeterPositions(rows, cols, n);

    nodes.forEach((node, index) => {
      const pos = positions[index];
      node.x = baseX + pos.x * gridSize;
      node.y = baseY + pos.y * gridSize;
    });
  }

  private generateCyclePerimeterPositions(rows: number, cols: number, count: number): Position[] {
    const coordinates: { col: number; row: number }[] = [];

    let top = 0;
    let bottom = rows - 1;
    let left = 0;
    let right = cols - 1;

    while (coordinates.length < count && top <= bottom && left <= right) {
      for (let col = left; col <= right && coordinates.length < count; col++) {
        coordinates.push({ col, row: top });
      }

      for (let row = top + 1; row <= bottom && coordinates.length < count; row++) {
        coordinates.push({ col: right, row });
      }

      if (bottom > top) {
        for (let col = right - 1; col >= left && coordinates.length < count; col--) {
          coordinates.push({ col, row: bottom });
        }
      }

      if (right > left) {
        for (let row = bottom - 1; row > top && coordinates.length < count; row--) {
          coordinates.push({ col: left, row });
        }
      }

      top++;
      bottom--;
      left++;
      right--;
    }

    return coordinates.map(({ col, row }) => ({ x: col, y: row }));
  }

  /**
   * Ensure all connected nodes are aligned either vertically (same X) or horizontally (same Y).
   * For each edge, align both nodes, then ensure minimum spacing on the non-aligned axis.
   */
  ensureEdgeBasedAlignment(): void {
    const alignmentTolerance = 1;
    const processedEdges = new Set<string>();

    this.edges.forEach((edge) => {
      if (!edge.start || !edge.end) {
        return;
      }

      const edgeKey = `${edge.start}-${edge.end}`;
      if (processedEdges.has(edgeKey)) {
        return;
      }
      processedEdges.add(edgeKey);

      const node1 = this.nodes.get(edge.start);
      const node2 = this.nodes.get(edge.end);
      if (!node1 || !node2) {
        return;
      }

      const dx = Math.abs(node2.x - node1.x);
      const dy = Math.abs(node2.y - node1.y);

      const isVerticallyAligned = dx < alignmentTolerance;
      const isHorizontallyAligned = dy < alignmentTolerance;

      if (isVerticallyAligned && isHorizontallyAligned) {
        const avgX = (node1.x + node2.x) / 2;
        const avgY = (node1.y + node2.y) / 2;
        node1.x = avgX;
        node2.x = avgX;
        node1.y = avgY;
        node2.y = avgY;
        this.ensureMinimumSpacing(node1, node2);
        return;
      }

      if (isVerticallyAligned) {
        const avgX = (node1.x + node2.x) / 2;
        node1.x = avgX;
        node2.x = avgX;
        this.ensureMinimumSpacing(node1, node2);
        return;
      }

      if (isHorizontallyAligned) {
        const avgY = (node1.y + node2.y) / 2;
        node1.y = avgY;
        node2.y = avgY;
        this.ensureMinimumSpacing(node1, node2);
        return;
      }

      if (dx <= dy) {
        const avgX = (node1.x + node2.x) / 2;
        node1.x = avgX;
        node2.x = avgX;
        this.ensureMinimumSpacing(node1, node2);
      } else {
        const avgY = (node1.y + node2.y) / 2;
        node1.y = avgY;
        node2.y = avgY;
        this.ensureMinimumSpacing(node1, node2);
      }
    });
  }

  /**
   * Ensure minimum spacing between two nodes based on their dimensions.
   * Adjusts positions to maintain proper spacing while preserving alignment.
   */
  private ensureMinimumSpacing(node1: NodeWithPosition, node2: NodeWithPosition): void {
    const dx = Math.abs(node2.x - node1.x);
    const dy = Math.abs(node2.y - node1.y);
    const alignmentTolerance = 1;

    const isVerticallyAligned = dx < alignmentTolerance;
    const isHorizontallyAligned = dy < alignmentTolerance;

    if (isVerticallyAligned && !isHorizontallyAligned) {
      const node1Height = node1.height ?? 40;
      const node2Height = node2.height ?? 40;
      const minSpacing = (node1Height + node2Height) / 2 + 0;
      const currentDy = Math.abs(node2.y - node1.y);

      if (currentDy < minSpacing) {
        const centerY = (node1.y + node2.y) / 2;
        node1.y = centerY - minSpacing / 2;
        node2.y = centerY + minSpacing / 2;
      }
    } else if (isHorizontallyAligned && !isVerticallyAligned) {
      const node1Width = node1.width ?? 60;
      const node2Width = node2.width ?? 60;
      const minSpacing = (node1Width + node2Width) / 2 + 0;
      const currentDx = Math.abs(node2.x - node1.x);

      if (currentDx < minSpacing) {
        const centerX = (node1.x + node2.x) / 2;
        node1.x = centerX - minSpacing / 2;
        node2.x = centerX + minSpacing / 2;
      }
    }
  }
  private gentleGridSnap(): void {
    const nodes = [...this.nodes.values()];
    if (nodes.length === 0) {
      return;
    }

    const padding = 0;
    const maxW = Math.max(...nodes.map((n) => (n.width ?? 60) + padding));
    const maxH = Math.max(...nodes.map((n) => (n.height ?? 40) + padding));

    const cellW = maxW;
    const cellH = maxH;

    const startX = Math.min(...nodes.map((n) => n.x));
    const startY = Math.min(...nodes.map((n) => n.y));

    const xTol = cellW * 5;
    const yTol = cellH * 5;

    nodes.forEach((node) => {
      const col = Math.round((node.x - startX) / cellW);
      const row = Math.round((node.y - startY) / cellH);

      const targetX = startX + col * cellW + cellW / 2;
      const targetY = startY + row * cellH + cellH / 2;

      if (Math.abs(node.x - targetX) > xTol) {
        node.x = targetX;
      }
      if (Math.abs(node.y - targetY) > yTol) {
        node.y = targetY;
      }
    });
  }
}
