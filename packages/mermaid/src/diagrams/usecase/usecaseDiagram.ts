import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './usecaseParser.js';
import { db } from './usecaseDb.js';
import { renderer } from './usecaseRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
