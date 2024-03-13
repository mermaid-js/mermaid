import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/architecture.jison';
import { db } from './architectureDb.js';
import styles from './architectureStyles.js';
import { renderer } from './architectureRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
