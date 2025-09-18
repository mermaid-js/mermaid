// @ts-ignore: JISON doesn't support types
import flowJisonParser from './flow.jison';
import { ANTLRFlowParser } from './antlr/antlr-parser.ts';

// Configuration flag to switch between parsers
// Set to true to test ANTLR parser, false to use original Jison parser
// Browser-safe environment variable access
const getEnvVar = (name: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
  } catch (_e) {
    // process is not defined in browser, continue to browser checks
  }

  // In browser, check for global variables or default values
  if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
    return (window as any).MERMAID_CONFIG[name];
  }
  // Default to ANTLR parser in browser if no config is found
  if (typeof window !== 'undefined' && name === 'USE_ANTLR_PARSER') {
    return 'true';
  }
  return undefined;
};

const USE_ANTLR_PARSER = getEnvVar('USE_ANTLR_PARSER') === 'true';

// Force logging to window for debugging
if (typeof window !== 'undefined') {
  (window as any).MERMAID_PARSER_DEBUG = {
    USE_ANTLR_PARSER,
    env_value: getEnvVar('USE_ANTLR_PARSER'),
    selected_parser: USE_ANTLR_PARSER ? 'ANTLR' : 'Jison',
  };
}

// eslint-disable-next-line no-console
console.log('🔧 FlowParser: USE_ANTLR_PARSER =', USE_ANTLR_PARSER);
// eslint-disable-next-line no-console
console.log('🔧 FlowParser: env USE_ANTLR_PARSER =', getEnvVar('USE_ANTLR_PARSER'));
// eslint-disable-next-line no-console
console.log('🔧 FlowParser: Selected parser:', USE_ANTLR_PARSER ? 'ANTLR' : 'Jison');

// Create the appropriate parser instance
let parserInstance;
if (USE_ANTLR_PARSER) {
  parserInstance = new ANTLRFlowParser();
} else {
  parserInstance = flowJisonParser;
}

// Create a wrapper that provides the expected interface
const newParser = {
  parser: parserInstance,
  parse: (src: string): unknown => {
    // remove the trailing whitespace after closing curly braces when ending a line break
    const newSrc = src.replace(/}\s*\n/g, '}\n');

    if (USE_ANTLR_PARSER) {
      return parserInstance.parse(newSrc);
    } else {
      return flowJisonParser.parse(newSrc);
    }
  },
};

export default newParser;
