import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/sequenceDiagram.jison';
import db from './sequenceDb.js';
import styles from './styles.js';
import renderer from './sequenceRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
