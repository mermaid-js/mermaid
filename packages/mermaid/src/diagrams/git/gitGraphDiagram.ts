// @ts-ignore: JISON doesn't support types
import gitGraphParser from './parser/gitGraph.jison';
import gitGraphDb from './gitGraphAst.js';
import gitGraphRenderer from './gitGraphRenderer.js';
import gitGraphStyles from './styles.js';
import { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser: gitGraphParser,
  db: gitGraphDb,
  renderer: gitGraphRenderer,
  styles: gitGraphStyles,
};
