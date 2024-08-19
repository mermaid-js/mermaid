// @ts-ignore: JISON doesn't support types
import flowParser from './parser/flow.jison';
import flowDb from './flowDb.js';
import renderer from './flowRenderer-v3-unified.js';
import flowStyles from './styles.js';
import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';

export const diagram = {
  parser: flowParser,
  db: flowDb,
  renderer,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
    flowDb.clear();
    flowDb.setGen('gen-2');
  },
};
