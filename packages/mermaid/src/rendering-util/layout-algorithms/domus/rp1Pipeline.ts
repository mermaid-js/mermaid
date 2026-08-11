import type { LayoutData, Node } from '../../types.js';
import { runOrthogonalEdgePipeline, type OrthogonalOptions } from './pipeline.js';

/**
 * RP1-style pipeline core types, following RP1-pipeline.md and RP4-architecture-patterns.md.
 *
 * This module does not introduce a new routing algorithm yet; instead it wraps
 * the existing orthogonal edge pipeline in a stage-structured container that
 * can later grow into a full channel-based RP1 implementation without changing
 * the public API seen by layout callers.
 */

/** Input graph for the orthogonal pipeline: a LayoutData with fixed boxes. */
export interface GraphInput {
  layout: LayoutData;
}

/**
 * Obstacle/port model produced by Stage 1 (port assignment / obstacle view).
 * For now this is a thin wrapper around non-group nodes with IDs.
 */
export interface ObstacleModel {
  layout: LayoutData;
  nodesById: Map<string, Node>;
  groupsById: Map<string, Node>;
}

/** Placeholder for the routing graph H used in RP1 Stage 2. */
export interface RoutingGraph {
  layout: LayoutData;
}

/** Routed paths (Stage 3 output) backed by LayoutData.edge.points. */
export interface RoutedPaths {
  layout: LayoutData;
}

/** Bundle orders for shared segments (Stage 4). */
export interface BundleOrders {
  layout: LayoutData;
}

/** Constraint graph used for spacing/nudging (Stage 5). */
export interface ConstraintGraph {
  layout: LayoutData;
}

/** Final nudged geometry; currently identical to the underlying LayoutData. */
export interface NudgedGeometry {
  layout: LayoutData;
}

export interface Rp1PipelineResult {
  input: GraphInput;
  obstacleModel: ObstacleModel;
  routingGraph: RoutingGraph;
  routed: RoutedPaths;
  bundles: BundleOrders;
  constraints: ConstraintGraph;
  geometry: NudgedGeometry;
}

export type Rp1PipelineOptions = OrthogonalOptions;

function buildObstacleModel(input: GraphInput): ObstacleModel {
  const nodesById = new Map<string, Node>();
  const groupsById = new Map<string, Node>();
  for (const node of input.layout.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const id = String(node.id);
    if (node.isGroup) {
      groupsById.set(id, node as Node);
    } else {
      nodesById.set(id, node as Node);
    }
  }
  return { layout: input.layout, nodesById, groupsById };
}

function buildRoutingGraph(obstacles: ObstacleModel): RoutingGraph {
  // The current orthogonal implementation uses an implicit grid-based search
  // instead of an explicit routing graph H. This placeholder keeps the RP1
  // shape (GraphInput -> ObstacleModel -> RoutingGraph) while remaining
  // backwards compatible. A future implementation can replace this with a
  // channel/representative-based H without changing callers.
  return { layout: obstacles.layout };
}

/**
 * Run the RP1-style orthogonal pipeline on the provided LayoutData.
 *
 * At the moment this delegates routing, path ordering, and spacing directly to
 * `runOrthogonalEdgePipeline`, but exposes the higher-level RP1 data flow so
 * other layouts can reuse the same module and we can gradually enrich the
 * intermediate representations.
 */
export function runRP1OrthogonalPipeline(
  layout: LayoutData,
  options: Rp1PipelineOptions = {}
): Rp1PipelineResult {
  const input: GraphInput = { layout };
  const obstacleModel = buildObstacleModel(input);
  const routingGraph = buildRoutingGraph(obstacleModel);

  // Delegate the core routing + ordering + spacing work to the existing
  // orthogonal edge pipeline. This mutates `layout.edges[*].points`.
  runOrthogonalEdgePipeline(layout, options);

  const routed: RoutedPaths = { layout };
  const bundles: BundleOrders = { layout };
  const constraints: ConstraintGraph = { layout };
  const geometry: NudgedGeometry = { layout };

  return { input, obstacleModel, routingGraph, routed, bundles, constraints, geometry };
}
