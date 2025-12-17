import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './parser/railroadParser.js';
import { db } from './railroadDb.js';
import { renderer } from './railroadRenderer.js';
import { getStyles } from './styles.js';

/**
 * Railroad Diagram Definition
 * Provides railroad diagram visualization for EBNF grammars
 */
export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: getStyles,
};

export default diagram;
