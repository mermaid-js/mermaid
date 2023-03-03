import { DiagramDefinition } from '../../diagram-api/types.ts';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/journey.jison';
import db from './journeyDb.js';
import styles from './styles.js';
import renderer from './journeyRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: (cnf) => {
    renderer.setConf(cnf.journey);
    db.clear();
  },
};
