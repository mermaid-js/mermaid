import { createToken, Lexer } from 'chevrotain';

// Debug flag for lexer logging
const DEBUG_LEXER = false; // Set to true to enable debug logging

// ============================================================================
// JISON TO CHEVROTAIN MULTI-MODE LEXER IMPLEMENTATION
// Following the instructions to implement all Jison states as Chevrotain modes
// Based on flow.jison lines 9-28 and state transitions throughout the file
// ============================================================================

// ============================================================================
// SHARED TOKENS (used across multiple modes)
// ============================================================================

// Whitespace and comments (skipped in all modes)
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[\t ]+/, // Only spaces and tabs, not newlines
  group: Lexer.SKIPPED,
});

const Comment = createToken({
  name: 'Comment',
  pattern: /%%[^\n]*/,
  group: Lexer.SKIPPED,
});

// Basic structural tokens
const Newline = createToken({
  name: 'Newline',
  pattern: /(\r?\n)+/,
});

const Semicolon = createToken({
  name: 'Semicolon',
  pattern: /;/,
});

const Space = createToken({
  name: 'Space',
  pattern: /\s/,
});

const EOF = createToken({
  name: 'EOF',
  pattern: Lexer.NA,
});

// ============================================================================
// NODE STRING AND IDENTIFIERS
// ============================================================================

