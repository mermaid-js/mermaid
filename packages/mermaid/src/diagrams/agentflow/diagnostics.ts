/**
 * Agentflow diagnostics — structured warnings/errors emitted by the DB
 * during parse, post-parse validation, and rendering. Downstream tooling
 * reads these via `AgentFlowDB.getDiagnostics()`.
 *
 * v0.8.1: capability evaluation, the instance-of mechanism, type /
 * template declarations, the `procs` reference shape, and `==>`-based
 * container-edge data flow are all removed. Their diagnostic codes are
 * gone with them. New codes cover the v0.8.1 additions: removed-shape
 * usage, removed-operator usage, reference-edge label rejection, and
 * flow-no-input validation.
 *
 * v0.8.2 (issue #64): the parser no longer performs property-level metadata
 * validation or semantic checks. The IDs it still raises are enumerated in
 * {@link PARSER_EMITTED_DIAGNOSTICS}; everything else stays part of the shared
 * diagnostic vocabulary but is **reserved** — emitted by the semantics module,
 * not by anything in this package. See {@link RESERVED_DIAGNOSTICS}.
 *
 * v0.8.2 (issue #66): `METADATA_KEY_LEGACY_PROMPT` is removed from the
 * vocabulary. `prompt` is not an agentflow metadata key — the canonical key
 * is `instruction` — and nothing aliases, warns about, or rejects it. An
 * authored `prompt` is carried as-is like any other unknown key and surfaces
 * downstream as `METADATA_UNKNOWN_KEY` from the semantics module.
 */

import type { ElementPosition } from './types.js';

/**
 * Stable IDs for every diagnostic the agentflow DB may emit.
 *
 * These IDs are part of the public contract consumed by conformance
 * fixtures (issue #13) and any downstream tooling. Adding new IDs is
 * additive; renaming an existing ID is a breaking change.
 */
