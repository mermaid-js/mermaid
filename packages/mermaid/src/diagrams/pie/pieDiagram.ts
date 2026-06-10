import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './pieParser.js';
import { PieDB } from './pieDb.js';
import styles from './pieStyles.js';
import { renderer } from './pieRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new PieDB();
  },
  renderer,
  styles,
};
