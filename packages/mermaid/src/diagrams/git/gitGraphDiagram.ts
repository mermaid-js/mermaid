// @ts-ignore: JISON doesn't support types
import { parser } from './gitGraphParser.js';
import { db } from './gitGraphAst.js';
import gitGraphRenderer from './gitGraphRenderer.js';
import gitGraphStyles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer: gitGraphRenderer,
  styles: gitGraphStyles,
};
