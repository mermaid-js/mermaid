import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/sankey.jison';
import db from './sankeyDB.js';
import renderer from './sankeyRenderer.js';
import { prepareTextForParsing } from './sankeyUtils.js';
import sankeyStyles from './styles.js';

const originalParse = parser.parse.bind(parser);
parser.parse = (text: string) => originalParse(prepareTextForParsing(text));

export const diagram: DiagramDefinition = {
  styles: sankeyStyles,
  parser,
  db,
  renderer,
};
