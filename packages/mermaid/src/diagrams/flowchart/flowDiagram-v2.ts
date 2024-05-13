import { setConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import flowDb from './flowDb.js';
import flowRendererV2 from './flowRenderer-v2.js';
// @ts-ignore: JISON doesn't support types
import flowParser from './parser/flow.jison';
import flowStyles from './styles.js';

export const diagram: DiagramDefinition = {
  parser: flowParser,
  db: flowDb,
  renderer: flowRendererV2,
  styles: flowStyles,
  init: (cnf) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    // flowchart-v2 uses dagre-wrapper, which doesn't have access to flowchart cnf
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
    flowRendererV2.setConf(cnf.flowchart);
    flowDb.clear();
    flowDb.setGen('gen-2');
  },
};
