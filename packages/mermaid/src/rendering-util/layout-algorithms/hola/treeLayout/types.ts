/* eslint-disable @cspell/spellchecker */
import type { Node } from '../../../types.js';

// Step 3: Tree Layout and Placement around the Core
// Implementation based on HOLA requirements from step3.txt

export interface Position {
  x: number;
  y: number;
}

export interface TreeNode {
  id: string;
  label?: string;
  x: number;
  y: number;
  level: number; // Tree depth level (0 = root)
  subtreeWidth: number; // Width of subtree rooted at this node
  [key: string]: unknown;
}

export interface TreeEdge {
  id: string;
  start: string;
  end: string;
  points: Position[]; // Orthogonal routing points
  [key: string]: unknown;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface RequiredSpace {
  width: number;
  height: number;
  direction: string;
}

export interface AvailableSpace {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ExpansionConstraints {
  expandNorth: number;
  expandSouth: number;
  expandEast: number;
  expandWest: number;
  affectedNodes: Set<string>;
  totalCost: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  boundingBox: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  rootPosition: Position;
}

export interface TreeStructure {
  root: string;
  children: Map<string, string[]>;
  parent: Map<string, string>;
  levels: Map<string, number>;
}

// Step 3b: Planarization and Face Detection interfaces

export interface DummyNode {
  id: string;
  x: number;
  y: number;
  type: 'bend' | 'crossing';
  originalEdgeId?: string;
  isGroup?: boolean;
}

export interface PlanarEdge {
  id: string;
  start: string;
  end: string;
  isHorizontal: boolean;
  isVertical: boolean;
  points: Position[];
}

export interface Face {
  id: string;
  boundary: string[];
  boundaryNodes: string[];
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  area: number;
  isExternal: boolean;
  adjacentCoreNodes: string[];
}

export interface PlanarEmbedding {
  nodeNeighbors: Map<string, string[]>;
}

export interface PlanarizedCore {
  nodes: Map<string, Node | DummyNode>;
  edges: PlanarEdge[];
  faces: Face[];
  dummyNodes: DummyNode[];
  embedding: PlanarEmbedding;
}

// Step 3c: Tree Placement interfaces

export interface PlacementDirection {
  type: 'cardinal' | 'ordinal';
  name: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
  angle: number;
  vector: { x: number; y: number };
}

export interface TreePlacement {
  treeId: string;
  coreNodeId: string;
  face: Face;
  placementDirection: PlacementDirection;
  growthDirection: PlacementDirection;
  isFlipped: boolean;
  position: Position;
  requiredSpace: {
    width: number;
    height: number;
    expandedBounds: { minX: number; maxX: number; minY: number; maxY: number };
  };
}

export interface PlacementCandidate {
  face: Face;
  placementDirection: PlacementDirection;
  growthDirection: PlacementDirection;
  isFlipped: boolean;
  score: number;
  stressCost: number;
  fitsInFace: boolean;
}
