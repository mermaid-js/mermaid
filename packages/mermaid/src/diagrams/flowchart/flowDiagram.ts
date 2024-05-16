import type { DiagramDefinition } from '../../diagram-api/types.js';
import flowDb from './flowDb.js';
import flowRendererV2 from './flowRenderer-v2.js';
import flowRenderer from './flowRenderer.js';
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
    // TODO, broken as of 2022-09-14 (13809b50251845475e6dca65cc395761be38fbd2)
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    flowRenderer.setConf(cnf.flowchart);
    flowDb.clear();
    flowDb.setGen('gen-1');
  },
};
