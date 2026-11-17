import type { DiagramDefinition } from '../../diagram-api/types.js';
import { db } from './componentDb.js';
import { parser } from './parser/component.chevrotain.js';
import { renderer } from './componentRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
