import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { FlowDB } from './flowDb.js';
import renderer from './flowRenderer-v3-unified.js';
// @ts-ignore: JISON doesn't support types
//import flowParser from './parser/flow.jison';
import flowParser from './parser/flowParser.ts';
import flowStyles from './styles.js';

interface FlowDiagramOptions {
  styles?: typeof flowStyles;
}

export const createFlowDiagram = ({
  styles = flowStyles,
}: FlowDiagramOptions = {}): DiagramDefinition => ({
  parser: flowParser,
  get db() {
    return new FlowDB();
  },
  renderer,
  styles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    // The layout is not forced here: swimlanes declare `layout: swimlane` in the schema,
    // which puts it below a user's `layout` or `swimlane.layout` instead of above both.
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
});

export const diagram = createFlowDiagram();
