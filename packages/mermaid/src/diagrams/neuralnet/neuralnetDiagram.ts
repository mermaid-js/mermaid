import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './neuralnetParser.js';
import { db } from './neuralnetDb.js';
import { renderer } from './neuralnetRenderer.js';
import styles from './neuralnetStyles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
