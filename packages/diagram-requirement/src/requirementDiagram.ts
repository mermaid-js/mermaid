import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/requirementDiagram.jison';
import { RequirementDB } from './requirementDb.js';
import styles from './styles.js';
import * as renderer from './requirementRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new RequirementDB();
  },
  renderer,
  styles,
};
