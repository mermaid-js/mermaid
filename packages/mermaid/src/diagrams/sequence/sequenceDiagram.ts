import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/sequenceDiagram.jison';
import { SequenceDB } from './sequenceDb.js';
import styles from './styles.js';
import renderer from './sequenceRenderer.js';

let db: SequenceDB;

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    if (!db) {
      db = new SequenceDB();
    }
    return db;
  },
  renderer,
  styles,
  init: ({ wrap }) => {
    db.setWrap(wrap);
  },
};
