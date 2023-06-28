import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/classDiagram.jison';
import classDb from './classDb.js';
import styles from './styles.js';
import renderer from './classRenderer-v2.js';

export const diagram: DiagramDefinition = {
  parser,
  db: classDb,
  renderer,
  styles,
  init: (cnf) => {
    if (!cnf.class) {
      cnf.class = {};
    }
    cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    classDb.clear();
  },
};
