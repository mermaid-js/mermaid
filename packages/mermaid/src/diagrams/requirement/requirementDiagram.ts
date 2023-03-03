import { DiagramDefinition } from '../../diagram-api/types.ts';
// @ts-ignore: TODO Fix ts errors
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
