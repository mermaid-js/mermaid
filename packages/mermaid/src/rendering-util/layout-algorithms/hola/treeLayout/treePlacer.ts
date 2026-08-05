/* eslint-disable @cspell/spellchecker */
import type { Node } from '../../../types.js';
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_PADDING,
  TREE_DIRECTION_ANGLE_THRESHOLD,
  TREE_NATURAL_GROWTH_ANGLE,
  TREE_PLACEMENT_MAX_ACCEPTABLE_STRESS,
  TREE_PLACEMENT_SCORE_EPSILON,
  TREE_PLACEMENT_STRESS_RELAX_CONVERGENCE,
  TREE_PLACEMENT_STRESS_RELAX_DAMPING,
  TREE_PLACEMENT_STRESS_RELAX_MAX_ITERATIONS,
} from '../Constants.js';
import type {
  Position,
  TreeNode,
  TreeEdge,
  TreeLayout,
  PlanarEdge,
  Face,
  PlanarizedCore,
  PlacementDirection,
  TreePlacement,
  PlacementCandidate,
  BoundingBox,
  RequiredSpace,
  AvailableSpace,
  ExpansionConstraints,
  DummyNode,
} from './types.js';

/**
 * Step 3c: Tree Placement Engine
 * Implements intelligent tree placement into core faces
 */
export class TreePlacer {
  private planarizedCore: PlanarizedCore;
  private treeLayouts: Map<string, TreeLayout>;
  private placedTrees = new Map<string, TreePlacement>();
  private favorCardinal = true;
  private favorExternal = true;
  private faces: Face[] = [];
  private uniformEdgeLength: number;

  // Cardinal and ordinal directions for placement
  // NOTE: Tree layouts grow South (downward) by default: root at (0,0), leaves at (0, +y)
  // Rotation angles transform the tree to grow in the specified direction:
  // - N (North/Up): 180° flip to make tree grow upward
  // - S (South/Down): 0° no rotation, tree already grows downward
  // - E (East/Right): -90° (90° clockwise) to rotate tree rightward
  // - W (West/Left): 90° (90° counter-clockwise) to rotate tree leftward
  private readonly directions: PlacementDirection[] = [
    { type: 'cardinal', name: 'N', angle: 180, vector: { x: 0, y: -1 } },
    { type: 'cardinal', name: 'S', angle: 0, vector: { x: 0, y: 1 } },
    { type: 'cardinal', name: 'E', angle: -90, vector: { x: 1, y: 0 } },
    { type: 'cardinal', name: 'W', angle: 90, vector: { x: -1, y: 0 } },
    { type: 'ordinal', name: 'NE', angle: -135, vector: { x: 0.707, y: -0.707 } },
    { type: 'ordinal', name: 'NW', angle: 135, vector: { x: -0.707, y: -0.707 } },
    { type: 'ordinal', name: 'SE', angle: -45, vector: { x: 0.707, y: 0.707 } },
    { type: 'ordinal', name: 'SW', angle: 45, vector: { x: -0.707, y: 0.707 } },
  ];

  /**
   * Initialize the Tree Placer with planarized core and pre-computed tree layouts.
   * Sets up placement preferences (cardinal and external face priorities) and
   * extracts face information from the planarized core structure.
   *
   * @param planarizedCore - The planarized core graph containing faces and nodes
   * @param treeLayouts - Map of tree IDs to their computed symmetric layouts
   */
  constructor(
    planarizedCore: PlanarizedCore,
    treeLayouts: Map<string, TreeLayout>,
    uniformEdgeLength: number
  ) {
    this.planarizedCore = planarizedCore;
    this.treeLayouts = treeLayouts;
    this.faces = [...planarizedCore.faces.values()];
    this.uniformEdgeLength = uniformEdgeLength;
  }

  /**
   * Main placement algorithm implementing Step 3c requirements
   * Enhanced to ensure proper tree distribution according to HOLA principles
   */
  placeTreesInFaces(): Map<string, TreePlacement> {
    const sortedTrees = this.sortTreesBySize();

    const usedFaces = new Set<string>();

    for (const [treeId, treeLayout] of sortedTrees) {
      const placement = this.placeSingleTreeWithDistribution(treeId, treeLayout, usedFaces);
      if (placement) {
        this.placedTrees.set(treeId, placement);
        this.applyTreePlacement(placement);
        usedFaces.add(placement.face.id);

        this.performStressRelaxation(treeId);
      } else {
        // log.trace(`Failed to place tree ${treeId} - no suitable face found`);
      }
    }

    return this.placedTrees;
  }

  /**
   * Sort trees by size (perimeter) - largest first per HOLA requirements
   */
  private sortTreesBySize(): [string, TreeLayout][] {
    const treeArray = [...this.treeLayouts.entries()];

    return treeArray.sort(([, layoutA], [, layoutB]) => {
      const perimeterA = 2 * (layoutA.boundingBox.width + layoutA.boundingBox.height);
      const perimeterB = 2 * (layoutB.boundingBox.width + layoutB.boundingBox.height);
      //return perimeterB - perimeterA;
      return perimeterA - perimeterB;
    });
  }

