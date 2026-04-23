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
   * An instance shape's `def` resolves to a target whose kind does not
   * match the §11.1 target matrix. Fires for all five shape→kind pairs:
   *   tag-rect  → agent    container
   *   delay     → flow     container
   *   lin-rect  → skill    container
   *   win-pane  → tool     definition (shape: subroutine)
   *   curv-trap → directive container
   *
   * Warn-only in v0.6.0; error from v1.0.
   */
  INSTANCE_KIND_MISMATCH: 'INSTANCE_KIND_MISMATCH',
  /**
   * An instance shape has no resolvable `def`: the metadata key is absent
   * or empty, or points to an identifier that matches neither a vertex nor
   * a subgraph. Per §11.2. Warn-only in v0.6.0; error from v1.0.
   */
  INSTANCE_DEF_MISSING: 'INSTANCE_DEF_MISSING',
  /**
   * An instance's `def` chain cycles back on itself — self-loop or multi-
   * hop. Per §11.2. Warn-only in v0.6.0; error from v1.0.
   */
  INSTANCE_DEF_CYCLE: 'INSTANCE_DEF_CYCLE',
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
  /**
   * A known domain metadata key appears on an element kind it isn't
   * declared for per the §13 applicability table (e.g. `strategy` on
   * `agent`, `model` on `tool`). Universal keys (`description` plus
   * structural and presentation controls) are excluded. Warn-only in
   * v0.5.0; error from v1.0.
   */
  METADATA_KEY_MISAPPLIED: 'METADATA_KEY_MISAPPLIED',
  /**
   * Two declarations in the node-or-container namespace (§10) share an
   * id — e.g. two `a["..."]` vertex declarations, or a vertex and a
   * container with the same id. Implicit vertices created by edge
   * resolution do not count as declarations. Warn-only in v0.5.0;
   * error from v1.0 behind `agentflow.strictIds`.
   */
  DUPLICATE_ID_NODE: 'DUPLICATE_ID_NODE',
  /**
   * Two `type` declarations (§10 types namespace) share a name.
   * Warn-only in v0.5.0; error from v1.0.
   */
  DUPLICATE_ID_TYPE: 'DUPLICATE_ID_TYPE',
  /**
   * Two `template` declarations (§10 templates namespace) share a
   * name. Warn-only in v0.5.0; error from v1.0.
   */
  DUPLICATE_ID_TEMPLATE: 'DUPLICATE_ID_TEMPLATE',
  /**
   * An author declared an id reserved for synthetic renderer output
   * (§10 — `typesGroup`, `templatesGroup`). Warn-only in v0.5.0.
   */
  RESERVED_SYNTHETIC_ID: 'RESERVED_SYNTHETIC_ID',
  /**
   * A semantic reference (§10.1 — `typeRef`, `templateRef`) points to
   * an id that doesn't resolve in the expected namespace. `def` is
   * covered separately by `INSTANCE_DEF_MISSING`; `src` is hygiene-
   * only and is not checked for existence. Warn-only in v0.5.0;
   * error from v1.0.
   */
  REFERENCE_UNRESOLVED: 'REFERENCE_UNRESOLVED',
  /**
   * A `procs` reference node carries two or more of `typeRef`,
   * `templateRef`, `src` — per §10.2, exactly one should be present.
   * Warn-only in v0.5.0; error from v1.0.
   */
  REF_KIND_CONFLICT: 'REF_KIND_CONFLICT',
  /**
   * A `procs` reference node uses the generic legacy `type` metadata
   * key. Per §10.2, authors should use explicit `typeRef` or
   * `templateRef`. The legacy form is accepted for back-compat.
   * Warn-only in v0.5.0; removed in v1.0.
   */
  REF_KIND_LEGACY_DEPRECATED: 'REF_KIND_LEGACY_DEPRECATED',
  /**
   * Legacy `type` on a `procs` node resolves to names declared in BOTH
   * the type and template namespaces — §10.2 trichotomy's ambiguous
   * case. The author must disambiguate with `typeRef` or `templateRef`.
   * Warn-only in v0.5.0; error from v1.0.
   */
  REF_KIND_LEGACY_AMBIGUOUS: 'REF_KIND_LEGACY_AMBIGUOUS',
  /**
   * Legacy `type` on a `procs` node resolves to NEITHER the type nor
   * the template namespace — §10.2 trichotomy's unresolved case.
   * Warn-only in v0.5.0; error from v1.0.
   */
  REF_KIND_LEGACY_UNRESOLVED: 'REF_KIND_LEGACY_UNRESOLVED',
  /**
   * A container's child violates the §3.3 containment matrix — e.g. a
   * tool placed directly inside a directive, or an agent inside a
   * task. The legacy `subgraph` / `group` escape hatches are
   * unrestricted. Warn-only in v0.5.0; error from v1.0 behind the
   * future `agentflow.strictContainment` flag.
   */
  CONTAINMENT_VIOLATION: 'CONTAINMENT_VIOLATION',
  /**
   * An edge's §5.1 primary semantic is incompatible with the kinds of
   * its endpoints. Three specific cases:
   *   - `-->>` (delegation) source is not an agent container.
   *   - `--x`  (failure)    source is not an agent container.
   *   - `--o`  (conformance) target is not a reference node (`procs`).
   *
   * Container-boundary violations for `==>` (data into a container
   * without a `params`/`returns` contract) are covered by PR E's
   * `CONTAINER_EDGE_*` diagnostics and are NOT this ID. Warn-only in
   * v0.5.0; error from v1.0 behind the future
   * `agentflow.legacyEdgeSemantics` flag.
   */
  EDGE_SEMANTIC_CONTRADICTION: 'EDGE_SEMANTIC_CONTRADICTION',
  /**
   * A list-valued metadata key (`permits`, `requires`, `deny`,
   * `fallbacks`, `directives`) was authored as a comma-separated
   * string instead of a YAML array. Per §12.1 the array form is
   * canonical. The string form is accepted and split on commas for
   * validation. Warn-only in v0.5.0; removed in v1.0.
   */
  CAPABILITY_LIST_LEGACY_STRING: 'CAPABILITY_LIST_LEGACY_STRING',
  /**
   * A tool invocation's `requires` includes a capability not in the
   * executing agent's `permits`. Per §12 requires MUST be a subset of
   * permits. Warn-only in v0.5.0; error from v1.0.
   */
  CAPABILITY_MISSING: 'CAPABILITY_MISSING',
  /**
   * A tool's `requires` and its `deny` sets share a capability —
   * invoking it would violate §12's `requires ∩ deny = ∅` rule.
   * Warn-only in v0.5.0; error from v1.0.
   */
  CAPABILITY_DENIED: 'CAPABILITY_DENIED',
  /**
   * A tool invocation site has no enclosing `agent` container, so the
   * §12 executing-agent rule cannot resolve permits. Warn-only in
   * v0.5.0; error from v1.0.
   */
  CAPABILITY_INVOCATION_NO_AGENT: 'CAPABILITY_INVOCATION_NO_AGENT',
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