// Node string pattern from JISON line 205-207
// Modified to include special characters and handle minus character edge cases
// Allows - in node IDs including standalone -, -at-start, and -at-end patterns
// Avoids conflicts with link tokens by using negative lookahead for link patterns
// Handles compound cases like &node, -node, vnode where special chars are followed by word chars
// Only matches compound patterns (special char + word chars), not standalone special chars
const NODE_STRING = createToken({
  name: 'NODE_STRING',
  pattern:
    /\\\w+|\w+\\|&[\w!"#$%&'*+,./:?\\`]+[\w!"#$%&'*+,./:?\\`-]*|-[\w!"#$%&'*+,./:?\\`]+[\w!"#$%&'*+,./:?\\`-]*|[<>^v][\w!"#$%&'*+,./:?\\`]+[\w!"#$%&'*+,./:?\\`-]*|[\w!"#$%&'*+,./:?\\`](?:[\w!"#$%&'*+,./:?\\`]|-(?![.=-])|\.(?!-))*[\w!"#$%&'*+,./:?\\`]|[\w!"#$%&'*+,./:?\\`]|&|-|\\|\//,
});

// ============================================================================
// KEYWORDS (with longer_alt to handle conflicts)
// ============================================================================

const Graph = createToken({
  name: 'Graph',
  pattern: /graph|flowchart|flowchart-elk/i,
  longer_alt: NODE_STRING,
});

const Subgraph = createToken({
  name: 'Subgraph',
  pattern: /subgraph/i,
  longer_alt: NODE_STRING,
});

const End = createToken({
  name: 'End',
  pattern: /end/i,
  longer_alt: NODE_STRING,
});

const Style = createToken({
  name: 'Style',
  pattern: /style/i,
  longer_alt: NODE_STRING,
});

const LinkStyle = createToken({
  name: 'LinkStyle',
  pattern: /linkstyle/i,
  longer_alt: NODE_STRING,
});

const ClassDef = createToken({
  name: 'ClassDef',
  pattern: /classdef/i,
  longer_alt: NODE_STRING,
});

const Class = createToken({
  name: 'Class',
  pattern: /class/i,
  longer_alt: NODE_STRING,
});

const Click = createToken({
  name: 'Click',
  pattern: /click/i,
  longer_alt: NODE_STRING,
});

const Href = createToken({
  name: 'Href',
  pattern: /href/i,
  longer_alt: NODE_STRING,
});

const Callback = createToken({
  name: 'Callback',
  pattern: /callback/i,
  longer_alt: NODE_STRING,
});

const Call = createToken({
  name: 'Call',
  pattern: /call/i,
  longer_alt: NODE_STRING,
});

const Default = createToken({
  name: 'Default',
  pattern: /default/i,
  longer_alt: NODE_STRING,
});

// ============================================================================
// DIRECTION TOKENS (JISON lines 127-137)
// ============================================================================

const DirectionValue = createToken({
  name: 'DirectionValue',
  pattern: /LR|RL|TB|BT|TD|BR|<|>|\^|v/,
});

// ============================================================================
// ACCESSIBILITY TOKENS (JISON lines 31-37)
// ============================================================================

// Mode-switching tokens for accessibility
const AccTitle = createToken({
  name: 'AccTitle',
  pattern: /accTitle\s*:\s*/,
  push_mode: 'acc_title_mode',
});

const AccDescr = createToken({
  name: 'AccDescr',
  pattern: /accDescr\s*:\s*/,
  push_mode: 'acc_descr_mode',
});

const AccDescrMultiline = createToken({
  name: 'AccDescrMultiline',
  pattern: /accDescr\s*{\s*/,
  push_mode: 'acc_descr_multiline_mode',
});

// ============================================================================
// STRING TOKENS (JISON lines 82-87)
// ============================================================================

// Mode-switching tokens for strings
const StringStart = createToken({
  name: 'StringStart',
  pattern: /"/,
  push_mode: 'string_mode',
});

const MarkdownStringStart = createToken({
  name: 'MarkdownStringStart',
  pattern: /"`/,
  push_mode: 'md_string_mode',
});

// ============================================================================
// SHAPE DATA TOKENS (JISON lines 41-64)
// ============================================================================

const ShapeDataStart = createToken({
  name: 'ShapeDataStart',
  pattern: /@{/,
  push_mode: 'shapeData_mode',
});

// ============================================================================
// LINK TOKENS (JISON lines 154-164)
// ============================================================================

const LINK = createToken({
  name: 'LINK',
  pattern: /\s*[<ox]?--+[>ox-]\s*/,
});

const START_LINK = createToken({
  name: 'START_LINK',
  pattern: /\s*[<ox]?--\s*/,
  push_mode: 'edgeText_mode',
});

const THICK_LINK = createToken({
  name: 'THICK_LINK',
  pattern: /\s*[<ox]?==+[=>ox-]?\s*/,
});

const START_THICK_LINK = createToken({
  name: 'START_THICK_LINK',
  pattern: /\s*[<ox]?==(?=\s*\|)\s*/,
  push_mode: 'thickEdgeText_mode',
});

const DOTTED_LINK = createToken({
  name: 'DOTTED_LINK',
  pattern: /\s*[<ox]?-?\.+-[>ox-]?\s*/,
});

const START_DOTTED_LINK = createToken({
  name: 'START_DOTTED_LINK',
  pattern: /\s*[<ox]?-\.(?!-)\s*/,
  push_mode: 'dottedEdgeText_mode',
});

// ============================================================================
// SHAPE TOKENS (JISON lines 169-194)
// ============================================================================

// Mode-switching tokens for shapes
const SquareStart = createToken({
  name: 'SquareStart',
  pattern: /\[/,
  push_mode: 'text_mode',
});

const PS = createToken({
  name: 'PS',
  pattern: /\(/,
  push_mode: 'text_mode',
});

// Circle and double circle tokens (must come before PS)
const DoubleCircleStart = createToken({
  name: 'DoubleCircleStart',
  pattern: /\({3}/,
  push_mode: 'text_mode',
});

const CircleStart = createToken({
  name: 'CircleStart',
  pattern: /\(\(/,
  push_mode: 'text_mode',
});

// Hexagon tokens
const HexagonStart = createToken({
  name: 'HexagonStart',
  pattern: /{{/,
  push_mode: 'text_mode',
});

const DiamondStart = createToken({
  name: 'DiamondStart',
  pattern: /{/,
  push_mode: 'text_mode',
});

// ============================================================================
// BASIC PUNCTUATION
// ============================================================================

const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
  longer_alt: NODE_STRING,
});

const Comma = createToken({
  name: 'Comma',
  pattern: /,/,
  longer_alt: NODE_STRING,
});

const Pipe = createToken({
  name: 'Pipe',
  pattern: /\|/,
});

const Ampersand = createToken({
  name: 'Ampersand',
  pattern: /&/,
  longer_alt: NODE_STRING,
});

const Minus = createToken({
  name: 'Minus',
  pattern: /-/,
  longer_alt: NODE_STRING,
});

// Additional special character tokens for node IDs
const Hash = createToken({
  name: 'Hash',
  pattern: /#/,
  longer_alt: NODE_STRING,
});

const Asterisk = createToken({
  name: 'Asterisk',
  pattern: /\*/,
  longer_alt: NODE_STRING,
});

const Dot = createToken({
  name: 'Dot',
  pattern: /\./,
  longer_alt: NODE_STRING,
});

// Backslash token removed - handled entirely by NODE_STRING

const Slash = createToken({
  name: 'Slash',
  pattern: /\//,
  longer_alt: NODE_STRING,
});

const Underscore = createToken({
  name: 'Underscore',
  pattern: /_/,
  longer_alt: NODE_STRING,
});

const NumberToken = createToken({
  name: 'NumberToken',
  pattern: /\d+/,
});

// ============================================================================
// MODE-SPECIFIC TOKENS
// ============================================================================

// Tokens for acc_title mode (JISON line 32)
const AccTitleValue = createToken({
  name: 'AccTitleValue',
  pattern: /[^\n]+/,
  pop_mode: true,
});

// Tokens for acc_descr mode (JISON line 34)
const AccDescrValue = createToken({
  name: 'AccDescrValue',
  pattern: /[^\n]+/,
  pop_mode: true,
});

// Tokens for acc_descr_multiline mode (JISON lines 36-37)
const AccDescrMultilineValue = createToken({
  name: 'AccDescrMultilineValue',
  pattern: /[^}]+/,
});

const AccDescrMultilineEnd = createToken({
  name: 'AccDescrMultilineEnd',
  pattern: /}/,
  pop_mode: true,
});

// Tokens for string mode (JISON lines 85-86)
const StringContent = createToken({
  name: 'StringContent',
  pattern: /[^"]+/,
});

const StringEnd = createToken({
  name: 'StringEnd',
  pattern: /"/,
  pop_mode: true,
});

// Tokens for md_string mode (JISON lines 82-83)
const MarkdownStringContent = createToken({
  name: 'MarkdownStringContent',
  pattern: /[^"`]+/,
});

const MarkdownStringEnd = createToken({
  name: 'MarkdownStringEnd',
  pattern: /`"/,
  pop_mode: true,
});

// Tokens for text mode (JISON lines 272-283)
const TextContent = createToken({
  name: 'TextContent',
  pattern: /[^"()[\]{|}]+/,
});

const QuotedString = createToken({
  name: 'QuotedString',
  pattern: /"[^"]*"/,
});

const SquareEnd = createToken({
  name: 'SquareEnd',
  pattern: /]/,
  pop_mode: true,
});

const PE = createToken({
  name: 'PE',
  pattern: /\)/,
  pop_mode: true,
});

// Circle and double circle end tokens (must come before PE)
const DoubleCircleEnd = createToken({
  name: 'DoubleCircleEnd',
  pattern: /\){3}/,
  pop_mode: true,
});

const CircleEnd = createToken({
  name: 'CircleEnd',
  pattern: /\)\)/,
  pop_mode: true,
});

// Hexagon end token
const HexagonEnd = createToken({
  name: 'HexagonEnd',
  pattern: /}}/,
  pop_mode: true,
});

const DiamondEnd = createToken({
  name: 'DiamondEnd',
  pattern: /}/,
  pop_mode: true,
});

// Tokens for edge text modes (JISON lines 156, 160, 164)
const EdgeTextContent = createToken({
  name: 'EdgeTextContent',
  pattern: /[^|-]+/,
});

const EdgeTextPipe = createToken({
  name: 'EdgeTextPipe',
  pattern: /\|/,
});

const EdgeTextEnd = createToken({
  name: 'EdgeTextEnd',
  pattern: /(-+[>ox-])|(=+[=>ox])/,
  pop_mode: true,
});

// Tokens for shapeData mode (JISON lines 57-64)
const ShapeDataContent = createToken({
  name: 'ShapeDataContent',
  pattern: /[^"}]+/,
});

const ShapeDataStringStart = createToken({
  name: 'ShapeDataStringStart',
  pattern: /"/,
  push_mode: 'shapeDataStr_mode',
});

const ShapeDataEnd = createToken({
  name: 'ShapeDataEnd',
  pattern: /}/,
  pop_mode: true,
});

// Tokens for shapeDataStr mode (JISON lines 49-56)
const ShapeDataStringContent = createToken({
  name: 'ShapeDataStringContent',
  pattern: /[^"]+/,
});

const ShapeDataStringEnd = createToken({
  name: 'ShapeDataStringEnd',
  pattern: /"/,
  pop_mode: true,
});

// ============================================================================
// MULTI-MODE LEXER DEFINITION
// Following JISON states exactly
// ============================================================================

const multiModeLexerDefinition = {
  modes: {
    // INITIAL mode - equivalent to JISON default state
    initial_mode: [
      WhiteSpace,
      Comment,

      // Accessibility tokens (must come before other patterns)
      AccTitle,
      AccDescr,
      AccDescrMultiline,

      // Keywords (must come before NODE_STRING)
      Graph,
      Subgraph,
      End,
      Style,
      LinkStyle,
      ClassDef,
      Class,
      Click,
      Href,
      Callback,
      Call,
      Default,

      // Links (order matters for precedence - must come before DirectionValue)
      START_THICK_LINK,
      THICK_LINK,
      START_DOTTED_LINK,
      DOTTED_LINK,
      LINK,
      START_LINK,

      // Direction values (must come after LINK tokens)
      DirectionValue,

      // String starts (QuotedString must come before StringStart to avoid conflicts)
      MarkdownStringStart,
      QuotedString,
      StringStart,

      // Shape data
      ShapeDataStart,

      // Shape starts (order matters - longer patterns first)
      SquareStart,
      DoubleCircleStart,
      CircleStart,
      PS,
      HexagonStart,
      DiamondStart,

      // Basic punctuation (must come before NODE_STRING)
      Pipe,
      Colon,
      Comma,
      Ampersand,
      Minus,

      // Node strings and numbers (must come after punctuation)
      NODE_STRING,
      NumberToken,

      // Structural tokens
      Newline,
      Semicolon,
      Space,
      EOF,
    ],

    // acc_title mode (JISON line 32)
    acc_title_mode: [WhiteSpace, Comment, AccTitleValue],

    // acc_descr mode (JISON line 34)
    acc_descr_mode: [WhiteSpace, Comment, AccDescrValue],

    // acc_descr_multiline mode (JISON lines 36-37)
    acc_descr_multiline_mode: [WhiteSpace, Comment, AccDescrMultilineEnd, AccDescrMultilineValue],

    // string mode (JISON lines 85-86)
    string_mode: [StringEnd, StringContent],

    // md_string mode (JISON lines 82-83)
    md_string_mode: [MarkdownStringEnd, MarkdownStringContent],

    // text mode (JISON lines 272-283)
    text_mode: [
      WhiteSpace,
      Comment,
      SquareEnd,
      DoubleCircleEnd,
      CircleEnd,
      PE,
      HexagonEnd,
      DiamondEnd,
      QuotedString,
      Pipe, // Special handling for pipe in text mode
      TextContent,
    ],

    // edgeText mode (JISON line 156)
    edgeText_mode: [WhiteSpace, Comment, EdgeTextEnd, EdgeTextPipe, QuotedString, EdgeTextContent],

    // thickEdgeText mode (JISON line 160)
    thickEdgeText_mode: [
      WhiteSpace,
      Comment,
      EdgeTextEnd,
      EdgeTextPipe,
      QuotedString,
      EdgeTextContent,
    ],

    // dottedEdgeText mode (JISON line 164)
    dottedEdgeText_mode: [
      WhiteSpace,
      Comment,
      EdgeTextEnd,
      EdgeTextPipe,
      QuotedString,
      EdgeTextContent,
    ],

    // shapeData mode (JISON lines 57-64)
    shapeData_mode: [WhiteSpace, Comment, ShapeDataEnd, ShapeDataStringStart, ShapeDataContent],

    // shapeDataStr mode (JISON lines 49-56)
    shapeDataStr_mode: [ShapeDataStringEnd, ShapeDataStringContent],
  },

  defaultMode: 'initial_mode',
};

const FlowchartLexer = new Lexer(multiModeLexerDefinition);

// Debug wrapper for lexer tokenization
const tokenizeWithDebug = (input: string) => {
  const lexResult = FlowchartLexer.tokenize(input);

  if (DEBUG_LEXER) {
    // eslint-disable-next-line no-console
    console.debug('Errors:\n', lexResult.errors);
    // eslint-disable-next-line no-console
    console.debug(
      'Tokens:\n',
      lexResult.tokens.map((t) => [t.image, t.tokenType.name])
    );
  }

  return lexResult;
};

// Extend FlowchartLexer with debug capability
const FlowchartLexerWithDebug = {
  ...FlowchartLexer,
  tokenize: tokenizeWithDebug,
};

// Export all tokens for parser use
export const allTokens = [
  // Basic tokens
  WhiteSpace,
  Comment,
  Newline,
  Semicolon,
  Space,
  EOF,

  // Node strings and identifiers
  NODE_STRING,
  NumberToken,

  // Keywords
  Graph,
  Subgraph,
  End,
  Style,
  LinkStyle,
  ClassDef,
  Class,
  Click,
  Href,
  Call,
  Default,

  // Direction
  DirectionValue,

  // Accessibility
  AccTitle,
  AccTitleValue,
  AccDescr,
  AccDescrValue,
  AccDescrMultiline,
  AccDescrMultilineValue,
  AccDescrMultilineEnd,

  // Strings
  StringStart,
  StringContent,
  StringEnd,
  MarkdownStringStart,
  MarkdownStringContent,
  MarkdownStringEnd,

  // Shape data
  ShapeDataStart,
  ShapeDataContent,
  ShapeDataStringStart,
  ShapeDataStringContent,
  ShapeDataStringEnd,
  ShapeDataEnd,

  // Links
  LINK,
  START_LINK,
  THICK_LINK,
  START_THICK_LINK,
  DOTTED_LINK,
  START_DOTTED_LINK,

  // Edge text
  EdgeTextContent,
  EdgeTextPipe,
  EdgeTextEnd,

  // Shapes
  SquareStart,
  SquareEnd,
  DoubleCircleStart,
  DoubleCircleEnd,
  CircleStart,
  CircleEnd,
  PS,
  PE,
  HexagonStart,
  HexagonEnd,
  DiamondStart,
  DiamondEnd,

  // Text content
  TextContent,
  QuotedString,

  // Basic punctuation
  Colon,
  Comma,
  Pipe,
  Ampersand,
  Minus,
];

export { FlowchartLexerWithDebug as FlowchartLexer };

// Export individual tokens for parser use
export {
  // Basic tokens
  WhiteSpace,
  Comment,
  Newline,
  Semicolon,
  Space,
  EOF,

  // Node strings and identifiers
  NODE_STRING,
  NumberToken,

  // Keywords
  Graph,
  Subgraph,
  End,
  Style,
  LinkStyle,
  ClassDef,
  Class,
  Click,
  Href,
  Callback,
  Call,
  Default,

  // Direction
  DirectionValue,

  // Accessibility
  AccTitle,
  AccTitleValue,
  AccDescr,
  AccDescrValue,
  AccDescrMultiline,
  AccDescrMultilineValue,
  AccDescrMultilineEnd,

  // Strings
  StringStart,
  StringContent,
  StringEnd,
  MarkdownStringStart,
  MarkdownStringContent,
  MarkdownStringEnd,

  // Shape data
  ShapeDataStart,
  ShapeDataContent,
  ShapeDataStringStart,
  ShapeDataStringContent,
  ShapeDataStringEnd,
  ShapeDataEnd,

  // Links
  LINK,
  START_LINK,
  THICK_LINK,
  START_THICK_LINK,
  DOTTED_LINK,
  START_DOTTED_LINK,

  // Edge text
  EdgeTextContent,
  EdgeTextPipe,
  EdgeTextEnd,

  // Shapes
  SquareStart,
  SquareEnd,
  DoubleCircleStart,
  DoubleCircleEnd,
  CircleStart,
  CircleEnd,
  PS,
  PE,
  HexagonStart,
  HexagonEnd,
  DiamondStart,
  DiamondEnd,

  // Text content
  TextContent,
  QuotedString,

  // Basic punctuation
  Colon,
  Comma,
  Pipe,
  Ampersand,
  Minus,
};
