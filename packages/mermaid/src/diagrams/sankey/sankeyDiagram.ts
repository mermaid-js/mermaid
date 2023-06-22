import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/sankey.jison';
import db from './sankeyDB.js';
import styles from './styles.js';
import renderer from './sankeyRenderer.js';

export const prepareTextForParsing = (text: string): string => {
  const textToParse = text
    .replaceAll(/^[^\S\r\n]+|[^\S\r\n]+$/g, '') // remove all trailing spaces for each row
    .replaceAll(/([\n\r])+/g, '\n') // remove empty lines duplicated
    .trim();

  return textToParse;
};

const originalParse = parser.parse.bind(parser);
parser.parse = (text: string) => originalParse(prepareTextForParsing(text));

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
