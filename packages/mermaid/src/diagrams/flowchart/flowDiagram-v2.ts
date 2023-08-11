// @ts-ignore: JISON doesn't support types
import flowParser from './parser/flow.jison';
import flowDb from './flowDb.js';
import flowRendererV2 from './flowRenderer-v2.js';
import flowStyles from './styles.js';
import { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../config.js';

export const diagram = {
  parser: flowParser,
  db: flowDb,
  renderer: flowRendererV2,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
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
