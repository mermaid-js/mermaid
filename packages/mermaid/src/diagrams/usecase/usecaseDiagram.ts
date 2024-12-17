import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/usecase.jison';
import db from './usecaseDB.js';
import renderer from './usecaseRenderer.js';
import { prepareTextForParsing } from './usecaseUtils.js';

const originalParse = parser.parse.bind(parser);
parser.parse = (text: string) => originalParse(prepareTextForParsing(text));

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
