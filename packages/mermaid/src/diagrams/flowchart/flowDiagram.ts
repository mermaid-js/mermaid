import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { FlowDB } from './flowDb.js';
import renderer from './flowRenderer-v3-unified.js';
// Replace the Jison import with Chevrotain parser
import flowParserJison from './parser/flow.jison';
import flowParser from './parser/flowParserAdapter.js';
import flowStyles from './styles.js';

// Create a singleton FlowDB instance that the parser can populate
// This ensures the same instance is used by both parser and renderer
let flowDbInstance: FlowDB | null = null;

export const diagram = {
  parser: flowParser,
  get db() {
    // Return the same FlowDB instance that the parser uses
    // This is critical for the Chevrotain parser to work correctly
    flowDbInstance ??= new FlowDB();
    return flowDbInstance;
  },
  renderer,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
    cnf.flowchart ??= {};
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });

    // Reset the FlowDB instance for new diagrams
    flowDbInstance = null;
  },
};
