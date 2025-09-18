// @ts-ignore: JISON parser lacks type definitions
import jisonParser from './classDiagram.jison';
import antlrParser from './antlr/antlr-parser.js';

const USE_ANTLR_PARSER = process.env.USE_ANTLR_PARSER === 'true';

const baseParser: any = USE_ANTLR_PARSER ? antlrParser : jisonParser;

const selectedParser: any = Object.create(baseParser);

selectedParser.parse = (source: string): unknown => {
  const normalized = source.replace(/\r\n/g, '\n');
  if (USE_ANTLR_PARSER) {
    return antlrParser.parse(normalized);
  }
  return jisonParser.parse(normalized);
};

Object.defineProperty(selectedParser, 'yy', {
  get() {
    return baseParser.yy;
  },
  set(value) {
    baseParser.yy = value;
  },
  enumerable: true,
  configurable: true,
});

export default selectedParser;
export const parser = selectedParser;