  /**
   * Place a single tree with distribution awareness to avoid same face placement
   * Implements HOLA Step 3c with enhanced distribution logic
   */
  private placeSingleTreeWithDistribution(
    treeId: string,
    treeLayout: TreeLayout,
    usedFaces: Set<string>
  ): TreePlacement | null {
    const coreNodeId = this.findCoreNodeForTree(treeId);
    if (!coreNodeId) {
      return null;
    }

    const candidateFaces = this.findAdjacentFaces(coreNodeId);

    const allCandidates = this.generateDistributedCandidates(
      candidateFaces,
      coreNodeId,
      treeLayout,
      usedFaces
    );

    const scoredCandidates = this.evaluateDistributedCandidates(
      allCandidates,
      treeLayout,
      coreNodeId,
      usedFaces
    );

    const bestCandidate = this.selectBestDistributedCandidate(scoredCandidates);

    if (!bestCandidate) {
      return null;
    }

    return this.createTreePlacement(treeId, bestCandidate, treeLayout, coreNodeId);
  }

  /**
   * Find core node ID that corresponds to a tree
   */
  private findCoreNodeForTree(treeId: string): string | null {
    const actualCoreNodeId = treeId.replace('_copy', '');
    const coreNode = this.planarizedCore.nodes.get(actualCoreNodeId);

    return coreNode ? actualCoreNodeId : null;
  }

  /**
   * Find faces adjacent to a core node
   */
  private findAdjacentFaces(coreNodeId: string): Face[] {
    return this.planarizedCore.faces.filter((face) => face.adjacentCoreNodes.includes(coreNodeId));
  }

  /**
   * Generate placement candidates with distribution awareness
   * Prioritizes unused faces and external face according to HOLA requirements
   */
  private generateDistributedCandidates(
    candidateFaces: Face[],
    coreNodeId: string,
    treeLayout: TreeLayout,
    usedFaces: Set<string>
  ): PlacementCandidate[] {
    const allCandidates: PlacementCandidate[] = [];

    const sortedFaces = candidateFaces.sort((a, b) => {
      const aUsed = usedFaces.has(a.id) ? 1 : 0;
      const bUsed = usedFaces.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) {
        return aUsed - bUsed;
      }

      const aExternal = a.isExternal ? 1 : 0;
      const bExternal = b.isExternal ? 1 : 0;
      if (aExternal !== bExternal) {
        return aExternal - bExternal;
      }

      return b.area - a.area;
    });

    for (const face of sortedFaces) {
      const faceCandidates = this.generateFaceCandidates(face, coreNodeId);
      allCandidates.push(...faceCandidates);
    }

