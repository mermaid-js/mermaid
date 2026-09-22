import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { AgentFlowDB } from './agentflowDb.js';
import renderer from './renderer.js';
// @ts-ignore: JISON doesn't support types
import agentflowParser from './parser/agentflowParser.ts';
import agentflowStyles from './styles.js';

export const diagram = {
  parser: agentflowParser,
  get db() {
    return new AgentFlowDB();
  },
  renderer,
  styles: agentflowStyles,
  init: (cnf: MermaidConfig) => {
    cnf.agentflow ??= {};
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    // `rendering-util/rendering-elements/edges.js` only consults the flowchart
    // and state namespaces for `arrowMarkerAbsolute`, so mirror the global flag
    // into `flowchart` to keep absolute marker URLs working. Mirrors what
    // `createFlowDiagram` does.
    cnf.flowchart ??= {};
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
