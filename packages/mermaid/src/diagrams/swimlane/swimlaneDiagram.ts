import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import swimlaneDb from './swimlaneDb.js';
import renderer from './swimlaneRenderer.js';
// @ts-ignore: JISON doesn't support types
import swimlaneParser from './parser/swimlane.jison';
import swimlaneStyles from './styles.js';

export const diagram = {
  parser: swimlaneParser,
  db: swimlaneDb,
  renderer,
  styles: swimlaneStyles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
    swimlaneDb.clear();
    swimlaneDb.setGen('gen-2');
  },
};
