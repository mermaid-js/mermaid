import type { LayoutData } from '../../rendering-util/types.js';
import type { AgentFlowDB } from './agentflowDb.js';
import { normaliseNodeShapes } from './shapes.js';

export { SHAPE_ALIASES } from './shapes.js';

/**
 * Transform flowchart-generated LayoutData into agentflow-specific form.
 *
 * `AgentFlowDB.getData()` already runs this over the data it returns, so the
 * renderer receives normalised shapes and `mermaid.parse()` followed by
 * `getDiagnostics()` sees the shape diagnostics. This entry point remains for
 * callers holding a `LayoutData` they built some other way.
 *
 * `db` is optional so callers can invoke `transformData` standalone (e.g. in
 * focused tests). When supplied, removed/unsupported-shape problems are emitted
 * as structured `AgentflowDiagnostic`s so conformance fixtures and editor
 * tooling can match on the message ID.
 */
export function transformData(data: LayoutData, db?: AgentFlowDB): void {
  normaliseNodeShapes(data.nodes, db);
}
