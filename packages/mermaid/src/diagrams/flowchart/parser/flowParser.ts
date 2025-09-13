// @ts-ignore: JISON doesn't support types
import flowJisonParser from './flow.jison';
import antlrParser from './antlr/antlr-parser.js';

// Configuration flag to switch between parsers
// Set to true to test ANTLR parser, false to use original Jison parser
const USE_ANTLR_PARSER = process.env.USE_ANTLR_PARSER === 'true';

const newParser = Object.assign({}, USE_ANTLR_PARSER ? antlrParser : flowJisonParser);

newParser.parse = (src: string): unknown => {
  // remove the trailing whitespace after closing curly braces when ending a line break
  const newSrc = src.replace(/}\s*\n/g, '}\n');

  if (USE_ANTLR_PARSER) {
    return antlrParser.parse(newSrc);
  } else {
    return flowJisonParser.parse(newSrc);
  }
};

export default newParser;
