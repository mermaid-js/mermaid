// @ts-ignore: JISON doesn't support types
import parser from './parser/kanban.jison';
import db from './kanbanDb.js';
import renderer from './kanbanRenderer.js';
import styles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  db,
  renderer,
  parser,
  styles,
};
