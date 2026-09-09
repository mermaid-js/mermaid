import type { Cardinal, HolaGraph, HolaNode } from './model.js';
import type { ConstraintSystem } from './constraints/solver.js';
import type { HolaOptions } from './options.js';
import type { DiagnosticCollector } from './diagnostics.js';

/** A deliberate bend created inside a chain edge (guide §13.4). */
export interface ChainBend {
  id: string;
  /** Topological edge the bend lives inside. */
  edgeId: string;
  /** Position along that edge, ascending from `edge.source`. */
  order: number;
}

/**
 * Everything the core stages share. `entities` is the set of things the
 * constraint solver may move: core nodes, chain bend dummies, and later tree
 * placeholders. `core.nodes` stays the pure graph topology.
 */
export interface CoreLayoutState {
  componentId: string;
  core: HolaGraph;
  entities: Map<string, HolaNode>;
  bends: Map<string, ChainBend>;
  system: ConstraintSystem;
  options: HolaOptions;
  diagnostics: DiagnosticCollector;
  /**
   * Directions fixed by node configuration: hub id → (neighbour id → compass
   * direction). Chain configuration must respect these (guide §13.2).
   */
  fixedDirections: Map<string, Map<string, Cardinal>>;
  /**
   * Entity ids of the tree placeholders committed so far. A later tree must make
   * room against them, not collide with them (guide §17.3).
   */
  placeholders: Set<string>;
}

export function makeEntity(
  id: string,
  x: number,
  y: number,
  width = 0,
  height = 0,
  inputOrder = Number.MAX_SAFE_INTEGER
): HolaNode {
  return { id, x, y, width, height, inputOrder, original: undefined };
}
