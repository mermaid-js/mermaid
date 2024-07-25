import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/parser.jison';
import db from './db.js';
import renderer from './renderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  db,
  renderer,
  parser,
  styles,
};
