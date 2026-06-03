import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './parser/ebnfParser.js';
import { db } from './railroadDb.js';
import { renderer } from './railroadRenderer.js';
import { getStyles } from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: getStyles,
};
