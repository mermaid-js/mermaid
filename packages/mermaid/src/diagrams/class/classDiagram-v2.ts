import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/classDiagram';
import db from './classDb';
import styles from './styles';
import renderer from './classRenderer-v2';

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
