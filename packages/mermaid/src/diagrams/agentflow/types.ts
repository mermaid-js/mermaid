import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { AgentflowDiagnostic } from './diagnostics.js';

/**
 * Valid `type` args to `yy.addVertex` taken from
 * `packages/mermaid/src/diagrams/flowchart/parser/flow.jison`
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
 * Derived semantic kind of a vertex. Currently the only value is `'tool'`,
 * derived from the resolved shape (`subroutine` and its aliases per §8.2 of
 * AGENTFLOW-SYNTAX.md). Surfaced on `SemanticVertex` so downstream consumers
 * don't recompute the shape→kind mapping themselves.
 */
export type VertexKind = 'tool';

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
  constraint?: 'on' | 'off';
  metadata?: Record<string, unknown>;
}

export interface FlowText {
  text: string;
  type: 'text';
}

/**
 * Canonical per-operator semantic per `AGENTFLOW-SYNTAX.md` §5.1. Populated
 * on every edge whose operator appears in the §5.1 mapping table; left
 * `undefined` for operators outside that table (e.g. `<-->`, `x--x`).
 *
 * Downstream tooling SHOULD prefer this field over `type` / `stroke` for
 * semantic decisions. The latter remain for rendering continuity.
 */
export type EdgeSemantic =
  | 'control'
  | 'data'
  | 'conformance'
  | 'delegation'
  | 'failure'
  | 'association'
  | 'governance'
  | 'bidirectional';

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
  type?:
    | 'subgraph'
    | 'task'
    | 'agent'
    | 'flow'
    | 'types'
    | 'templates'
    | 'skill'
    | 'test'
    | 'directive'
    | 'group';
  metadata?: Record<string, unknown>;
}

export interface FlowLink {
  length?: number;
  stroke: string;
  type: string;
  text?: string;
}

export interface AgentFlowTypeField {
  name: string;
  type: string;
}

export interface AgentFlowTemplateField {
  name: string;
  type: string;
  multiplicity?: number;
  description: string;
  kind?: 'field' | 'section';
}

export interface AgentFlowTemplateDeclaration {
  name: string;
  fields: AgentFlowTemplateField[];
  metadata?: Record<string, unknown>;
}

export type AgentFlowTemplateDeclarationsByName = Record<string, AgentFlowTemplateDeclaration>;

export type AgentFlowTypeDeclaration =
  | {
      name: string;
      kind: 'opaque';
      metadata?: Record<string, unknown>;
    }
  | {
      name: string;
      kind: 'alias';
      expression: string;
      metadata?: Record<string, unknown>;
    }
  | {
      name: string;
      kind: 'record';
      fields: AgentFlowTypeField[];
      metadata?: Record<string, unknown>;
    };

export type AgentFlowTypeDeclarationsByName = Record<string, AgentFlowTypeDeclaration>;

// ───────────────────────────────────────────────────────────────────────────
// Element-mapping infrastructure (PR 2a of the wave-1 readiness plan).
//
// Mirrors the shapes used by `alana/flowchart_jison_highlight`'s
// FlowchartElementMapping so that when both diagram types reach a shared
// home (planned lift to `diagram-api/types.ts`), the types are name-identical
// and can be merged without a rename.
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

/** The kinds of top-level statements agentflow currently emits mappings for. */
export type AgentflowStatementType = 'vertex' | 'edge' | 'subgraph' | 'type' | 'template';

/** A single element-to-position mapping. */
export interface AgentflowElementMapping {
  id: string;
  type: AgentflowStatementType;
  position: ElementPosition;
}

// ───────────────────────────────────────────────────────────────────────────
// Semantic model (PR 3 of the wave-1 readiness plan).
//
// Purpose-built projection of the DB's state with presentation fields
// removed. Downstream tooling consumes `AgentflowSemanticModel` when it
// needs to understand *what the diagram means* without being influenced by
// rendering choices. See `AGENTFLOW-SYNTAX.md` §13 for the normative list
// of presentation-only controls. Element mappings, styles, classes, view
// (collapsed/expanded), icon/img/w/h, and callback bindings are excluded;
// structural identifiers, labels, shape semantics, domain metadata, edge
// types/strokes/labels, subgraph membership, type/template declarations,
// and diagnostics are kept.
// ───────────────────────────────────────────────────────────────────────────

