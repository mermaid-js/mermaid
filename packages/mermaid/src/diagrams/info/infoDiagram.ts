import { DiagramDefinition } from '../../diagram-api/types.ts';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/info.jison';
import db from './infoDb.js';
import styles from './styles.js';
import renderer from './infoRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
