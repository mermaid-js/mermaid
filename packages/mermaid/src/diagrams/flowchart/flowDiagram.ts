// @ts-ignore: TODO Fix ts errors
import flowParser from './parser/flow';
import flowDb from './flowDb';
import flowRenderer from './flowRenderer';
import flowRendererV2 from './flowRenderer-v2';
import flowStyles from './styles';
import { MermaidConfig } from '../../config.type';

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
