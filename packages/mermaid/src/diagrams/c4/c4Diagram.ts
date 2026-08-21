// @ts-ignore: JISON doesn't support types
import parser from './parser/c4Diagram.jison';
import db from './c4Db.js';
import renderer from './c4Renderer.js';
import styles from './styles.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import type { MermaidConfig } from '../../config.type.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.c4) {
      cnf.c4 = {};
    }
    if (cnf.wrap !== undefined) {
      cnf.c4.wrap = cnf.wrap;
      setConfig({ c4: { wrap: cnf.wrap } });
    }
    renderer.setConf(cnf.c4);
    db.setWrap(cnf.c4.wrap);
  },
};
