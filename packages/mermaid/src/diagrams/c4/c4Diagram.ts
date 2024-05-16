import type { DiagramDefinition } from '../../diagram-api/types.js';
import db from './c4Db.js';
import renderer from './c4Renderer.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/c4Diagram.jison';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: ({ c4, wrap }) => {
    renderer.setConf(c4);
    db.setWrap(wrap);
  },
};
