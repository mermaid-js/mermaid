import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/requirementDiagram.jison';
import db from './requirementDb.js';
import styles from './styles.js';
import renderer from './requirementRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
