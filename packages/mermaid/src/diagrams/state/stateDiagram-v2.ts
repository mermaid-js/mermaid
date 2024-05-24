import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/stateDiagram.jison';
import db from './stateDb.js';
import styles from './styles.js';
//import renderer from './stateRenderer-v2.js';
import renderer from './stateRenderer-v3-unified.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: (cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    db.clear();
  },
};
