// @ts-ignore: JISON doesn't support types
import flowJisonParser from './flow.jison';
import antlrParser from './antlr/antlr-parser.ts';

// Configuration flag to switch between parsers
// Set to true to test ANTLR parser, false to use original Jison parser
const USE_ANTLR_PARSER = process.env.USE_ANTLR_PARSER === 'true';

// Force logging to window for debugging
if (typeof window !== 'undefined') {
  window.MERMAID_PARSER_DEBUG = {
    USE_ANTLR_PARSER,
    env_value: process.env.USE_ANTLR_PARSER,
    selected_parser: USE_ANTLR_PARSER ? 'ANTLR' : 'Jison',
  };
}

console.log('🔧 FlowParser: USE_ANTLR_PARSER =', USE_ANTLR_PARSER);
console.log('🔧 FlowParser: process.env.USE_ANTLR_PARSER =', process.env.USE_ANTLR_PARSER);
console.log('🔧 FlowParser: Selected parser:', USE_ANTLR_PARSER ? 'ANTLR' : 'Jison');

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
