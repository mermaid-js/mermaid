import type { DiagramDefinition } from '../../diagram-api/types.js';
import parser from './stateParser.js';
import { StateDB } from './stateDb.js';
import styles from './styles.js';
import renderer from './stateRenderer-v3-unified.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new StateDB(2);
  },
  renderer,
  styles,
  init: (cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  },
};
