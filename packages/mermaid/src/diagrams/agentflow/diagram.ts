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
    cnf.flowchart ??= {};
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
