import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/block.jison';
import db from './blockDB.js';
import renderer from './blockRenderer.js';

// TODO: do we need this?
// import { prepareTextForParsing } from './blockUtils.js';
// const originalParse = parser.parse.bind(parser);
// parser.parse = (text: string) => originalParse(prepareTextForParsing(text));
// parser.yy.getLogger = () => console;

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
