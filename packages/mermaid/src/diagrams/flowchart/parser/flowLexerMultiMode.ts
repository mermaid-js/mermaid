import { createToken, Lexer } from 'chevrotain';

// Define lexer mode names following JISON states
const MODES = {
  DEFAULT: 'default_mode',
  STRING: 'string_mode',
  MD_STRING: 'md_string_mode',
  ACC_TITLE: 'acc_title_mode',
  ACC_DESCR: 'acc_descr_mode',
  ACC_DESCR_MULTILINE: 'acc_descr_multiline_mode',
  DIR: 'dir_mode',
  VERTEX: 'vertex_mode',
  TEXT: 'text_mode',
  ELLIPSE_TEXT: 'ellipseText_mode',
  TRAP_TEXT: 'trapText_mode',
  EDGE_TEXT: 'edgeText_mode',
  THICK_EDGE_TEXT: 'thickEdgeText_mode',
  DOTTED_EDGE_TEXT: 'dottedEdgeText_mode',
  CLICK: 'click_mode',
  HREF: 'href_mode',
  CALLBACK_NAME: 'callbackname_mode',
  CALLBACK_ARGS: 'callbackargs_mode',
  SHAPE_DATA: 'shapeData_mode',
  SHAPE_DATA_STR: 'shapeDataStr_mode',
  SHAPE_DATA_END_BRACKET: 'shapeDataEndBracket_mode',
};

// Whitespace and comments (skipped in all modes)
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const Comment = createToken({
  name: 'Comment',
  pattern: /%%[^\n]*/,
  group: Lexer.SKIPPED,
});

// Keywords - following JISON patterns exactly
const Graph = createToken({
  name: 'Graph',
  pattern: /graph|flowchart|flowchart-elk/i,
});

const Direction = createToken({
  name: 'Direction',
  pattern: /direction/i,
});

const Subgraph = createToken({
  name: 'Subgraph',
  pattern: /subgraph/i,
});

const End = createToken({
  name: 'End',
  pattern: /end/i,
});

// Mode switching tokens - following JISON patterns exactly

// Links with edge text - following JISON lines 154-164
const LINK = createToken({
  name: 'LINK',
  pattern: /\s*[<ox]?--+[>ox-]\s*/,
});

const START_LINK = createToken({
  name: 'START_LINK',
  pattern: /\s*[<ox]?--\s*/,
});

const THICK_LINK = createToken({
  name: 'THICK_LINK',
  pattern: /\s*[<ox]?==+[=>ox]\s*/,
});

const START_THICK_LINK = createToken({
  name: 'START_THICK_LINK',
  pattern: /\s*[<ox]?==\s*/,
});

const DOTTED_LINK = createToken({
  name: 'DOTTED_LINK',
  pattern: /\s*[<ox]?-?\.+-[>ox]?\s*/,
});

const START_DOTTED_LINK = createToken({
  name: 'START_DOTTED_LINK',
  pattern: /\s*[<ox]?-\.\s*/,
});

// Edge text tokens
const EDGE_TEXT = createToken({
  name: 'EDGE_TEXT',
  pattern: /[^-]+/,
});

// Shape tokens that trigger text mode - following JISON lines 272-283
const PIPE = createToken({
  name: 'PIPE',
  pattern: /\|/,
});

const PS = createToken({
  name: 'PS',
  pattern: /\(/,
});

const PE = createToken({
  name: 'PE',
  pattern: /\)/,
});

const SQS = createToken({
  name: 'SQS',
  pattern: /\[/,
});

const SQE = createToken({
  name: 'SQE',
  pattern: /]/,
});

const DIAMOND_START = createToken({
  name: 'DIAMOND_START',
  pattern: /{/,
});

const DIAMOND_STOP = createToken({
  name: 'DIAMOND_STOP',
  pattern: /}/,
});

// Text content - following JISON line 283
const TEXT = createToken({
  name: 'TEXT',
  pattern: /[^"()[\]{|}]+/,
});

// Node string - simplified pattern for now
const NODE_STRING = createToken({
  name: 'NODE_STRING',
  pattern: /[\w!"#$%&'*+./?\\`]+/,
});

// Basic tokens
const NUM = createToken({
  name: 'NUM',
  pattern: /\d+/,
});

const MINUS = createToken({
  name: 'MINUS',
  pattern: /-/,
});

const AMP = createToken({
  name: 'AMP',
  pattern: /&/,
});

const SEMI = createToken({
  name: 'SEMI',
  pattern: /;/,
});

const COMMA = createToken({
  name: 'COMMA',
  pattern: /,/,
});

const COLON = createToken({
  name: 'COLON',
  pattern: /:/,
});

const QUOTE = createToken({
  name: 'QUOTE',
  pattern: /"/,
});

const NEWLINE = createToken({
  name: 'NEWLINE',
  pattern: /(\r?\n)+/,
});

const SPACE = createToken({
  name: 'SPACE',
  pattern: /\s/,
});

// Create a simple single-mode lexer for now
const allTokens = [
  // Whitespace and comments (skipped)
  WhiteSpace,
  Comment,

  // Keywords
  Graph,
  Direction,
  Subgraph,
  End,

  // Links (must come before MINUS)
  LINK,
  START_LINK,
  THICK_LINK,
  START_THICK_LINK,
  DOTTED_LINK,
  START_DOTTED_LINK,

  // Shapes
  PS, // (
  PE, // )
  SQS, // [
  SQE, // ]
  DIAMOND_START, // {
  DIAMOND_STOP, // }
  PIPE, // |

  // Text and identifiers
  NODE_STRING,
  TEXT,
  NUM,

  // Single characters
  NEWLINE,
  SPACE,
  SEMI,
  COMMA,
  COLON,
  AMP,
  MINUS,
  QUOTE,
];

// Create simple single-mode lexer
const FlowchartMultiModeLexer = new Lexer(allTokens);

// Export tokens and lexer
export {
  FlowchartMultiModeLexer,
  MODES,
  // Export all tokens
  Graph,
  Direction,
  Subgraph,
  End,
  LINK,
  START_LINK,
  THICK_LINK,
  START_THICK_LINK,
  DOTTED_LINK,
  START_DOTTED_LINK,
  EDGE_TEXT,
  PIPE,
  PS,
  PE,
  SQS,
  SQE,
  DIAMOND_START,
  DIAMOND_STOP,
  TEXT,
  NODE_STRING,
  NUM,
  MINUS,
  AMP,
  SEMI,
  COMMA,
  COLON,
  QUOTE,
  NEWLINE,
  SPACE,
};
