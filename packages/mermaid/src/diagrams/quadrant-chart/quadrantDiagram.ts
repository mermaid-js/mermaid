import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/quadrant.jison';
import db from './quadrantDb.js';
import styles from './styles.js';
import renderer from './quadrantRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
