import type { MermaidConfig } from '../../config.type.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { parser } from './parser/bpmn.chevrotain.js';
import { db } from './bpmnDb.js';
import renderer from './renderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: (cnf: MermaidConfig) => {
    cnf.bpmn ??= {};
    cnf.flowchart ??= {};
    // The layout is not forced here: the schema declares `bpmn.layout: swimlane`, which
    // sits below a user's `layout` or `bpmn.layout` instead of above both.
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
