import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/sankey.jison';
import db from './sankeyDB.js';
import styles from './styles.js';
import renderer from './sankeyRenderer.js';
import { prepareTextForParsing } from './sankeyUtils.js';

const originalParse = parser.parse.bind(parser);
parser.parse = (text: string) => originalParse(prepareTextForParsing(text));

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
