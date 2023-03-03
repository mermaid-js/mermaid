import { DiagramDefinition } from '../../diagram-api/types.ts';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/classDiagram.jison';
import db from './classDb.ts';
import styles from './styles.js';
import renderer from './classRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: (cnf) => {
    if (!cnf.class) {
      cnf.class = {};
    }
    cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    db.clear();
  },
};
