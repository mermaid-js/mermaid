import type { DiagramDefinition } from '../../diagram-api/types.js';
import { db } from './db.js';
import { parser } from './parser/timing.chevrotain.js';
import { renderer } from './renderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  db,
  parser,
  renderer,
  styles,
};
