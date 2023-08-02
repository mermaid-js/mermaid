import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/pie.jison';
import { db } from './pieDb.js';
import styles from './styles.js';
import { renderer } from './pieRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
