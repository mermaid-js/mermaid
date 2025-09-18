// @ts-ignore: JISON doesn't support types
import jisonParser from './sequenceDiagram.jison';

// Import the ANTLR parser wrapper
import antlrParser from './antlr/antlr-parser.js';

// Browser-safe environment variable access (same as flowchart parser)
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

const USE_ANTLR_PARSER = true; //getEnvVar('USE_ANTLR_PARSER') === 'false';

// Force logging to window for debugging
if (typeof window !== 'undefined') {
  (window as any).MERMAID_PARSER_DEBUG = {
    USE_ANTLR_PARSER,
    env_value: getEnvVar('USE_ANTLR_PARSER'),
    selected_parser: USE_ANTLR_PARSER ? 'ANTLR' : 'Jison',
  };
}

// eslint-disable-next-line no-console
console.log('🔧 SequenceParser: USE_ANTLR_PARSER =', USE_ANTLR_PARSER);
// eslint-disable-next-line no-console
console.log('🔧 SequenceParser: env USE_ANTLR_PARSER =', getEnvVar('USE_ANTLR_PARSER'));
// eslint-disable-next-line no-console
console.log('🔧 SequenceParser: Selected parser:', USE_ANTLR_PARSER ? 'ANTLR' : 'Jison');

// Create the appropriate parser instance (same pattern as flowchart)
let parserInstance;
if (USE_ANTLR_PARSER) {
  parserInstance = antlrParser;
} else {
  parserInstance = jisonParser;
}

// Create a wrapper that provides the expected interface (same pattern as flowchart)
const newParser = {
  parser: parserInstance,
  parse: (src: string): unknown => {
    // Normalize whitespace like flow does to keep parity with Jison behavior
    const newSrc = src.replace(/}\s*\n/g, '}\n');

    if (USE_ANTLR_PARSER) {
      return antlrParser.parse(newSrc);
    } else {
      return jisonParser.parse(newSrc);
    }
  },
};

export default newParser;