    return allCandidates;
  }

  /**
   * Generate placement candidates for a face
   */
  private generateFaceCandidates(face: Face, coreNodeId: string): PlacementCandidate[] {
    const candidates: PlacementCandidate[] = [];
    const coreNodePos = this.getCoreNodePosition(coreNodeId);

    if (!coreNodePos) {
      return candidates;
    }

    const validDirections = this.getValidDirectionsForFace(face, coreNodePos);

    for (const placementDir of validDirections) {
      if (placementDir.type === 'cardinal') {
        const shouldFlip = this.shouldFlipTree(placementDir);
        const flipOptions = shouldFlip ? [true, false] : [false, true];

        for (const isFlipped of flipOptions) {
          candidates.push({
            face,
            placementDirection: placementDir,
            growthDirection: placementDir,
            isFlipped,
            score: 0,
            stressCost: 0,
            fitsInFace: false,
          });
        }
      } else {
        const growthOptions = this.getGrowthOptionsForOrdinal(placementDir);
        for (const growthDir of growthOptions) {
          const shouldFlip = this.shouldFlipTree(growthDir);
          const flipOptions = shouldFlip ? [true, false] : [false, true];

          for (const isFlipped of flipOptions) {
            candidates.push({
              face,
              placementDirection: placementDir,
              growthDirection: growthDir,
              isFlipped,
              score: 0,
              stressCost: 0,
              fitsInFace: false,
            });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Get valid placement directions for a face relative to core node
   */
  private getValidDirectionsForFace(face: Face, coreNodePos: Position): PlacementDirection[] {
    const validDirections: PlacementDirection[] = [];

    if (face.isExternal) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      this.planarizedCore.nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          sumX += node.x;
          sumY += node.y;
          count++;
        }
      });

      if (count === 0) {
        return [this.directions[0]];
      }

      const graphCenterX = sumX / count;
      const graphCenterY = sumY / count;

      const dx = coreNodePos.x - graphCenterX;
      const dy = coreNodePos.y - graphCenterY;

      this.directions.forEach((dir) => {
        const dotProduct = dx * dir.vector.x + dy * dir.vector.y;
        if (dotProduct > 0) {
          validDirections.push(dir);
        }
      });
    } else {
      const faceCenterX = (face.boundingBox.minX + face.boundingBox.maxX) / 2;
      const faceCenterY = (face.boundingBox.minY + face.boundingBox.maxY) / 2;

      const dx = faceCenterX - coreNodePos.x;
      const dy = faceCenterY - coreNodePos.y;

      this.directions.forEach((dir) => {
        const dotProduct = dx * dir.vector.x + dy * dir.vector.y;
        if (dotProduct > 0) {
          validDirections.push(dir);
        }
      });
    }

    return validDirections.length > 0 ? validDirections : [this.directions[0]]; // Fallback
  }

  /**
   * Get growth direction options for ordinal placement
   */
  private getGrowthOptionsForOrdinal(ordinalDir: PlacementDirection): PlacementDirection[] {
    const cardinalDirs = this.directions.filter((d) => d.type === 'cardinal');

    switch (ordinalDir.name) {
      case 'NE':
        return [
          cardinalDirs.find((d) => d.name === 'N')!,
          cardinalDirs.find((d) => d.name === 'E')!,
        ];
      case 'NW':
        return [
          cardinalDirs.find((d) => d.name === 'N')!,
          cardinalDirs.find((d) => d.name === 'W')!,
        ];
      case 'SE':
        return [
          cardinalDirs.find((d) => d.name === 'S')!,
          cardinalDirs.find((d) => d.name === 'E')!,
        ];
      case 'SW':
        return [
          cardinalDirs.find((d) => d.name === 'S')!,
          cardinalDirs.find((d) => d.name === 'W')!,
        ];
      default:
        return [cardinalDirs[0]];
    }
  }

  /**
   * Enhanced candidate evaluation with CORRECT lexicographic preference ordering
   * HOLA Theory : "HOLA gives highest priority to any available cardinal placement,
   * next priority to placements in the external face, and finally uses stress minimization
   * as a tiebreaker among equally preferred options"
   *
   * CORRECT PRIORITY ORDER:
   * 1. Cardinal directions (HIGHEST - mandatory preference)
   * 2. External face (SECOND - strong preference)
   * 3. Stress cost (THIRD - optimization tiebreaker)
   * 4. Distribution (FOURTH - bonus for spreading trees)
   */
  private evaluateDistributedCandidates(
    candidates: PlacementCandidate[],
    treeLayout: TreeLayout,
    coreNodeId: string,
    usedFaces: Set<string>
  ): PlacementCandidate[] {
    const coreNodePos = this.getCoreNodePosition(coreNodeId)!;

    return candidates.map((candidate) => {
      const fitsInFace = this.checkTreeFitsInFace(candidate, treeLayout, coreNodePos);
      candidate.fitsInFace = fitsInFace;

      if (!fitsInFace) {
        candidate.score = Infinity;
        return candidate;
      }

      const stressCost = this.calculateStressCost(candidate, treeLayout, coreNodePos);
      candidate.stressCost = stressCost;

      let priorityCategory = 0;
      let score = stressCost;

      if (this.favorCardinal && candidate.placementDirection.type === 'cardinal') {
        priorityCategory = 1000000;
        score = stressCost * 0.1;
      } else if (candidate.placementDirection.type === 'ordinal') {
        priorityCategory = 2000000;
        score = stressCost;
      }

      // HOLA Priority 2: External face
      if (this.favorExternal && candidate.face.isExternal) {
        score *= 0.3;
      } else {
        score *= 1.5;
      }

      // HOLA Priority 3: Stress minimization (already in score)

      // HOLA Priority 4 (BONUS): Distribution across faces
      if (!usedFaces.has(candidate.face.id)) {
        score *= 0.8;
      }

      const otherTreesNearSameCore = [...this.placedTrees.values()].filter(
        (placement) => placement.coreNodeId === coreNodeId
      ).length;
      if (otherTreesNearSameCore > 0) {
        score *= 1 + otherTreesNearSameCore * 0.1;
      }

      candidate.score = priorityCategory + score;
      return candidate;
    });
  }

  /**
   * Select best candidate with enhanced HOLA criteria prioritizing distribution
   */
  private selectBestDistributedCandidate(
    candidates: PlacementCandidate[]
  ): PlacementCandidate | null {
    const validCandidates = candidates.filter((c) => c.fitsInFace);

    if (validCandidates.length === 0) {
      return null;
    }

    validCandidates.sort((a, b) => {
      if (Math.abs(a.score - b.score) > TREE_PLACEMENT_SCORE_EPSILON) {
        return a.score - b.score;
      }

      if (a.placementDirection.type !== b.placementDirection.type) {
        if (a.placementDirection.type === 'cardinal') {
          return -1;
        }
        if (b.placementDirection.type === 'cardinal') {
          return 1;
        }
      }

      if (a.face.isExternal !== b.face.isExternal) {
        if (a.face.isExternal) {
          return -1;
        }
        if (b.face.isExternal) {
          return 1;
        }
      }

      return b.face.area - a.face.area;
    });

    return validCandidates[0];
  }

  /**
   * Evaluate candidates and assign scores (original method for compatibility)
   */
  private evaluateCandidates(
    candidates: PlacementCandidate[],
    _treeLayout: TreeLayout,
    coreNodeId: string
  ): PlacementCandidate[] {
    const _coreNodePos = this.getCoreNodePosition(coreNodeId)!;

    return candidates.map((candidate) => {
      const fitsInFace = this.checkTreeFitsInFace(candidate, _treeLayout, _coreNodePos);
      candidate.fitsInFace = fitsInFace;

      if (!fitsInFace) {
        candidate.score = Infinity;
        return candidate;
      }

      const stressCost = this.calculateStressCost(candidate, _treeLayout, _coreNodePos);
      candidate.stressCost = stressCost;

      let score = stressCost;

      if (this.favorCardinal && candidate.placementDirection.type === 'cardinal') {
        score *= 0.5;
      }

      if (this.favorExternal && candidate.face.isExternal) {
        score *= 0.7;
      }

      candidate.score = score;
      return candidate;
    });
  }

  /**
   * HOLA Theory: Full separation constraints with face expansion
   * Implements Step 3c requirement to expand faces when needed using separation constraints
   */
  private checkTreeFitsInFaceWithExpansion(
    candidate: PlacementCandidate,
    treeLayout: TreeLayout,
    _coreNodePos: Position
  ): { fits: boolean; expansionRequired: ExpansionConstraints; stressCost: number } {
    if (candidate.face.isExternal) {
      return {
        fits: true,
        expansionRequired: this.createZeroExpansionConstraints(),
        stressCost: 0,
      };
    }

    const treeBounds = this.calculateTreeBounds(treeLayout, candidate.placementDirection);

    const requiredSpace = this.calculateRequiredSpace(treeBounds, candidate.placementDirection);

    const availableSpace = this.calculateAvailableSpace(candidate.face);

    const expansionNeeded = this.calculateExpansionConstraints(
      requiredSpace,
      availableSpace,
      candidate.face,
      candidate.placementDirection
    );

    const stressCost = this.calculateExpansionStressCost(expansionNeeded, candidate.face);

    // Tree "fits" if expansion constraints are reasonable (not too disruptive)
    // HOLA: Increase threshold to allow tree placement in complex graphs
    const maxAcceptableStress = TREE_PLACEMENT_MAX_ACCEPTABLE_STRESS; // Increased from 1000 to allow placement
    const fits = stressCost <= maxAcceptableStress;

    return {
      fits,
      expansionRequired: expansionNeeded,
      stressCost,
    };
  }

  /**
   * Create zero expansion constraints for cases where no face expansion is needed.
   * Returns a clean ExpansionConstraints object with all expansion values set to 0.
   *
   * @returns Empty expansion constraints with zero values and no affected nodes
   */
  private createZeroExpansionConstraints(): ExpansionConstraints {
    return {
      expandNorth: 0,
      expandSouth: 0,
      expandEast: 0,
      expandWest: 0,
      affectedNodes: new Set<string>(),
      totalCost: 0,
    };
  }

  /**
   * HOLA Theory: Calculate tree bounding box with orientation
   */
  private calculateTreeBounds(treeLayout: TreeLayout, _direction: PlacementDirection): BoundingBox {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    treeLayout.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    return {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * HOLA Theory: Calculate space required in face coordinate system
   */
  private calculateRequiredSpace(
    treeBounds: BoundingBox,
    direction: PlacementDirection
  ): RequiredSpace {
    const angle = (direction.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corners = [
      { x: treeBounds.minX, y: treeBounds.minY },
      { x: treeBounds.maxX, y: treeBounds.minY },
      { x: treeBounds.maxX, y: treeBounds.maxY },
      { x: treeBounds.minX, y: treeBounds.maxY },
    ];

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    corners.forEach((corner) => {
      const rotX = corner.x * cos - corner.y * sin;
      const rotY = corner.x * sin + corner.y * cos;
      minX = Math.min(minX, rotX);
      maxX = Math.max(maxX, rotX);
      minY = Math.min(minY, rotY);
      maxY = Math.max(maxY, rotY);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
      direction: direction.name,
    };
  }

  /**
   * HOLA Theory: Calculate available space in face
   */
  private calculateAvailableSpace(face: Face): AvailableSpace {
    const bounds = face.boundingBox;
    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      centerX: (bounds.minX + bounds.maxX) / 2,
      centerY: (bounds.minY + bounds.maxY) / 2,
    };
  }

  /**
   * HOLA Theory: Calculate separation constraints to expand face
   * Implements the core requirement from Step 3c theory
   */
  private calculateExpansionConstraints(
    required: RequiredSpace,
    available: AvailableSpace,
    face: Face,
    direction: PlacementDirection
  ): ExpansionConstraints {
    const constraints: ExpansionConstraints = {
      expandNorth: 0,
      expandSouth: 0,
      expandEast: 0,
      expandWest: 0,
      affectedNodes: new Set<string>(),
      totalCost: 0,
    };

    const widthDeficit = Math.max(0, required.width - available.width);
    const heightDeficit = Math.max(0, required.height - available.height);

    if (direction.type === 'cardinal') {
      switch (direction.name) {
        case 'N':
          constraints.expandNorth = heightDeficit;
          constraints.expandEast = widthDeficit / 2;
          constraints.expandWest = widthDeficit / 2;
          break;
        case 'S':
          constraints.expandSouth = heightDeficit;
          constraints.expandEast = widthDeficit / 2;
          constraints.expandWest = widthDeficit / 2;
          break;
        case 'E':
          constraints.expandEast = widthDeficit;
          constraints.expandNorth = heightDeficit / 2;
          constraints.expandSouth = heightDeficit / 2;
          break;
        case 'W':
          constraints.expandWest = widthDeficit;
          constraints.expandNorth = heightDeficit / 2;
          constraints.expandSouth = heightDeficit / 2;
          break;
      }
    } else {
      const halfWidth = widthDeficit / 2;
      const halfHeight = heightDeficit / 2;

      if (direction.name.includes('N')) {
        constraints.expandNorth = halfHeight;
      }
      if (direction.name.includes('S')) {
        constraints.expandSouth = halfHeight;
      }
      if (direction.name.includes('E')) {
        constraints.expandEast = halfWidth;
      }
      if (direction.name.includes('W')) {
        constraints.expandWest = halfWidth;
      }
    }

    constraints.affectedNodes = this.identifyAffectedNodes(face, constraints);

    return constraints;
  }

  /**
   * HOLA Theory: Calculate stress cost of applying expansion constraints
   */
  private calculateExpansionStressCost(expansion: ExpansionConstraints, _face: Face): number {
    let totalCost = 0;

    const totalExpansion =
      expansion.expandNorth + expansion.expandSouth + expansion.expandEast + expansion.expandWest;

    const nodeMovementCost = totalExpansion * expansion.affectedNodes.size;

    const asymmetryCost =
      Math.abs(expansion.expandNorth - expansion.expandSouth) +
      Math.abs(expansion.expandEast - expansion.expandWest);

    totalCost = nodeMovementCost + asymmetryCost * 2;

    return totalCost;
  }

  /**
   * HOLA Theory: Identify nodes that need to be moved for expansion
   */
  private identifyAffectedNodes(face: Face, expansion: ExpansionConstraints): Set<string> {
    const affected = new Set<string>();

    face.boundaryNodes.forEach((nodeId) => {
      const node = this.planarizedCore.nodes.get(nodeId);
      if (!node) {
        return;
      }

      const bounds = face.boundingBox;

      if (expansion.expandNorth > 0 && node.y !== undefined && node.y <= bounds.minY + 5) {
        affected.add(nodeId);
      }
      if (expansion.expandSouth > 0 && node.y !== undefined && node.y >= bounds.maxY - 5) {
        affected.add(nodeId);
      }
      if (expansion.expandEast > 0 && node.x !== undefined && node.x >= bounds.maxX - 5) {
        affected.add(nodeId);
      }
      if (expansion.expandWest > 0 && node.x !== undefined && node.x <= bounds.minX + 5) {
        affected.add(nodeId);
      }
    });

    return affected;
  }

  /**
   * HOLA Theory: Apply expansion constraints to actually move nodes
   * This implements the permanent face expansion from Step 3c theory
   */
  private applyExpansionConstraints(expansion: ExpansionConstraints): void {
    expansion.affectedNodes.forEach((nodeId) => {
      const node = this.planarizedCore.nodes.get(nodeId);
      if (node?.x === undefined || node.y === undefined) {
        return;
      }

      let deltaX = 0;
      let deltaY = 0;

      if (expansion.expandNorth > 0) {
        deltaY -= expansion.expandNorth / 2;
      }
      if (expansion.expandSouth > 0) {
        deltaY += expansion.expandSouth / 2;
      }
      if (expansion.expandEast > 0) {
        deltaX += expansion.expandEast / 2;
      }
      if (expansion.expandWest > 0) {
        deltaX -= expansion.expandWest / 2;
      }

      node.x += deltaX;
      node.y += deltaY;
    });

    this.updateFaceBoundingBoxes();
  }

  /**
   * Update all face bounding boxes after node movements
   */
  private updateFaceBoundingBoxes(): void {
    this.faces.forEach((face) => {
      const boundary = face.boundary;
      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;

      boundary.forEach((nodeId) => {
        const node = this.planarizedCore.nodes.get(nodeId);
        if (node?.x !== undefined && node.y !== undefined) {
          minX = Math.min(minX, node.x);
          maxX = Math.max(maxX, node.x);
          minY = Math.min(minY, node.y);
          maxY = Math.max(maxY, node.y);
        }
      });

      face.boundingBox = { minX, maxX, minY, maxY };
      face.area = (maxX - minX) * (maxY - minY);
    });
  }

  /**
   * Check if tree fits in face using simplified calculation (without full expansion analysis).
   * This method provides a quick fitness check by delegating to the full expansion method
   * but only returning the boolean fitness result.
   *
   * @param candidate - The placement candidate to evaluate
   * @param treeLayout - The tree layout to be placed
   * @param coreNodePos - Position of the core node for placement reference
   * @returns true if the tree can fit in the specified face
   */
  private checkTreeFitsInFace(
    candidate: PlacementCandidate,
    treeLayout: TreeLayout,
    coreNodePos: Position
  ): boolean {
    const result = this.checkTreeFitsInFaceWithExpansion(candidate, treeLayout, coreNodePos);
    return result.fits;
  }

  /**
   * Calculate stress cost for a placement using proper HOLA graph stress function
   * HOLA theory: Temporarily apply placement, measure stress increase, then backtrack
   */
  private calculateStressCost(
    candidate: PlacementCandidate,
    treeLayout: TreeLayout,
    _coreNodePos: Position
  ): number {
    const currentNodes = [
      ...[...this.planarizedCore.nodes.values()].filter((n): n is Node => this.isPlanarNode(n)),
      ...this.getPlacedTreeNodes(),
    ];
    const currentEdges = this.getAllEdgesForStressCalculation();
    const baselineStress = this.calculateGraphStress(currentNodes, currentEdges);

    const scenario = this.createTemporaryPlacementScenario(candidate, treeLayout, _coreNodePos);

    if (!scenario) {
      return Number.MAX_SAFE_INTEGER;
    }

    const stressWithPlacement = this.calculateGraphStress(scenario.nodes, scenario.edges);

    const stressIncrease = stressWithPlacement - baselineStress;

    return Math.max(0, stressIncrease);
  }

  /**
   * Calculate full graph stress using HOLA-compliant edge-length-based function
   * Based on overlapUtils calculateStress but adapted for our data structures
   */
  private calculateGraphStress(nodes: Node[], edges: { start: string; end: string }[]): number {
    if (!edges || edges.length === 0) {
      return 0;
    }

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

        const idealLength = this.uniformEdgeLength;
        const stress = (distance - idealLength) * (distance - idealLength);
        totalStress += stress;
      }
    });

    return totalStress;
  }

  /**
   * Get all placed tree nodes
   */
  private getPlacedTreeNodes(): Node[] {
    const nodes: Node[] = [];

    this.placedTrees.forEach((treePlacement) => {
      const treeLayout = this.treeLayouts.get(treePlacement.treeId);
      if (treeLayout?.nodes) {
        treeLayout.nodes.forEach((treeNode) => {
          const node: Node = {
            id: treeNode.id,
            x: treeNode.x,
            y: treeNode.y,
            width: (treeNode.width as number) ?? DEFAULT_NODE_WIDTH,
            height: (treeNode.height as number) ?? DEFAULT_NODE_HEIGHT,
            isGroup: false,
            padding: (treeNode.padding as number) ?? 15,
          };
          nodes.push(node);
        });
      }
    });

    return nodes;
  }

  /**
   * Get all edges for stress calculation (core edges + placed tree edges)
   */
  private getAllEdgesForStressCalculation(): { start: string; end: string }[] {
    const edges: { start: string; end: string }[] = [];

    this.planarizedCore.edges.forEach((edge: PlanarEdge) => {
      if (edge.start && edge.end) {
        edges.push({ start: edge.start, end: edge.end });
      }
    });

    this.placedTrees.forEach((treePlacement) => {
      const treeLayout = this.treeLayouts.get(treePlacement.treeId);
      if (treeLayout?.edges) {
        treeLayout.edges.forEach((edge: TreeEdge) => {
          if (edge.start && edge.end) {
            edges.push({ start: edge.start, end: edge.end });
          }
        });
      }
    });

    return edges;
  }

  /**
   * Create temporary placement scenario for stress testing
   * HOLA theory: Apply separation constraints and tree positioning temporarily
   */
  private createTemporaryPlacementScenario(
    candidate: PlacementCandidate,
    treeLayout: TreeLayout,
    coreNodePos: Position
  ): { nodes: Node[]; edges: { start: string; end: string }[] } | null {
    const tempNodes = new Map<string, Node>();

    const coreNodes = [...this.planarizedCore.nodes.values()].filter((n): n is Node =>
      this.isPlanarNode(n)
    );
    [...coreNodes, ...this.getPlacedTreeNodes()].forEach((node) => {
      tempNodes.set(node.id, { ...node });
    });

    const expansionResult = this.checkTreeFitsInFaceWithExpansion(
      candidate,
      treeLayout,
      coreNodePos
    );
    if (!expansionResult.fits) {
      return null;
    }

    if (!expansionResult.fits && expansionResult.expansionRequired) {
      expansionResult.expansionRequired.affectedNodes.forEach((nodeId: string) => {
        const node = tempNodes.get(nodeId);
        if (node?.x !== undefined && node.y !== undefined) {
          node.x +=
            expansionResult.expansionRequired.expandEast -
            expansionResult.expansionRequired.expandWest;
          node.y +=
            expansionResult.expansionRequired.expandSouth -
            expansionResult.expansionRequired.expandNorth;
        }
      });
    }

    const transformedTreeNodes = this.transformTreeCoordinates(
      treeLayout,
      candidate.placementDirection,
      candidate.growthDirection,
      candidate.isFlipped
    );

    transformedTreeNodes.forEach((treeNode) => {
      const node: Node = {
        id: treeNode.id,
        x: (treeNode.x ?? 0) + coreNodePos.x,
        y: (treeNode.y ?? 0) + coreNodePos.y,
        width: (treeNode.width as number) ?? DEFAULT_NODE_WIDTH,
        height: (treeNode.height as number) ?? DEFAULT_NODE_HEIGHT,
        isGroup: false,
        padding: (treeNode.padding as number) ?? DEFAULT_PADDING,
      };
      tempNodes.set(node.id, node);
    });

    const edges = this.getAllEdgesForStressCalculation();

    if (treeLayout.edges) {
      treeLayout.edges.forEach((edge: TreeEdge) => {
        if (edge.start && edge.end) {
          edges.push({ start: edge.start, end: edge.end });
        }
      });
    }

    return {
      nodes: [...tempNodes.values()],
      edges,
    };
  }

  /**
   * Perform iterative stress relaxation after tree placement
   * HOLA theory: Re-run stress minimization on entire layout to maintain optimal edge lengths
   */
  private performStressRelaxation(_placedTreeId: string): void {
    const allNodes = this.getAllCurrentNodes();
    const allEdges = this.getAllEdgesForStressCalculation();

    if (allNodes.length < 2 || allEdges.length === 0) {
      return;
    }

    const initialStress = this.calculateGraphStress(allNodes, allEdges);

    const maxIterations = TREE_PLACEMENT_STRESS_RELAX_MAX_ITERATIONS;
    const dampingFactor = TREE_PLACEMENT_STRESS_RELAX_DAMPING;
    const convergenceThreshold = TREE_PLACEMENT_STRESS_RELAX_CONVERGENCE;
    const idealEdgeLength = this.uniformEdgeLength;

    let previousStress = initialStress;
    let iteration = 0;

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
        const forceStrength = lengthDifference * 0.1; // Force coefficient

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

        const isCoreNode =
          this.planarizedCore.nodes.has(node.id) &&
          !('type' in this.planarizedCore.nodes.get(node.id)!);

        if (!isCoreNode) {
          const displacementX = force.x * dampingFactor;
          const displacementY = force.y * dampingFactor;

          node.x += displacementX;
          node.y += displacementY;

          totalDisplacement += Math.sqrt(
            displacementX * displacementX + displacementY * displacementY
          );
        }
      });

      const currentStress = this.calculateGraphStress(allNodes, allEdges);
      const stressImprovement = previousStress - currentStress;
      const improvementRatio = Math.abs(stressImprovement) / initialStress;

      if (improvementRatio < convergenceThreshold || totalDisplacement < 1.0) {
        break;
      }

      if (stressImprovement < 0 && Math.abs(stressImprovement) > initialStress * 0.1) {
        break;
      }

      previousStress = currentStress;
      iteration++;
    }
  }

  /**
   * Get all current nodes (core + placed trees)
   */
  private getAllCurrentNodes(): Node[] {
    const coreNodes = [...this.planarizedCore.nodes.values()].filter((n): n is Node =>
      this.isPlanarNode(n)
    );
    const treeNodes = this.getPlacedTreeNodes();
    return [...coreNodes, ...treeNodes];
  }

  /**
   * Type guard to check if a node is a regular Node (not a DummyNode).
   * Used to filter out dummy nodes when working with core graph nodes.
   *
   * @param node - The node to check (could be Node or DummyNode)
   * @returns true if the node is a regular Node, false if it's a DummyNode
   */
  private isPlanarNode(node: Node | DummyNode): node is Node {
    return !('type' in node);
  }

  /**
   * Select best candidate based on HOLA criteria
   */
  private selectBestCandidate(candidates: PlacementCandidate[]): PlacementCandidate | null {
    const validCandidates = candidates.filter((c) => c.fitsInFace);

    if (validCandidates.length === 0) {
      return null;
    }

    validCandidates.sort((a, b) => a.score - b.score);

    return validCandidates[0];
  }

  /**
   * Create final tree placement from candidate
   */
  private createTreePlacement(
    treeId: string,
    candidate: PlacementCandidate,
    treeLayout: TreeLayout,
    coreNodeId: string
  ): TreePlacement {
    const coreNodePos = this.getCoreNodePosition(coreNodeId)!;

    const position: Position = {
      x: coreNodePos.x,
      y: coreNodePos.y,
    };

    return {
      treeId,
      coreNodeId,
      face: candidate.face,
      placementDirection: candidate.placementDirection,
      growthDirection: candidate.growthDirection,
      isFlipped: candidate.isFlipped,
      position,
      requiredSpace: {
        width: treeLayout.boundingBox.width,
        height: treeLayout.boundingBox.height,
        expandedBounds: {
          minX: position.x - treeLayout.boundingBox.width / 2,
          maxX: position.x + treeLayout.boundingBox.width / 2,
          minY: position.y - treeLayout.boundingBox.height / 2,
          maxY: position.y + treeLayout.boundingBox.height / 2,
        },
      },
    };
  }

  /**
   * Apply tree placement to the layout (expand faces, add separation constraints)
   * Implements the final positioning step from Step 3c requirements
   */
  private applyTreePlacement(placement: TreePlacement): void {
    const treeLayout = this.treeLayouts.get(placement.treeId);
    if (!treeLayout) {
      return;
    }

    const corePosition = this.getCoreNodePosition(placement.coreNodeId)!;
    const placementCandidate: PlacementCandidate = {
      face: placement.face,
      placementDirection: placement.placementDirection,
      growthDirection: placement.growthDirection,
      isFlipped: false,
      score: 0,
      stressCost: 0,
      fitsInFace: true,
    };

    const expansionResult = this.checkTreeFitsInFaceWithExpansion(
      placementCandidate,
      treeLayout,
      corePosition
    );

    if (expansionResult.expansionRequired.affectedNodes.size > 0) {
      this.applyExpansionConstraints(expansionResult.expansionRequired);
    }
    // Step 1: Transform tree coordinates according to placement orientation
    const transformedTreeNodes = this.transformTreeCoordinates(
      treeLayout,
      placement.placementDirection,
      placement.growthDirection,
      placement.isFlipped
    );

    // Step 2: Position tree root to coincide with core node
    const corePos = this.getCoreNodePosition(placement.coreNodeId);
    if (!corePos) {
      return;
    }

    // Step 3: Calculate final absolute positions for all tree nodes

    const finalTreeNodes = this.positionTreeNodes(
      transformedTreeNodes,
      corePos,
      treeLayout.rootPosition
    );

    // Step 4: Add tree nodes to the planarized graph (excluding dummy root)
    const actualTreeNodes = finalTreeNodes.filter((node) => !node.id.includes('_copy'));
    actualTreeNodes.forEach((treeNode) => {
      this.planarizedCore.nodes.set(treeNode.id, {
        ...treeNode,
        id: treeNode.id,
        label: treeNode.label,
        x: treeNode.x,
        y: treeNode.y,
        isGroup: false,
      });
    });

    // Step 5: Add tree edges to the planarized graph (excluding edges to dummy root)
    this.addTreeEdgesToGraph(treeLayout, actualTreeNodes);
  }

  /**
   * Determine if tree should be flipped based on growth direction mismatch
   *
   * HOLA Theory: Trees from Step 3a are laid out growing South (downward).
   * If placement direction contradicts natural growth, flip the tree.
   *
   *
   * @param _treeLayout - The tree layout (for future shape analysis)
   * @param _placementDirection - Direction of placement relative to core
   * @param growthDirection - Direction the tree will grow after placement
   * @returns true if tree should be flipped by default
   */
  private shouldFlipTree(growthDirection: PlacementDirection): boolean {
    const naturalGrowthAngle = TREE_NATURAL_GROWTH_ANGLE;

    const growthAngle = growthDirection.angle;

    if (
      Math.abs(growthAngle - 270) < TREE_DIRECTION_ANGLE_THRESHOLD ||
      Math.abs(growthAngle + 90) < TREE_DIRECTION_ANGLE_THRESHOLD
    ) {
      return true;
    }

    if (Math.abs(growthAngle - naturalGrowthAngle) < TREE_DIRECTION_ANGLE_THRESHOLD) {
      return false;
    }

    return false;
  }

  /**
   * Transform tree coordinates according to placement direction and growth direction
   */
  private transformTreeCoordinates(
    treeLayout: TreeLayout,
    _placementDirection: PlacementDirection,
    growthDirection: PlacementDirection,
    isFlipped: boolean
  ): TreeNode[] {
    const transformedNodes: TreeNode[] = [];

    const rotationAngle = growthDirection.angle;

    for (const node of treeLayout.nodes) {
      let x = node.x - treeLayout.rootPosition.x;
      const y = node.y - treeLayout.rootPosition.y;

      if (isFlipped) {
        x = -x;
      }

      const cos = Math.cos((rotationAngle * Math.PI) / 180);
      const sin = Math.sin((rotationAngle * Math.PI) / 180);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;

      transformedNodes.push({
        ...node,
        x: rotatedX,
        y: rotatedY,
      });
    }

    return transformedNodes;
  }

  /**
   * Position tree nodes relative to core node position
   */
  private positionTreeNodes(
    transformedNodes: TreeNode[],
    coreNodePos: Position,
    _originalRootPos: Position
  ): TreeNode[] {
    const rootNode = transformedNodes.find((node) => node.level === 0);
    if (!rootNode) {
      return transformedNodes.map((node) => ({
        ...node,
        x: coreNodePos.x + node.x,
        y: coreNodePos.y + node.y,
      }));
    }

    const offsetX = coreNodePos.x - rootNode.x;
    const offsetY = coreNodePos.y - rootNode.y;

    return transformedNodes.map((node) => ({
      ...node,
      x: node.x + offsetX,
      y: node.y + offsetY,
    }));
  }

  /**
   * Add tree edges to the planarized graph
   */
  private addTreeEdgesToGraph(treeLayout: TreeLayout, finalTreeNodes: TreeNode[]): void {
    treeLayout.edges.forEach((treeEdge) => {
      let actualStartId = treeEdge.start;
      let actualEndId = treeEdge.end;

      if (treeEdge.start.includes('_copy')) {
        actualStartId = treeEdge.start.replace('_copy', '');
      }

      if (treeEdge.end.includes('_copy')) {
        actualEndId = treeEdge.end.replace('_copy', '');
      }

      if (actualStartId === actualEndId) {
        return;
      }

      const startNode =
        finalTreeNodes.find((n) => n.id === actualStartId) ??
        this.planarizedCore.nodes.get(actualStartId);
      const endNode =
        finalTreeNodes.find((n) => n.id === actualEndId) ??
        this.planarizedCore.nodes.get(actualEndId);

      if (startNode && endNode) {
        const transformedPoints = treeEdge.points.map((point) => ({
          x: point.x,
          y: point.y,
        }));

        const planarEdge: PlanarEdge = {
          ...treeEdge,
          id: treeEdge.id,
          start: actualStartId,
          end: actualEndId,
          isHorizontal: Math.abs(endNode.y! - startNode.y!) < Math.abs(endNode.x! - startNode.x!),
          isVertical: Math.abs(endNode.x! - startNode.x!) < Math.abs(endNode.y! - startNode.y!),
          points: transformedPoints,
        };

        this.planarizedCore.edges.push(planarEdge);
      }
    });
  }

  /**
   * Get position of a core node
   */
  private getCoreNodePosition(nodeId: string): Position | null {
    const node = this.planarizedCore.nodes.get(nodeId);
    if (!node) {
      return null;
    }
    return { x: node.x!, y: node.y! };
  }
}
