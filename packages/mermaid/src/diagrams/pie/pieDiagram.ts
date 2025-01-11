import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './pieParser.js';
import { db } from './pieDb.js';
import styles from './pieStyles.js';
import { renderer } from './pieRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
