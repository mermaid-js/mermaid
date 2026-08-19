import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { AgentflowDiagnostic } from './diagnostics.js';

/**
 * Valid `type` args to `yy.addVertex` taken from
 * `packages/mermaid/src/diagrams/flowchart/parser/flow.jison`.
 *
 * v0.8.1: shapes the spec calls "removed" still appear here because the
 * grammar continues to accept the inline syntax (e.g. `id((text))` for
 * circle). The DB then rejects them with a `SHAPE_REMOVED` diagnostic.
 */
export type FlowVertexTypeParam =
  | undefined
  | 'square'
  | 'doublecircle'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'rect'
  | 'cylinder'
  | 'round'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'lean_right'
  | 'lean_left';

/**
 * Derived semantic kind of a vertex. v0.8.1 values:
 *
 * - `'tool'` — resolved shape is `subroutine` (alias `tool`)
 * - `'action'` — resolved shape is `hexagon` (alias `action`); call to
 *   another flow exposed via MCP (§16.7).
 * - `'input'` — resolved shape is `lean-right` (alias `input`).
 * - `'refdoc'` — resolved shape is `lin-doc` (alias `refdoc`).
 * - `'decision'` — resolved shape is `diamond` (alias `decision`).
 * - `'connector'` — declared with the `connector` keyword.
 * - `'task'` — default rounded-rectangle node.
 */
export type VertexKind = 'tool' | 'action' | 'input' | 'refdoc' | 'decision' | 'connector' | 'task';

export interface FlowVertex {
  classes: string[];
  dir?: string;
  domId: string;
  haveCallback?: boolean;
  id: string;
  labelType: 'markdown' | 'string' | 'text';
  link?: string;
  linkTarget?: string;
  props?: any;
  styles: string[];
  text?: string;
  type?: ShapeID | FlowVertexTypeParam;
  icon?: string;
  form?: string;
  pos?: 't' | 'b';
  img?: string;
  assetWidth?: number;
  assetHeight?: number;
  defaultWidth?: number;
  imageAspectRatio?: number;
  metadata?: Record<string, unknown>;
  /** Set by `addConnector` to mark a node declared with the `connector` keyword. */
  isConnector?: boolean;
}

export interface FlowText {
  text: string;
  type: 'text';
}

/**
 * Canonical per-operator semantic per `AGENTFLOW-SYNTAX.md` §5.1 (v0.8.1).
 * Populated on every edge produced by one of the three operators; left
 * `undefined` only for malformed edges.
 *
 * - `sequence` ← `-->` (execution order)
 * - `reference` ← `-.-` (reference-doc attachment, non-directional)
 * - `failure` ← `--x` (failure / cancellation / escalation)
 */
export type EdgeSemantic = 'sequence' | 'reference' | 'failure';

export interface FlowEdge {
  isUserDefinedId: boolean;
  start: string;
  end: string;
  interpolate?: string;
  type?: string;
  stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
  /** Canonical §5.1 semantic. See {@link EdgeSemantic}. */
  edgeSemantic?: EdgeSemantic;
  style?: string[];
  length?: number;
  text: string;
  labelType: 'markdown' | 'string' | 'text';
  classes: string[];
  id?: string;
  animation?: 'fast' | 'slow';
  animate?: boolean;
  /** Per-edge metadata. v0.8.1 permits only `instruction`. */
  metadata?: Record<string, unknown>;
}

export interface FlowClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

export interface FlowSubGraph {
  classes: string[];
  dir?: string;
  id: string;
  labelType: string;
  nodes: string[];
  title: string;
  /** v0.8.1: the only container kind is `flow`. */
  type?: 'flow';
  metadata?: Record<string, unknown>;
}

export interface FlowLink {
  length?: number;
  stroke: string;
  type: string;
  text?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Element-mapping infrastructure (PR 2a of the wave-1 readiness plan).
// ───────────────────────────────────────────────────────────────────────────

/** Position of an element in the original diagram source. */
export interface ElementPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  startIndex: number;
  endIndex: number;
}

/**
 * The kinds of top-level statements agentflow currently emits mappings for.
 *
 * `attachment` marks a standalone `id@{ ... }` metadata block on a bare
 * reference — it annotates an element declared elsewhere rather than
 * declaring one, so consumers can tell it apart from a declaration's
 * `vertex` mapping (issue #75).
 */
export type AgentflowStatementType = 'vertex' | 'edge' | 'subgraph' | 'connector' | 'attachment';

/** A single element-to-position mapping. */
export interface AgentflowElementMapping {
  id: string;
  type: AgentflowStatementType;
  position: ElementPosition;
}

// ───────────────────────────────────────────────────────────────────────────
// Semantic model — purpose-built projection of the DB's state with
// presentation fields removed. See `AGENTFLOW-SYNTAX.md` §11 for the
// normative list of presentation-only controls.
// ───────────────────────────────────────────────────────────────────────────

/** A vertex as seen by downstream semantic tooling. */
export interface SemanticVertex {
  id: string;
  /** Human-readable label as authored. */
  label?: string;
  /** Shape carries meaning in agentflow (diamond ≠ hexagon ≠ subroutine etc.). */
  shape?: string;
  /** Derived semantic kind. See {@link VertexKind}. */
  vertexKind?: VertexKind;
  /** Domain metadata authored on this vertex. */
  metadata?: Record<string, unknown>;
}

/** An edge as seen by downstream semantic tooling. */
export interface SemanticEdge {
  start: string;
  end: string;
  /** Author-assigned edge id when present (e.g. `e1@-->`). */
  id?: string;
  /** Edge label (branch outcome on `-->`). */
  label?: string;
  /** Raw arrow kind — `arrow_point`, `arrow_cross`, `arrow_open`. */
  type?: string;
  /** Stroke classification: `normal`, `dotted`. */
  stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
  /** Canonical §5.1 semantic. See {@link EdgeSemantic}. */
  edgeSemantic?: EdgeSemantic;
  /** Number of dashes/dots in the operator. */
  length?: number;
  /** Edge-level metadata (only `instruction` in v0.8.1). */
  metadata?: Record<string, unknown>;
}

/** A container in semantic form. v0.8.1: only `flow`. */
export interface SemanticSubGraph {
  id: string;
  /** Container kind — always `flow` in v0.8.1. */
  type?: string;
  title?: string;
  /** IDs of direct member elements. */
  nodes: string[];
  /** Domain metadata from `@{...}` blocks on the container. */
  metadata?: Record<string, unknown>;
  /** Optional direction override (`TB` / `BT` / `LR` / `RL` / `TD`). */
  direction?: string;
}

/** A connector declared with the `connector` keyword (§8). */
export interface SemanticConnector {
  id: string;
  title?: string;
  /** Domain metadata from `@{...}` on the connector. */
  metadata?: Record<string, unknown>;
}

/**
 * The projection returned by `AgentFlowDB.getSemanticModel()`. v0.8.1
 * removes `typeDeclarations` and `templateDeclarations` and adds
 * `connectors` for the new keyword.
 */
export interface AgentflowSemanticModel {
  /** Top-level diagram direction. */
  direction?: string;
  vertices: SemanticVertex[];
  edges: SemanticEdge[];
  subGraphs: SemanticSubGraph[];
  connectors: SemanticConnector[];
  /**
   * Structured warnings/errors raised against this diagram. Callers should
   * invoke `getData()` (which runs post-parse validators) at least once
   * before reading `getSemanticModel()` so all validators have fired.
   */
  diagnostics: readonly AgentflowDiagnostic[];
}
