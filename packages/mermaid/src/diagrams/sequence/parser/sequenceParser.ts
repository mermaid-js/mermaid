// @ts-ignore: JISON doesn't support types
import jisonParser from './sequenceDiagram.jison';

// Import the ANTLR parser wrapper (safe stub for now)
import antlrParser from './antlr/antlr-parser.js';

// Configuration flag to switch between parsers (same convention as flowcharts)
const USE_ANTLR_PARSER = process.env.USE_ANTLR_PARSER === 'true';

const newParser: any = Object.assign({}, USE_ANTLR_PARSER ? antlrParser : jisonParser);

newParser.parse = (src: string): unknown => {
  // Normalize whitespace like flow does to keep parity with Jison behavior
  const newSrc = src.replace(/}\s*\n/g, '}\n');

  if (USE_ANTLR_PARSER) {
    return antlrParser.parse(newSrc);
  } else {
    return jisonParser.parse(newSrc);
  }
};

export default newParser;
