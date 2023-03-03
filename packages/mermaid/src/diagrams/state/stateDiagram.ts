import { DiagramDefinition } from '../../diagram-api/types.ts';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/stateDiagram.jison';
import db from './stateDb.js';
import styles from './styles.js';
import renderer from './stateRenderer.js';

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
