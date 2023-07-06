import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './railroadParser.jison';
import { db } from './railroadDB.js';
import renderer from './railroadRenderer.js';
// import { prepareTextForParsing } from './railroadUtils.js';

// const originalParse = parser.parse.bind(parser);
// parser.parse = (text: string) => originalParse(prepareTextForParsing(text));

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