export const AgentflowWarning = {
  /**
   * Shape annotation that v0.8.1 does *not* remove explicitly but the
   * renderer doesn't recognise. The renderer falls back to roundedRect.
   * Distinct from `SHAPE_REMOVED`, which is a hard error.
   */
  SHAPE_UNSUPPORTED: 'SHAPE_UNSUPPORTED',
  /**
   * Shape explicitly removed in v0.8.1 (§4.3.3): `doc`, `stadium`,
   * `terminal`, `circle`, `trapezoid`/`inv-trapezoid`, `double-circle`,
   * `typeDeclaration`, `procs`, the five per-kind instance shapes, plus
   * `cylinder`, `ellipse`, `odd`, `lean_left`. Hard error.
   */
  SHAPE_REMOVED: 'SHAPE_REMOVED',
  /**
   * Edge operator removed in v0.8.1 (§5.1): `==>`, `~~`, `-.->`, plus
   * marker variants of `--` (`<-->`, `o--o`, `--o`, `-->>`). Hard error.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  EDGE_OPERATOR_UNSUPPORTED: 'EDGE_OPERATOR_UNSUPPORTED',
  /**
   * A label was authored on a `-.-` reference edge. Per §5.2 reference
   * edges carry no parameter/channel meaning so a label "would not mean
   * anything"; the label is ignored. Warn tier.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  REFERENCE_EDGE_LABEL_REJECTED: 'REFERENCE_EDGE_LABEL_REJECTED',
  /**
   * A `connectorRef` value's prefix (or whole bare-id form) doesn't
   * resolve to a declared `connector`. Per §8.1. Warn-only pre-1.0;
   * error from v1.0.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  CONNECTOR_REF_UNRESOLVED: 'CONNECTOR_REF_UNRESOLVED',
  /**
   * A `connectorRef` value resolves to an id that exists but isn't a
   * connector declaration (it's a vertex, flow, etc.). Per §8.1
   * connectors must be declared with the `connector` keyword. Warn pre-
   * 1.0; error from v1.0.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  CONNECTOR_REF_NOT_A_CONNECTOR: 'CONNECTOR_REF_NOT_A_CONNECTOR',
  /**
   * A known domain metadata key appears on an element kind it isn't
   * declared for per the §10 applicability table (e.g. `params` on a
   * `refdoc`, or `protocol` on a `flow`). Universal keys (`description`,
   * `instruction`, plus structural and presentation controls) are
   * excluded. Warn pre-1.0; error from v1.0.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  METADATA_KEY_MISAPPLIED: 'METADATA_KEY_MISAPPLIED',
  /**
   * Two declarations in the node-or-container namespace (§9) share an
   * id — e.g. two `a["..."]` vertex declarations, or a vertex and a
   * container with the same id. Implicit vertices created by edge
   * resolution do not count as declarations. Warn-only pre-1.0; error
   * from v1.0 behind `agentflow.strictIds`.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  DUPLICATE_ID_NODE: 'DUPLICATE_ID_NODE',
  /**
   * An author declared an id reserved for synthetic renderer output.
   * v0.8.1 keeps `connectors` reserved through pre-1.0 even though the
   * real `connector` keyword removes the synthesised group; reservation
   * stays for forward compat. Warn-only.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  RESERVED_SYNTHETIC_ID: 'RESERVED_SYNTHETIC_ID',
  /**
   * A container's child violates the §3.3 containment matrix. In v0.8.1
   * the matrix is trivial — only `flow` is a container, and it accepts
   * nested `flow` plus any node. Warn-only pre-1.0; error from v1.0
   * behind `agentflow.strictContainment`.
   */
  CONTAINMENT_VIOLATION: 'CONTAINMENT_VIOLATION',
  /**
   * An edge's §5.1 semantic is incompatible with the kinds of its
   * endpoints. v0.8.1 covers two cases:
   *
   * - A `-.-` reference edge has no `refdoc`-shape endpoint (the only
   *   meaningful target for §16.2 reference-document attachment).
   * - A `--x` failure edge originates from a non-flow endpoint.
   *
   * Warn-only pre-1.0; error from v1.0 behind the future
   * `agentflow.strictEdgeSemantics` flag.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  EDGE_SEMANTIC_CONTRADICTION: 'EDGE_SEMANTIC_CONTRADICTION',
  /**
   * A `flow` container's tree contains no input node (`shape: input`,
   * canonical `lean-right`). Per §10.2 a flow must declare its required
   * inputs; the runtime / editor prompts the user for any missing
   * values. Warn pre-1.0; error from v1.0.
   *
   * Reserved — emitted by the semantics module, never by this package.
   */
  FLOW_NO_INPUT: 'FLOW_NO_INPUT',
} as const;

export type AgentflowWarningId = (typeof AgentflowWarning)[keyof typeof AgentflowWarning];

/**
 * The IDs this package actually raises. Everything else in
 * {@link AgentflowWarning} is **reserved**: part of the shared vocabulary, with
 * a stable meaning, but emitted by the semantics module rather than by the
 * parser/DB shipped here.
 *
 * The split is explicit so downstream tooling can tell "will never fire from
 * mermaid" from "may fire from mermaid" instead of building matchers against
 * codes this package cannot produce. `diagnostics.spec.ts` keeps this set
 * honest against the source.
 */
export const PARSER_EMITTED_DIAGNOSTICS: ReadonlySet<AgentflowWarningId> = new Set([
  AgentflowWarning.SHAPE_UNSUPPORTED,
  AgentflowWarning.SHAPE_REMOVED,
  AgentflowWarning.CONTAINMENT_VIOLATION,
]);

/**
 * IDs reserved for the semantics module. Listed here so the reservation is
 * data, not prose: nothing in this package emits them today.
 */
export const RESERVED_DIAGNOSTICS: ReadonlySet<AgentflowWarningId> = new Set(
  (Object.values(AgentflowWarning) as AgentflowWarningId[]).filter(
    (id) => !PARSER_EMITTED_DIAGNOSTICS.has(id)
  )
);

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
