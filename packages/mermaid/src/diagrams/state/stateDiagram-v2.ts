import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/stateDiagram';
import db from './stateDb';
import styles from './styles';
import renderer from './stateRenderer-v2';

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
