/**
 * Agentflow diagnostics — structured warnings/errors emitted by the DB
 * during parse, post-parse validation, and rendering. Downstream tooling
 * reads these via `AgentFlowDB.getDiagnostics()`.
 *
 * The ID set is intentionally small at v0.5.0. More IDs arrive with the
 * later wave-1 and wave-3 validators (hexagon branching, identifier
 * uniqueness, metadata applicability, containment, capability
 * evaluation, edge-semantic contradictions).
 */

import type { ElementPosition } from './types.js';

/**
 * Stable IDs for every diagnostic the agentflow DB may emit.
 *
 * These IDs are part of the public contract consumed by conformance
 * fixtures (issue #13) and any downstream tooling. Adding new IDs is
 * additive; renaming an existing ID is a breaking change and requires
 * a revision entry in `AGENTFLOW-SYNTAX.md`.
 */
export const AgentflowWarning = {
  /** Shape annotation outside the allowed set; renderer fell back to roundedRect. */
  SHAPE_UNSUPPORTED: 'SHAPE_UNSUPPORTED',
  /**
   * A `hexagon` classification source had multiple branch-labelled
   * outgoing edges (§4.2 — only `diamond` is a branching vertex).
   * Emitted by PR 2c; reserved here.
   */
  HEXAGON_MULTI_BRANCH: 'HEXAGON_MULTI_BRANCH',
  /**
   * A `win-pane` instance's `def` resolves to a node that is not a
   * tool definition (§8 / §11.2). Per the spec, win-pane may
   * reference only nodes whose resolved shape is `subroutine` (or an
   * accepted alias). Wave-2 PR 4 will extend this validator to cover
   * the other four instance shape→kind pairs.
   */
  INSTANCE_KIND_MISMATCH: 'INSTANCE_KIND_MISMATCH',
  /**
   * A `connectorRef` metadata value (§9.1) is a bare id that doesn't
   * resolve to any node in the diagram. Catches typos. Warn-only in
   * v0.5.0; error from v1.0.
   */
  CONNECTOR_REF_UNRESOLVED: 'CONNECTOR_REF_UNRESOLVED',
  /**
   * A `connectorRef` metadata value (§9.1) is a bare id that resolves
   * to an existing node, but that node carries none of the connector
   * configuration fields (`protocol`, `endpoint`, `transport`,
   * `command`, `auth`, `token_required`) so it isn't a connector-
   * designated node per §9.2. Warn-only in v0.5.0; error from v1.0.
   */
  CONNECTOR_REF_NOT_A_CONNECTOR: 'CONNECTOR_REF_NOT_A_CONNECTOR',
} as const;

export type AgentflowWarningId = (typeof AgentflowWarning)[keyof typeof AgentflowWarning];

/**
 * A single diagnostic. `nodeId` / `edgeId` and `position` are best-effort
 * context: fixtures match on `id` and may assert on `nodeId` or `position`
 * when they are populated. Downstream tooling should treat unknown IDs as
 * opaque strings and preserve them through serialisation.
 */
export interface AgentflowDiagnostic {
  id: AgentflowWarningId;
  severity: 'warning' | 'error';
  message: string;
  nodeId?: string;
  edgeId?: string;
  position?: ElementPosition;
}

/** Caller-supplied context for a diagnostic. Either `nodeId` or `edgeId`
 *  (or neither) — setting both is not supported and the edgeId is ignored
 *  if `nodeId` is also present. */
export interface AgentflowDiagnosticContext {
  nodeId?: string;
  edgeId?: string;
}
