// @ts-ignore: TODO Fix ts errors
import flowParser from './parser/flow';
import flowDb from './flowDb';
import flowRendererV2 from './flowRenderer-v2';
import flowStyles from './styles';
import { MermaidConfig } from '../../config.type';
import { setConfig } from '../../config';

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
