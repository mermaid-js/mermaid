import type { DiagramDefinition } from '../../diagram-api/types.js';
import { MarbleDB } from './marbleDb.js';
import { parser } from './parser/marble.chevrotain.js';
import { renderer } from './marbleRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new MarbleDB();
  },
  renderer,
  styles,
};
