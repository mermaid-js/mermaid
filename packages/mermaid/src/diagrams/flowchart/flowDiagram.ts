import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { FlowDB } from './flowDb.js';
import renderer from './flowRenderer-v3-unified.js';
import { getFlowchartParser } from './parser/parserFactory.js';
import flowStyles from './styles.js';

// Create a parser wrapper that handles dynamic parser selection
const parserWrapper = {
  async parse(text: string): Promise<void> {
    const parser = await getFlowchartParser();
    return parser.parse(text);
  },
  get parser() {
    // This is for compatibility with existing code that expects parser.yy
    return {
      yy: new FlowDB(),
    };
  },
};

export const diagram = {
  parser: parserWrapper,
  get db() {
    return new FlowDB();
  },
  renderer,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
    cnf.flowchart ??= {};
    // Set default parser if not specified
    cnf.flowchart.parser ??= 'jison';
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
