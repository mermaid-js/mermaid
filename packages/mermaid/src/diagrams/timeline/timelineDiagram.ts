import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/timeline.jison';
import * as db from './timelineDb.js';
import renderer from './timelineRenderer.js';
import styles from './timelineStyles.js';

export const diagram: DiagramDefinition = {
  db,
  renderer,
  parser,
  styles,
};
