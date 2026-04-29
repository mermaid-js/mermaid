import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './cynefinParser.js';
import { db } from './cynefinDb.js';
import { renderer } from './cynefinRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
