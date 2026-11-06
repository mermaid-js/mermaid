import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/sankey.jison';
import db from './sankeyDB.js';
import renderer from './sankeyRenderer.js';
import { remapParseErrorLines } from '../../diagram-api/sourceLines.js';
import { prepareTextForParsing, sourceLinesOfPreparedText } from './sankeyUtils.js';
import sankeyStyles from './styles.js';

const originalParse = parser.parse.bind(parser);
parser.parse = (text: string) => {
  try {
    return originalParse(prepareTextForParsing(text));
  } catch (error) {
    remapParseErrorLines(error, sourceLinesOfPreparedText(text));
    throw error;
  }
};

export const diagram: DiagramDefinition = {
  styles: sankeyStyles,
  parser,
  db,
  renderer,
};
