// @ts-ignore: JISON doesn't support types
import { parser } from './parser.js';
import { db } from './db.js';
import renderer from './renderer.js';
import styles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer: renderer,
  styles: styles,
};
