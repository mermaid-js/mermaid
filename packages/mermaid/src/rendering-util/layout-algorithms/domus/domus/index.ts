/**
 * DOMUS - Drawing Orthogonal Metrics Using Shape
 *
 * A shape-first methodology for orthogonal drawings that prioritizes
 * minimizing bends over minimizing crossings.
 *
 * Reference: "A Walk on the Wild Side: A Shape-First Methodology for
 * Orthogonal Drawings" (LIPIcs.GD.2025.35)
 */

export { runDomus, gridToPixelCoordinates, reconstructEdgePaths } from './domus.js';

// Types (Point is imported from shared types and re-exported through domus/types.ts)
export type {
  Point,
  EdgeLabel,
  DirectedEdge,
  Shape,
  SimpleCycle,
  CycleSet,
  AuxNode,
  AuxArc,
  AuxiliaryGraph,
  DrawabilityResult,
  DummyVertex,
  DomusGraph,
  SATVariables,
  CNFClause,
  CNFFormula,
  SATResult,
  DomusState,
  DomusOptions,
  DomusResult,
  EdgeConstraint,
  PositionConstraint,
  DomusConstraints,
} from './types.js';

// Type utilities
export {
  ALL_LABELS,
  oppositeLabel,
  createShape,
  isCycleComplete,
  createCycleSet,
  createDomusGraph,
  splitEdge,
  resetDummyVertexCounter,
  createSATVariables,
} from './types.js';

// Graph analysis
export {
  findBiconnectedComponents,
  computeCycleBasis,
  computeInitialCycleSet,
  getVertexDegree,
  getNeighbors,
  isConnected,
} from './graphAnalysis.js';

export type { BiconnectedComponent } from './graphAnalysis.js';

// Drawability testing
export {
  buildAuxiliaryGraphGx,
  buildAuxiliaryGraphGy,
  testRectilinearDrawability,
  computeCoordinatesFromShape,
} from './drawability.js';

// SAT encoding
export {
  generateShapeSATFormula,
  extractShapeFromAssignment,
  solveSAT,
  solveShapeSAT,
  identifyEdgeToSplit,
  buildPreferenceVariableBias,
} from './satEncoding.js';

// @ts-expect-error TODO(domus-wildside-drift): DPLLResult not exported from satEncoding.js (possibly renamed in wild-side)
export type { DPLLResult } from './satEncoding.js';

// Vertex expansion (degree > 4 handling)
export {
  findHighDegreeVertices,
  // @ts-expect-error TODO(domus-wildside-drift): expandVertex not exported from vertexExpansion.js (possibly renamed, cf. expandVertexIntoBox)
  expandVertex,
  expandHighDegreeVertices,
  collapseExpandedVertices,
  // @ts-expect-error TODO(domus-wildside-drift): reconstructPathThroughExpansion not exported from vertexExpansion.js (possibly renamed in wild-side)
  reconstructPathThroughExpansion,
} from './vertexExpansion.js';

export type { ExpandedVertex, ExpansionResult } from './vertexExpansion.js';

// RP1 Pipeline Adapter (split into focused modules)

// Conversion utilities
export {
  layoutDataToDomusInput,
  extractNodeSizes,
  buildNodesById,
  updateNodePositions,
} from './conversion.js';

// Edge path utilities
export { createEdgePathsFromShape, applyEdgePathsToLayout, getEdgeDirection } from './edgePaths.js';

// Runner (main entry point)
export { runDomusRouting } from './runner.js';
export type { DomusRoutingOptions, DomusRoutingResult } from './runner.js';

// Heuristics
export { shouldUseDomus } from './heuristics.js';
