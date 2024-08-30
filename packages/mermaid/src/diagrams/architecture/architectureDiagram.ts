import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './architectureParser.js';
import { db } from './architectureDb.js';
import styles from './architectureStyles.js';
import { renderer } from './architectureRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
