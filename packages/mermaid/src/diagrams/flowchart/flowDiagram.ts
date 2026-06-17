import type { MermaidConfig } from '../../config.type.js';
import { getUserDefinedConfig } from '../../config.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { FlowDB } from './flowDb.js';
import renderer from './flowRenderer-v3-unified.js';
// @ts-ignore: JISON doesn't support types
//import flowParser from './parser/flow.jison';
import flowParser from './parser/flowParser.ts';
import flowStyles from './styles.js';

interface FlowDiagramOptions {
  defaultLayout?: string;
  styles?: typeof flowStyles;
}

export const createFlowDiagram = ({
  defaultLayout,
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
    const layout = getUserDefinedConfig().layout ?? defaultLayout ?? cnf.layout;
    if (layout) {
      setConfig({ layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
});

export const diagram = createFlowDiagram();