/** A vertex as seen by downstream semantic tooling. */
export interface SemanticVertex {
  id: string;
  /** Human-readable label as authored. */
  label?: string;
  /** Shape carries meaning in agentflow (diamond ≠ hexagon ≠ subroutine etc.). */
  shape?: string;
  /** Derived semantic kind (currently only `'tool'`). See {@link VertexKind}. */
  vertexKind?: VertexKind;
  /** Domain metadata authored on this vertex (permits, model, requires, etc.). */
  metadata?: Record<string, unknown>;
  /**
   * Domain metadata after `def` resolution — the instance's own metadata
   * layered on top of the transitive inheritance from its definition chain
   * per §11.3. Populated only for instance-shape vertices (`tag-rect`,
   * `delay`, `lin-rect`, `win-pane`, `curv-trap`) that fully resolve; left
   * `undefined` for plain vertices and for instances whose resolution
   * failed (missing def, cyclic chain, kind mismatch).
   */
  resolvedMetadata?: Record<string, unknown>;
  /** Set when this vertex is an instance of a definition (§10). */
  def?: string;
}

/** An edge as seen by downstream semantic tooling. */
export interface SemanticEdge {
  start: string;
  end: string;
  /** Author-assigned edge id when present (e.g. `edge1@A --> B`). */
  id?: string;
  /** Edge label (branch name for multi-param container edges; freeform otherwise). */
  label?: string;
  /** Raw arrow kind — `arrow_point`, `arrow_hierarchy`, `arrow_circle`, `arrow_cross`, `arrow_open`, or double-prefixed variants. */
  type?: string;
  /** Stroke classification: `normal`, `thick`, `dotted`, `invisible`. */
  stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
  /** Canonical §5.1 semantic. See {@link EdgeSemantic}. */
  edgeSemantic?: EdgeSemantic;
  /** Number of dashes/equals/dots in the operator — useful for layout but also semantic emphasis. */
  length?: number;
}

/** A container in semantic form: subgraph / agent / flow / task / skill / testCase / directive / group. */
export interface SemanticSubGraph {
  id: string;
  /** Container kind — `agent`, `flow`, `task`, `skill`, `test`, `directive`, `group`, `subgraph`, `types`, `templates`. */
  type?: string;
  title?: string;
  /** IDs of direct member elements. */
  nodes: string[];
  /** Domain metadata from `@{...}` blocks on the container. */
  metadata?: Record<string, unknown>;
  /** Optional direction override (`TB` / `BT` / `LR` / `RL` / `TD`). */
  direction?: string;
}

/**
 * The projection returned by `AgentFlowDB.getSemanticModel()`. This is the
 * shape downstream semantic tooling should depend on. Unlike `getData()`,
 * it omits element mappings, styles, classes, view (collapsed/expanded),
 * icons, images, and layout hints.
 */
export interface AgentflowSemanticModel {
  /** Top-level diagram direction. */
  direction?: string;
  vertices: SemanticVertex[];
  edges: SemanticEdge[];
  subGraphs: SemanticSubGraph[];
  typeDeclarations: AgentFlowTypeDeclaration[];
  templateDeclarations: AgentFlowTemplateDeclaration[];
  /**
   * Structured warnings/errors raised against this diagram. Diagnostics are
   * semantic analysis output so they belong in the semantic export. Callers
   * should invoke `getData()` (which runs post-parse validators) at least
   * once before reading `getSemanticModel()` if they want the hexagon-
   * branching and similar validators to have fired.
   */
  diagnostics: readonly AgentflowDiagnostic[];
}
