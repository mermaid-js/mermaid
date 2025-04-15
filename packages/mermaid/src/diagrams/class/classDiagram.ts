import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/classDiagram.jison';
import { ClassDB } from './classDb.js';
import styles from './styles.js';
import renderer from './classRenderer-v3-unified.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new ClassDB();
  },
  renderer,
  styles,
  init: (cnf) => {
    if (!cnf.class) {
      cnf.class = {};
    }
    cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  },
};
