// @ts-ignore: JISON doesn't support types
import { parser } from './gitGraphParser.js';
import gitGraphDb from './gitGraphAst.js';
import gitGraphRenderer from './gitGraphRenderer.js';
import gitGraphStyles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser: parser,
  db: gitGraphDb,
  renderer: gitGraphRenderer,
  styles: gitGraphStyles,
};
