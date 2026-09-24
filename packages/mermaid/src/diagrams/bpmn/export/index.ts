import type { BpmnModel } from '../bpmnTypes.js';
import { db } from '../bpmnDb.js';
import { parser } from '../parser/bpmn.chevrotain.js';
import { bpmnModelToXml } from './toBpmnXml.js';

export { bpmnModelToXml } from './toBpmnXml.js';
export { layoutForExport } from './layout.js';
export type { ExportLayout, Box } from './layout.js';

/**
 * One-way BPMN 2.0 XML export (DSL to XML) with a BPMNDI section, so the result
 * opens laid-out in bpmn.io / Camunda Modeler.
 *
 * API note: Mermaid has no precedent for a per-diagram export on its public API,
 * so this ships as a separable module under `diagrams/bpmn/export/`. It can later
 * be surfaced on the public API (e.g. `mermaid.bpmn.toXml`) without changing the
 * implementation.
 */
export async function toBpmnXml(dsl: string): Promise<string> {
  await parser.parse(dsl);
  return bpmnModelToXml(db.getModel());
}

export function modelToBpmnXml(model: BpmnModel): string {
  return bpmnModelToXml(model);
}
