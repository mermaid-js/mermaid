// @ts-ignore: TODO Fix ts errors
import flowParser from './parser/flow.jison';
import flowDb from './flowDb.js';
import flowRenderer from './flowRenderer.js';
import flowRendererV2 from './flowRenderer-v2.js';
import flowStyles from './styles.js';
import { MermaidConfig } from '../../config.type.js';

export const diagram = {
  parser: flowParser,
  db: flowDb,
  renderer: flowRendererV2,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
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
