import type { FlowDB } from '../diagrams/flowchart/flowDb.js';
import type { ThreatModel } from './model.js';

/** Require explicit edge IDs so reordering the diagram cannot retarget a threat. */
export function validateFlowchart(model: ThreatModel, db: FlowDB): void {
  const nodes = db.getVertices();
  const edges = new Set(
    db
      .getEdges()
      .filter((edge) => edge.isUserDefinedId)
      .map((edge) => edge.id)
  );
  const boundaries = new Set(db.getSubGraphs().map((group) => group.id));
  for (const element of model.elements) {
    const found =
      element.kind === 'flow'
        ? edges.has(element.id)
        : element.kind === 'boundary'
          ? boundaries.has(element.id)
          : nodes.has(element.id) && !boundaries.has(element.id);
    if (!found) {
      throw new Error(
        `Threat model element ${element.id}: no matching ${element.kind} in the flowchart (flows require explicit edge IDs)`
      );
    }
  }
}
