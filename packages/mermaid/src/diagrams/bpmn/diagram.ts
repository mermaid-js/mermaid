import type { MermaidConfig } from '../../config.type.js';
import { getUserDefinedConfig } from '../../config.js';
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
    // The swimlane engine is the only layout that treats lane membership as a placement
    // constraint, so it is the default here. A layout the user asked for still wins,
    // which is the same precedence `createFlowDiagram` uses for `swimlane-beta`.
    const layout = getUserDefinedConfig().layout ?? 'swimlane';
    setConfig({ layout });
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
