import { createToken, Lexer, TokenType, IToken, ILexingResult, ILexingError } from 'chevrotain';

// Debug flag for lexer logging - disabled in production for performance
const DEBUG_LEXER = false; // Set to true to enable debug logging

// Context-aware lexer state
interface LexerContext {
  expectingNode: boolean;
  expectingLink: boolean;
  inTextMode: boolean;
  lastTokenType: string | null;
  position: number;
  mode: LexerMode;
  modeStack: LexerMode[];
  edgeTextPipeCount: number; // Track how many pipes we've seen in edge text mode
}

// Lexer modes matching JISON states
enum LexerMode {
  INITIAL = 'initial',
  EDGE_TEXT = 'edgeText',
  THICK_EDGE_TEXT = 'thickEdgeText',
  DOTTED_EDGE_TEXT = 'dottedEdgeText',
  TEXT = 'text',
  STRING = 'string',
  MD_STRING = 'md_string',
  ACC_TITLE = 'acc_title',
  ACC_DESCR = 'acc_descr',
  ACC_DESCR_MULTILINE = 'acc_descr_multiline',
  SHAPE_DATA = 'shapeData',
  SHAPE_DATA_STR = 'shapeDataStr',
}

// Context-aware tokenization function
function contextAwareTokenize(input: string): ILexingResult {
  if (DEBUG_LEXER) {
    console.debug('Context-aware tokenization for input:', input);
  }

  const context: LexerContext = {
    expectingNode: true,
    expectingLink: false,
    inTextMode: false,
    lastTokenType: null,
    position: 0,
    mode: LexerMode.INITIAL,
    modeStack: [],
    edgeTextPipeCount: 0,
  };

  // First pass: try standard tokenization
  const standardResult = OriginalFlowchartLexer.tokenize(input);

  if (DEBUG_LEXER) {
    console.debug('Standard tokenization result:', {
      tokens: standardResult.tokens.map((t) => [t.image, t.tokenType.name]),
      errors: standardResult.errors,
    });
  }

  // Check if standard result has problematic patterns that need context-aware handling
  const hasProblematicPattern = detectProblematicPatterns(standardResult.tokens);

  // If no errors and no problematic patterns, return standard result
  if (standardResult.errors.length === 0 && !hasProblematicPattern) {
    return standardResult;
  }

  if (DEBUG_LEXER) {
    console.debug(
      'Using context-aware tokenization due to:',
      standardResult.errors.length > 0 ? 'errors' : 'problematic patterns'
    );
  }

  // Second pass: context-aware tokenization with backtracking
  const contextResult = contextAwareTokenizeWithBacktracking(input, context);

  if (DEBUG_LEXER) {
    console.debug('Context-aware tokenization result:', {
      tokens: contextResult.tokens.map((t) => [t.image, t.tokenType.name]),
      errors: contextResult.errors,
    });
  }

  return contextResult;
}

// Detect problematic token patterns that need context-aware handling
function detectProblematicPatterns(tokens: IToken[]): boolean {
  // Don't use context-aware tokenization if we have accessibility tokens
  // These need to be handled by the standard lexer with mode switching
  for (const token of tokens) {
    if (
      token.tokenType.name === 'AccTitle' ||
      token.tokenType.name === 'AccDescr' ||
      token.tokenType.name === 'AccDescrMultiline'
    ) {
      return false;
    }
  }

  // Look for patterns that indicate incorrect tokenization
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    // Pattern 1: THICK_LINK followed by Pipe (should be START_THICK_LINK + EdgeTextPipe)
    if (current.tokenType.name === 'THICK_LINK' && next.tokenType.name === 'Pipe') {
      return true;
    }

    // Pattern 2: LINK followed by Pipe is valid for arrowText pattern (LINK + Pipe + text + PipeEnd)
    // Only flag as problematic if it's not followed by text and PipeEnd
    if (current.tokenType.name === 'LINK' && next.tokenType.name === 'Pipe') {
      // Check if this is a valid arrowText pattern by looking ahead
      let hasValidArrowTextPattern = false;
      if (i + 2 < tokens.length) {
        // Look for pattern: LINK + Pipe + (text tokens) + PipeEnd
        let j = i + 2;
        let foundText = false;
        while (j < tokens.length && tokens[j].tokenType.name !== 'PipeEnd') {
          if (
            tokens[j].tokenType.name === 'TextContent' ||
            tokens[j].tokenType.name === 'NODE_STRING'
          ) {
            foundText = true;
          }
          j++;
        }
        if (j < tokens.length && tokens[j].tokenType.name === 'PipeEnd' && foundText) {
          hasValidArrowTextPattern = true;
        }
      }

      // Only flag as problematic if it's not a valid arrowText pattern
      if (!hasValidArrowTextPattern) {
        return true;
      }
    }

    // Pattern 3: DOTTED_LINK followed by Pipe (should be START_DOTTED_LINK + EdgeTextPipe)
    if (current.tokenType.name === 'DOTTED_LINK' && next.tokenType.name === 'Pipe') {
      return true;
    }

    // Pattern 4: PipeEnd followed by THICK_LINK/LINK/DOTTED_LINK (should be EdgeTextEnd)
    if (
      current.tokenType.name === 'PipeEnd' &&
      (next.tokenType.name === 'THICK_LINK' ||
        next.tokenType.name === 'LINK' ||
        next.tokenType.name === 'DOTTED_LINK')
    ) {
      return true;
    }

    // Pattern 5: Minus followed by Pipe (for open arrows like A-|text|->B)
    if (current.tokenType.name === 'Minus' && next.tokenType.name === 'Pipe') {
      return true;
    }

    // Pattern 6: TextContent followed by PipeEnd followed by arrow (indicates text mode issue)
    if (i < tokens.length - 2) {
      const afterNext = tokens[i + 2];
      if (
        current.tokenType.name === 'TextContent' &&
        next.tokenType.name === 'PipeEnd' &&
        (afterNext.tokenType.name === 'THICK_LINK' ||
          afterNext.tokenType.name === 'LINK' ||
          afterNext.tokenType.name === 'DOTTED_LINK')
      ) {
        return true;
      }
    }
  }

  return false;
}

function contextAwareTokenizeWithBacktracking(input: string, context: LexerContext): ILexingResult {
  const tokens: IToken[] = [];
  const errors: ILexingError[] = [];
  let position = 0;

  while (position < input.length) {
    const remainingInput = input.substring(position);

    // Skip whitespace
    const whitespaceMatch = remainingInput.match(/^\s+/);
    if (whitespaceMatch) {
      position += whitespaceMatch[0].length;
      continue;
    }

    // Try to tokenize the next segment
    const tokenResult = tokenizeNextSegment(remainingInput, context, position);

    if (tokenResult.token) {
      tokens.push(tokenResult.token);
      position += tokenResult.consumed;
      updateContext(context, tokenResult.token);
    } else if (tokenResult.error) {
      errors.push(tokenResult.error);
      position += 1; // Skip problematic character
    } else {
      // Fallback: try single character tokenization
      const singleCharResult = tokenizeSingleCharacter(remainingInput, position);
      if (singleCharResult.token) {
        tokens.push(singleCharResult.token);
        position += singleCharResult.consumed;
        updateContext(context, singleCharResult.token);
      } else {
        // Skip unknown character
        position += 1;
      }
    }
  }

  return { tokens, errors, groups: {} };
}

// Token result interface
interface TokenResult {
  token?: IToken;
  consumed: number;
  error?: ILexingError;
}

// Tokenize next segment with context awareness
function tokenizeNextSegment(input: string, context: LexerContext, position: number): TokenResult {
  // Strategy 1: Mode-specific tokenization
  const modeResult = tryModeSpecificTokenization(input, context, position);
  if (modeResult.token) {
    return modeResult;
  }

  // Strategy 2: Keyword recognition (highest priority)
  const keywordResult = tryTokenizeKeywords(input, position);
  if (keywordResult.token) {
    return keywordResult;
  }

  // Strategy 3: Context-aware patterns
  if (context.expectingNode) {
    const nodeResult = tryTokenizeAsNode(input, position);
    if (nodeResult.token) {
      return nodeResult;
    }
  }

  if (context.expectingLink) {
    const linkResult = tryTokenizeAsLink(input, position);
    if (linkResult.token) {
      return linkResult;
    }
  }

  // Strategy 4: Standard tokenization
  const standardResult = tryStandardTokenization(input, position);
  if (standardResult.token) {
    return standardResult;
  }

  // Strategy 5: Fallback to character-by-character analysis
  return tryFallbackTokenization(input, position);
}

// Update context based on the current token
function updateContext(context: LexerContext, token: IToken): void {
  const tokenType = token.tokenType.name;

  // Update expectations based on token type
  switch (tokenType) {
    case 'NODE_STRING':
    case 'NumberToken':
    case 'Ampersand':
    case 'AtSymbol':
    case 'Minus':
    case 'DIR':
    case 'Colon':
    case 'Comma':
    case 'Default':
      context.expectingNode = false;
      context.expectingLink = true;
      break;

    case 'LINK':
    case 'THICK_LINK':
    case 'DOTTED_LINK':
      context.expectingNode = true;
      context.expectingLink = false;
      break;

    case 'START_LINK':
      context.inTextMode = true;
      context.expectingNode = false;
      context.expectingLink = false;
      context.mode = LexerMode.EDGE_TEXT;
      context.edgeTextPipeCount = 0; // Reset pipe counter
      break;

    case 'START_THICK_LINK':
      context.inTextMode = true;
      context.expectingNode = false;
      context.expectingLink = false;
      context.mode = LexerMode.THICK_EDGE_TEXT;
      break;

    case 'START_DOTTED_LINK':
      context.inTextMode = true;
      context.expectingNode = false;
      context.expectingLink = false;
      context.mode = LexerMode.DOTTED_EDGE_TEXT;
      break;

    case 'EdgeTextEnd':
      context.inTextMode = false;
      context.expectingNode = true;
      context.expectingLink = false;
      context.mode = LexerMode.INITIAL;
      break;

    // Shape starts trigger text mode
    case 'SquareStart':
    case 'DoubleCircleStart':
    case 'CircleStart':
    case 'PS':
    case 'HexagonStart':
    case 'DiamondStart':
      context.mode = LexerMode.TEXT;
      break;

    // String starts
    case 'StringStart':
      context.mode = LexerMode.STRING;
      break;

    case 'MarkdownStringStart':
      context.mode = LexerMode.MD_STRING;
      break;
  }

  context.lastTokenType = tokenType;
}

// Mode-specific tokenization based on current lexer mode
function tryModeSpecificTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  switch (context.mode) {
    case LexerMode.THICK_EDGE_TEXT:
      return tryThickEdgeTextTokenization(input, context, position);

    case LexerMode.EDGE_TEXT:
      return tryEdgeTextTokenization(input, context, position);

    case LexerMode.DOTTED_EDGE_TEXT:
      return tryDottedEdgeTextTokenization(input, context, position);

    case LexerMode.TEXT:
      return tryTextModeTokenization(input, context, position);

    case LexerMode.STRING:
      return tryStringModeTokenization(input, context, position);

    case LexerMode.INITIAL:
    default:
      return { consumed: 0 }; // Fall through to other strategies
  }
}

// Keyword tokenization with context awareness
function tryTokenizeKeywords(input: string, position: number): TokenResult {
  // Check if this looks like a node name with special characters
  // Node names can contain keywords but should not be tokenized as keywords
  // if they have special characters like dots, dashes, underscores
  const nodeNamePattern = /^[a-zA-Z0-9._-]+/;
  const nodeNameMatch = input.match(nodeNamePattern);

  if (nodeNameMatch && nodeNameMatch[0].length > 0) {
    const fullMatch = nodeNameMatch[0];

    // If the match contains special characters, treat it as a node name
    if (/[._-]/.test(fullMatch)) {
      return { consumed: 0 }; // Let it be handled as NODE_STRING
    }

    // If it's a pure keyword at word boundary, check if it should be a keyword
    const keywordPatterns = [
      { pattern: /^graph\b/, type: 'GRAPH' },
      { pattern: /^subgraph\b/, type: 'subgraph' },
      { pattern: /^end\b/, type: 'end' },
      { pattern: /^style\b/, type: 'STYLE' },
      { pattern: /^linkStyle\b/, type: 'LINKSTYLE' },
      { pattern: /^classDef\b/, type: 'CLASSDEF' },
      { pattern: /^class\b/, type: 'CLASS' },
      { pattern: /^click\b/, type: 'CLICK' },
      { pattern: /^href\b/, type: 'HREF' },
      { pattern: /^call\b/, type: 'Call' },
      { pattern: /^default\b/, type: 'DEFAULT' },
      { pattern: /^interpolate\b/, type: 'INTERPOLATE' },
      { pattern: /^accTitle\s*:/, type: 'AccTitle' },
      { pattern: /^accDescr\s*:/, type: 'AccDescr' },
      { pattern: /^accDescr\s*{/, type: 'AccDescrMultiline' },
      // Direction values
      { pattern: /^(TB|TD|BT|RL|LR)\b/, type: 'DIR' },
    ];

    for (const { pattern, type } of keywordPatterns) {
      const match = input.match(pattern);
      if (match && match[0] === fullMatch) {
        // Only tokenize as keyword if the full match is exactly the keyword
        return {
          token: createTokenInstance(type, match[0], position),
          consumed: match[0].length,
        };
      }
    }
  }

  return { consumed: 0 };
}

// Edge text mode tokenization (for START_LINK patterns)
function tryEdgeTextTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  if (DEBUG_LEXER) {
    console.debug(
      `Edge text tokenization for input: "${input}", mode: ${context.mode}, lastToken: ${context.lastTokenType}`
    );
  }

  // Special handling for edge text mode
  // Check if we're at the end of edge text (second pipe followed by non-pipe)
  if (
    context.lastTokenType === 'EdgeTextPipe' &&
    context.edgeTextPipeCount >= 2 &&
    /^[^|]/.test(input)
  ) {
    // We've hit the end of edge text, provide an implicit EdgeTextEnd token
    context.mode = LexerMode.INITIAL;
    context.expectingNode = true;
    context.expectingLink = false;
    context.inTextMode = false;
    context.edgeTextPipeCount = 0; // Reset counter

    if (DEBUG_LEXER) {
      console.debug('Providing implicit EdgeTextEnd token');
    }

    // Return an implicit EdgeTextEnd token
    return {
      token: createTokenInstance('EdgeTextEnd', '', position),
      consumed: 0, // Don't consume any input, this is an implicit token
    };
  }

  // Edge text patterns - order matters!
  const patterns = [
    // Complete arrow endings (must come first to properly close edge text mode)
    { pattern: /^-{1,}[xo>]/, type: 'EdgeTextEnd', mode: LexerMode.INITIAL },
    // Pipe tokens for text boundaries
    { pattern: /^\|/, type: 'EdgeTextPipe' },
    // Arrow ending characters that should be skipped (consume but don't emit token)
    { pattern: /^[>xo-]/, type: 'SKIP' },
    // Quoted strings
    { pattern: /^"([^"\\]|\\.)*"/, type: 'QuotedString' },
    // Text content (simple pattern - just consume non-pipe characters)
    { pattern: /^[^|]+/, type: 'EdgeTextContent' },
  ];

  const result = tryPatternMatch(patterns, input, position, context);

  if (DEBUG_LEXER) {
    console.debug(`Edge text pattern match result:`, result);
  }

  // Handle skipped patterns (no token returned, but input consumed)
  if (result.consumed > 0 && !result.token) {
    if (DEBUG_LEXER) {
      console.debug(
        `Pattern consumed ${result.consumed} characters, trying again with remaining input`
      );
    }
    // Input was consumed but no token was created (SKIP pattern)
    // Try again with the remaining input
    const recursiveResult = tryEdgeTextTokenization(
      input.substring(result.consumed),
      context,
      position + result.consumed
    );

    // Add the consumed characters from the SKIP pattern to the total
    return {
      token: recursiveResult.token,
      consumed: result.consumed + recursiveResult.consumed,
      error: recursiveResult.error,
    };
  }

  // Track pipe count for edge text mode exit logic
  if (result.token && result.token.tokenType.name === 'EdgeTextPipe') {
    context.edgeTextPipeCount++;
  }

  return result;
}

// Thick edge text mode tokenization (for START_THICK_LINK patterns)
function tryThickEdgeTextTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  // Thick edge text patterns
  const patterns = [
    { pattern: /^[xo<]?={2,}[=xo>]/, type: 'EdgeTextEnd', mode: LexerMode.INITIAL },
    { pattern: /^\|/, type: 'EdgeTextPipe' },
    { pattern: /^"([^"\\]|\\.)*"/, type: 'QuotedString' },
    { pattern: /^[^|"]+/, type: 'EdgeTextContent' },
  ];

  return tryPatternMatch(patterns, input, position, context);
}

// Dotted edge text mode tokenization (for START_DOTTED_LINK patterns)
function tryDottedEdgeTextTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  if (DEBUG_LEXER) {
    console.debug(
      `Dotted edge text tokenization for input: "${input}", mode: ${context.mode}, lastToken: ${context.lastTokenType}`
    );
  }

  // Special handling for dotted edge text mode
  // Check if we're at the end of edge text (second pipe followed by non-pipe)
  if (
    context.lastTokenType === 'EdgeTextPipe' &&
    context.edgeTextPipeCount >= 2 &&
    /^[^|]/.test(input)
  ) {
    // We've hit the end of edge text, provide an implicit EdgeTextEnd token
    context.mode = LexerMode.INITIAL;
    context.expectingNode = true;
    context.expectingLink = false;
    context.inTextMode = false;
    context.edgeTextPipeCount = 0; // Reset counter

    if (DEBUG_LEXER) {
      console.debug('Providing implicit EdgeTextEnd token for dotted edge');
    }

    // Return an implicit EdgeTextEnd token
    return {
      token: createTokenInstance('EdgeTextEnd', '', position),
      consumed: 0, // Don't consume any input, this is an implicit token
    };
  }

  // Dotted edge text patterns
  const patterns = [
    { pattern: /^[xo<]?\.{2,}[.-xo>]/, type: 'EdgeTextEnd', mode: LexerMode.INITIAL },
    { pattern: /^\|/, type: 'EdgeTextPipe' },
    // Skip dotted arrow characters that should not be part of text content
    { pattern: /^[>xo.-]/, type: 'SKIP' },
    { pattern: /^"([^"\\]|\\.)*"/, type: 'QuotedString' },
    { pattern: /^[^|"]+/, type: 'EdgeTextContent' },
  ];

  const result = tryPatternMatch(patterns, input, position, context);

  if (DEBUG_LEXER) {
    console.debug(`Dotted edge text pattern match result:`, result);
  }

  // Handle skipped patterns (no token returned, but input consumed)
  if (result.consumed > 0 && !result.token) {
    if (DEBUG_LEXER) {
      console.debug(
        `Dotted edge pattern consumed ${result.consumed} characters, trying again with remaining input`
      );
    }
    // Input was consumed but no token was created (SKIP pattern)
    // Try again with the remaining input
    const recursiveResult = tryDottedEdgeTextTokenization(
      input.substring(result.consumed),
      context,
      position + result.consumed
    );

    // Add the consumed characters from the SKIP pattern to the total
    return {
      token: recursiveResult.token,
      consumed: result.consumed + recursiveResult.consumed,
      error: recursiveResult.error,
    };
  }

  // Track pipe count for edge text mode exit logic
  if (result.token && result.token.tokenType.name === 'EdgeTextPipe') {
    context.edgeTextPipeCount++;
  }

  return result;
}

// Text mode tokenization (for shape text content)
function tryTextModeTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  const patterns = [
    { pattern: /^\]/, type: 'SquareEnd', mode: LexerMode.INITIAL },
    { pattern: /^\)\)/, type: 'DoubleCircleEnd', mode: LexerMode.INITIAL },
    { pattern: /^\)/, type: 'CircleEnd', mode: LexerMode.INITIAL },
    { pattern: /^>/, type: 'PE', mode: LexerMode.INITIAL },
    { pattern: /^}}/, type: 'HexagonEnd', mode: LexerMode.INITIAL },
    { pattern: /^}/, type: 'DiamondEnd', mode: LexerMode.INITIAL },
    { pattern: /^\|/, type: 'PipeEnd', mode: LexerMode.INITIAL },
    { pattern: /^"([^"\\]|\\.)*"/, type: 'QuotedString' },
    { pattern: /^[^\])}|>]+/, type: 'TextContent' },
  ];

  return tryPatternMatch(patterns, input, position, context);
}

// String mode tokenization
function tryStringModeTokenization(
  input: string,
  context: LexerContext,
  position: number
): TokenResult {
  const patterns = [
    { pattern: /^"/, type: 'StringEnd', mode: LexerMode.INITIAL },
    { pattern: /^[^"]+/, type: 'StringContent' },
  ];

  return tryPatternMatch(patterns, input, position, context);
}

// Helper function to try pattern matching with mode switching
function tryPatternMatch(
  patterns: Array<{ pattern: RegExp; type: string; mode?: LexerMode }>,
  input: string,
  position: number,
  context: LexerContext
): TokenResult {
  if (DEBUG_LEXER) {
    console.debug(`Trying to match patterns against input: "${input.substring(0, 20)}..."`);
  }

  for (const { pattern, type, mode } of patterns) {
    const match = input.match(pattern);
    if (DEBUG_LEXER) {
      console.debug(
        `  Pattern ${pattern} (${type}): ${match ? `MATCH "${match[0]}"` : 'NO MATCH'}`
      );
    }

    if (match) {
      if (DEBUG_LEXER) {
        console.debug(`Pattern matched: "${match[0]}" -> ${type}`);
      }

      // Handle SKIP patterns - consume input but don't create token
      if (type === 'SKIP') {
        if (DEBUG_LEXER) {
          console.debug(`Skipping token: "${match[0]}"`);
        }
        // Handle mode switching if specified
        if (mode !== undefined) {
          context.mode = mode;
        }
        return {
          consumed: match[0].length,
          // No token returned - this will be handled by the caller
        };
      }

      const token = createTokenInstance(type, match[0], position);

      // Handle mode switching if specified
      if (mode !== undefined) {
        context.mode = mode;
      }

      return {
        token: token,
        consumed: match[0].length,
      };
    }
  }

  if (DEBUG_LEXER) {
    console.debug(`No pattern matched for input: "${input.substring(0, 10)}..."`);
  }

  return { consumed: 0 };
}

// Try to tokenize as a node with special character support
function tryTokenizeAsNode(input: string, position: number): TokenResult {
  // Enhanced node pattern that supports special characters but avoids arrow conflicts
  // and respects token boundaries (semicolons, commas, etc.)
  // Excludes shape delimiters: [ ] ( ) { } and pipe | to respect boundaries
  const nodePatterns = [
    // Quoted strings
    /^"([^"\\]|\\.)*"/,
    // Alphanumeric with special chars, but stopping at token boundaries, shape delimiters, and pipes
    /^(?!-{2,}[>.-]|={2,}[>=]|\.{2,}[>.-])[a-zA-Z0-9_\-+*&:.#$%^!@\\\/~`'"?<>=]+?(?=[;,\s\[\](){}|]|$)/,
    // Simple alphanumeric (most common case)
    /^[a-zA-Z0-9_]+/,
    // Numbers
    /^\d+/,
    // Single safe special characters (excluding token boundaries, shape delimiters, and pipes)
    /^[&:.#$%^!@\\\/~`'"?<>=]/,
  ];

  for (const pattern of nodePatterns) {
    const match = input.match(pattern);
    if (match) {
      const matchedText = match[0];

      // Skip empty matches
      if (matchedText.length === 0) continue;

      // Additional validation: ensure this doesn't conflict with arrows
      if (!isArrowPattern(matchedText) && !isArrowStart(input, matchedText.length)) {
        return {
          token: createTokenInstance('NODE_STRING', matchedText, position),
          consumed: matchedText.length,
        };
      }
    }
  }

  return { consumed: 0 };
}

// Try to tokenize as a link with intelligent lookahead
function tryTokenizeAsLink(input: string, position: number): TokenResult {
  // Enhanced link analysis with proper text pattern detection
  const linkAnalysis = analyzeLinkPattern(input);

  if (linkAnalysis.isLink) {
    return {
      token: createTokenInstance(linkAnalysis.tokenType, linkAnalysis.matchedText, position),
      consumed: linkAnalysis.matchedText.length,
    };
  }

  return { consumed: 0 };
}

// Analyze link patterns with intelligent lookahead
function analyzeLinkPattern(input: string): {
  isLink: boolean;
  tokenType: string;
  matchedText: string;
} {
  // Strategy: Check for text patterns first, then decide how to tokenize the arrow

  // Thick link patterns (==, ===, etc.)
  const thickFullMatch = input.match(/^([xo<]?={2,}[=xo>])/);
  const thickStartMatch = input.match(/^([xo<]?={2,})/);

  if (thickStartMatch) {
    const linkStart = thickStartMatch[1];
    const remaining = input.substring(linkStart.length);

    // If there's a text pattern following, use START token
    if (hasTextPattern(remaining)) {
      return {
        isLink: true,
        tokenType: 'START_THICK_LINK',
        matchedText: linkStart,
      };
    }
    // If there's a complete thick link match, use that
    else if (thickFullMatch && thickFullMatch[1].length > linkStart.length) {
      return {
        isLink: true,
        tokenType: 'THICK_LINK',
        matchedText: thickFullMatch[1],
      };
    }
  }

  // Dotted link patterns (-.-, -..-, etc.)
  // Handle both single dot (-.-) and multiple dots (-..-, -...-, etc.)
  const dottedFullMatch = input.match(/^([xo<]?-\.+[.-xo>])/);
  const dottedStartMatch = input.match(/^([xo<]?-\.+)/);

  if (dottedStartMatch) {
    const linkStart = dottedStartMatch[1];
    const remaining = input.substring(linkStart.length);

    if (hasTextPattern(remaining)) {
      return {
        isLink: true,
        tokenType: 'START_DOTTED_LINK',
        matchedText: linkStart,
      };
    } else if (dottedFullMatch && dottedFullMatch[1].length > linkStart.length) {
      return {
        isLink: true,
        tokenType: 'DOTTED_LINK',
        matchedText: dottedFullMatch[1],
      };
    }
  }

  // Regular link patterns (--, ---, -->, etc.)
  // This is the key fix: we need to handle cases like --> when followed by text
  const regularFullMatch = input.match(/^([xo<]?-{2,}[-xo>])/);
  const regularStartMatch = input.match(/^([xo<]?-{2,})/);

  if (regularStartMatch) {
    const linkStart = regularStartMatch[1];
    const remaining = input.substring(linkStart.length);

    // Special handling for arrows followed by text
    if (hasTextPattern(remaining)) {
      // For patterns like "-->|text|", we want to tokenize "--" as START_LINK
      // The ">" will be part of the EdgeTextEnd token later
      return {
        isLink: true,
        tokenType: 'START_LINK',
        matchedText: linkStart,
      };
    }
    // If there's a complete regular link match, use that
    else if (regularFullMatch && regularFullMatch[1].length > linkStart.length) {
      return {
        isLink: true,
        tokenType: 'LINK',
        matchedText: regularFullMatch[1],
      };
    }
  }

  // Single dash patterns (for open arrows like A-|text|->B)
  const singleDashMatch = input.match(/^([xo<]?-)/);
  if (singleDashMatch) {
    const linkStart = singleDashMatch[1];
    const remaining = input.substring(linkStart.length);

    if (hasTextPattern(remaining)) {
      return {
        isLink: true,
        tokenType: 'START_LINK',
        matchedText: linkStart,
      };
    }
  }

  return {
    isLink: false,
    tokenType: '',
    matchedText: '',
  };
}

// Try standard tokenization using the existing lexer
function tryStandardTokenization(input: string, position: number): TokenResult {
  const result = OriginalFlowchartLexer.tokenize(input);
  if (result.tokens.length > 0 && result.errors.length === 0) {
    const token = result.tokens[0];
    return {
      token: token,
      consumed: token.image.length,
    };
  }
  return { consumed: 0 };
}

// Fallback tokenization for edge cases
function tryFallbackTokenization(input: string, position: number): TokenResult {
  // Try to match single characters or small patterns
  const fallbackPatterns = [
    { pattern: /^[a-zA-Z0-9_]/, type: 'NODE_STRING' },
    { pattern: /^[&:,+*#$%^!@()[\]{}|\\\/~`';?<>=.-]/, type: 'NODE_STRING' },
  ];

  for (const { pattern, type } of fallbackPatterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        token: createTokenInstance(type, match[0], position),
        consumed: match[0].length,
      };
    }
  }

  return {
    consumed: 1,
    error: {
      message: `Unexpected character: ${input[0]}`,
      offset: position,
      length: 1,
      line: 1,
      column: position + 1,
    },
  };
}

// Helper functions for pattern detection
function isArrowPattern(text: string): boolean {
  const arrowPatterns = [/^-{2,}[>.-]/, /^={2,}[>=]/, /^\.{2,}[>.-]/];
  return arrowPatterns.some((pattern) => pattern.test(text));
}

function isArrowStart(input: string, offset: number): boolean {
  const remaining = input.substring(offset);
  const arrowStartPatterns = [/^\s*-{2,}/, /^\s*={2,}/, /^\s*\.{2,}/];
  return arrowStartPatterns.some((pattern) => pattern.test(remaining));
}

function hasTextPattern(input: string): boolean {
  // Check if input starts with text patterns like |text| or "text"
  // Also handle cases where arrow endings (>, -, .) come before the text pattern
  return /^\s*[|"]/.test(input) || /^[>.-]+\s*[|"]/.test(input);
}

// Single character tokenization for precise token boundaries
function tokenizeSingleCharacter(input: string, position: number): TokenResult {
  const char = input[0];

  // Map single characters to their token types
  const singleCharTokens: { [key: string]: string } = {
    ';': 'Semicolon',
    ':': 'Colon',
    ',': 'Comma',
    '|': 'Pipe',
    '&': 'Ampersand',
    '-': 'Minus',
    '\n': 'Newline',
    ' ': 'Space',
    '\t': 'Space',
    '\r': 'Space',
  };

  if (singleCharTokens[char]) {
    return {
      token: createTokenInstance(singleCharTokens[char], char, position),
      consumed: 1,
    };
  }

  // If it's alphanumeric, treat as NODE_STRING
  if (/[a-zA-Z0-9_]/.test(char)) {
    return {
      token: createTokenInstance('NODE_STRING', char, position),
      consumed: 1,
    };
  }

  return { consumed: 0 };
}

function createTokenInstance(tokenType: string, image: string, offset: number): IToken {
  // Find the token type from our defined tokens
  const tokenTypeObj = findTokenType(tokenType);
  if (!tokenTypeObj) {
    throw new Error(`Unknown token type: ${tokenType}`);
  }

  return {
    image: image,
    startOffset: offset,
    endOffset: offset + image.length - 1,
    startLine: 1,
    endLine: 1,
    startColumn: offset + 1,
    endColumn: offset + image.length,
    tokenType: tokenTypeObj,
    tokenTypeIdx: tokenTypeObj.tokenTypeIdx || 0,
  };
}

// Token type mapping for context-aware tokenization
const tokenTypeMap = new Map<string, TokenType>();

function initializeTokenTypeMap() {
  // Initialize the token type map with all our defined tokens
  const tokenMappings: Array<[string, TokenType]> = [
    // Basic tokens
    ['NODE_STRING', NODE_STRING],
    ['NumberToken', NumberToken],
    ['DIR', DirectionValue],
    ['SEMI', Semicolon],
    ['Newline', Newline],
    ['Space', Space],
    ['EOF', EOF],

    // Keywords
    ['GRAPH', Graph],
    ['subgraph', Subgraph],
    ['end', End],
    ['STYLE', Style],
    ['LINKSTYLE', LinkStyle],
    ['CLASSDEF', ClassDef],
    ['CLASS', Class],
    ['CLICK', Click],
    ['HREF', Href],
    ['Callback', Callback],
    ['Call', Call],
    ['DEFAULT', Default],
    ['INTERPOLATE', Interpolate],

    // Links
    ['LINK_ID', LINK_ID],
    ['LINK', LINK],
    ['START_LINK', START_LINK],
    ['THICK_LINK', THICK_LINK],
    ['START_THICK_LINK', START_THICK_LINK],
    ['DOTTED_LINK', DOTTED_LINK],
    ['START_DOTTED_LINK', START_DOTTED_LINK],

    // Edge text tokens
    ['EdgeTextContent', EdgeTextContent],
    ['EdgeTextPipe', EdgeTextPipe],
    ['EdgeTextEnd', EdgeTextEnd],

    // Shape tokens
    ['SQS', SquareStart],
    ['SQE', SquareEnd],
    ['CIRCLESTART', CircleStart],
    ['CIRCLEEND', CircleEnd],
    ['DOUBLECIRCLESTART', DoubleCircleStart],
    ['DOUBLECIRCLEEND', DoubleCircleEnd],
    ['PS', PS],
    ['PE', PE],
    ['HEXSTART', HexagonStart],
    ['HEXEND', HexagonEnd],
    ['DIAMOND_START', DiamondStart],
    ['DIAMOND_STOP', DiamondEnd],

    // String tokens
    ['StringStart', StringStart],
    ['StringEnd', StringEnd],
    ['StringContent', StringContent],
    ['MarkdownStringStart', MarkdownStringStart],
    ['MarkdownStringEnd', MarkdownStringEnd],
    ['MarkdownStringContent', MarkdownStringContent],
    ['QuotedString', QuotedString],

    // Text tokens
    ['textToken', TextContent],
    ['PIPE', Pipe],
    ['PipeEnd', PipeEnd],

    // Punctuation
    ['AMP', Ampersand],
    ['AtSymbol', AtSymbol],
    ['Minus', Minus],
    ['Colon', Colon],
    ['Comma', Comma],

    // Accessibility tokens
    ['AccTitle', AccTitle],
    ['AccTitleValue', AccTitleValue],
    ['AccDescr', AccDescr],
    ['AccDescrValue', AccDescrValue],
    ['AccDescrMultiline', AccDescrMultiline],
    ['AccDescrMultilineValue', AccDescrMultilineValue],
    ['AccDescrMultilineEnd', AccDescrMultilineEnd],

    // Shape data tokens
    ['ShapeDataStart', ShapeDataStart],
    ['ShapeDataContent', ShapeDataContent],
    ['ShapeDataStringStart', ShapeDataStringStart],
    ['ShapeDataStringContent', ShapeDataStringContent],
    ['ShapeDataStringEnd', ShapeDataStringEnd],
    ['ShapeDataEnd', ShapeDataEnd],

    // Special tokens
    ['IGNORED', NODE_STRING], // Use NODE_STRING as placeholder for ignored tokens
    ['SKIP', NODE_STRING], // Use NODE_STRING as placeholder for skipped tokens
  ];

  tokenMappings.forEach(([name, token]) => {
    tokenTypeMap.set(name, token);
  });
}

function findTokenType(typeName: string): TokenType | undefined {
  if (tokenTypeMap.size === 0) {
    initializeTokenTypeMap();
  }
  return tokenTypeMap.get(typeName);
}

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
  name: 'SEMI',
  pattern: /;/,
});

const Space = createToken({
  name: 'SPACE',
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
// Handles compound cases like &node, -node, vnode where special chars are followed by word chars // cspell:disable-line
// Complex pattern to handle all edge cases including punctuation at start/end
// Includes : and , characters to match JISON behavior, but excludes ::: to avoid conflicts with StyleSeparator
const NODE_STRING = createToken({
  name: 'NODE_STRING',
  pattern: /([A-Za-z0-9!"#$%&'*+.`?\\_/,]|:(?!::)|-(?=[^>.-])|=(?!=))+/,
});

// ============================================================================
// KEYWORDS (with longer_alt to handle conflicts)
// ============================================================================

const Graph = createToken({
  name: 'GRAPH',
  pattern: /graph|flowchart|flowchart-elk/i,
  longer_alt: NODE_STRING,
});

const Subgraph = createToken({
  name: 'subgraph',
  pattern: /subgraph/i,
  longer_alt: NODE_STRING,
});

const End = createToken({
  name: 'end',
  pattern: /end/i,
  longer_alt: NODE_STRING,
});

const Style = createToken({
  name: 'STYLE',
  pattern: /style/i,
  longer_alt: NODE_STRING,
});

const LinkStyle = createToken({
  name: 'LINKSTYLE',
  pattern: /linkstyle/i,
  longer_alt: NODE_STRING,
});

const ClassDef = createToken({
  name: 'CLASSDEF',
  pattern: /classdef/i,
  longer_alt: NODE_STRING,
});

const Class = createToken({
  name: 'CLASS',
  pattern: /class/i,
  longer_alt: NODE_STRING,
});

const Click = createToken({
  name: 'CLICK',
  pattern: /click/i,
  longer_alt: NODE_STRING,
});

const Href = createToken({
  name: 'HREF',
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
  name: 'DEFAULT',
  pattern: /default/i,
  longer_alt: NODE_STRING,
});

const Interpolate = createToken({
  name: 'INTERPOLATE',
  pattern: /interpolate/i,
  longer_alt: NODE_STRING,
});

// ============================================================================
// DIRECTION TOKENS (JISON lines 127-137)
// ============================================================================

const Direction = createToken({
  name: 'Direction',
  pattern: /direction/,
  longer_alt: NODE_STRING,
});

const DirectionValue = createToken({
  name: 'DIR',
  pattern: /LR|RL|TB|BT|TD|BR|<|>|\^|v/,
  longer_alt: NODE_STRING,
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

// Link ID token (must come before NODE_STRING to avoid conflicts)
const LINK_ID = createToken({
  name: 'LINK_ID',
  pattern: /[^\s"]+@(?=[^{"])/,
  longer_alt: NODE_STRING,
});

// Regular links without text
const LINK = createToken({
  name: 'LINK',
  pattern: /[<ox]?--+[>ox-]/,
});

const START_LINK = createToken({
  name: 'START_LINK',
  pattern: /[<ox]?--/,
  push_mode: 'edgeText_mode',
});

// Regular thick links without text
const THICK_LINK = createToken({
  name: 'THICK_LINK',
  pattern: /[<ox]?==+[=>ox-]?/,
});

const START_THICK_LINK = createToken({
  name: 'START_THICK_LINK',
  pattern: /[<ox]?==/,
  push_mode: 'thickEdgeText_mode',
});

// Regular dotted links without text
const DOTTED_LINK = createToken({
  name: 'DOTTED_LINK',
  pattern: /[<ox]?-?\.+-[>ox]?/,
});

const START_DOTTED_LINK = createToken({
  name: 'START_DOTTED_LINK',
  pattern: /[<ox]?-\./,
  push_mode: 'dottedEdgeText_mode',
});

// ============================================================================
// SHAPE TOKENS (JISON lines 169-194)
// ============================================================================

// Mode-switching tokens for shapes
const SquareStart = createToken({
  name: 'SQS',
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
  name: 'DOUBLECIRCLESTART',
  pattern: /\({3}/,
  push_mode: 'text_mode',
});

const CircleStart = createToken({
  name: 'CIRCLESTART',
  pattern: /\(\(/,
  push_mode: 'text_mode',
});

// Hexagon tokens
const HexagonStart = createToken({
  name: 'HEXSTART',
  pattern: /{{/,
  push_mode: 'text_mode',
});

const DiamondStart = createToken({
  name: 'DIAMOND_START',
  pattern: /{/,
  push_mode: 'text_mode',
});

// Subroutine tokens
const SubroutineStart = createToken({
  name: 'SUBROUTINESTART',
  pattern: /\[\[/,
  push_mode: 'text_mode',
});

// Trapezoid tokens
const TrapezoidStart = createToken({
  name: 'TRAPSTART',
  pattern: /\[\//,
  push_mode: 'text_mode',
});

// Inverted trapezoid tokens
const InvTrapezoidStart = createToken({
  name: 'INVTRAPSTART',
  pattern: /\[\\/,
  push_mode: 'text_mode',
});

// Lean right tokens
const LeanRightStart = createToken({
  name: 'LeanRightStart',
  pattern: /\[\/\//,
  push_mode: 'text_mode',
});

// Note: Lean left uses InvTrapezoidStart ([\) and TrapezoidEnd (\]) tokens
// The distinction between lean_left and inv_trapezoid is made in the parser

// Odd vertex tokens
// Special token for node IDs ending with minus followed by odd start (e.g., "odd->")
const NodeIdWithOddStart = createToken({
  name: 'NodeIdWithOddStart',
  pattern: /([A-Za-z0-9!"#$%&'*+.`?\\_/,]|:(?!::)|-(?=[^>.-])|=(?!=))*->/,
  push_mode: 'text_mode',
});

const OddStart = createToken({
  name: 'OddStart',
  pattern: />/,
  push_mode: 'text_mode',
});

// Rect tokens
const RectStart = createToken({
  name: 'RectStart',
  pattern: /\[\|/,
  push_mode: 'rectText_mode',
});

// Stadium tokens
const StadiumStart = createToken({
  name: 'StadiumStart',
  pattern: /\(\[/,
  push_mode: 'text_mode',
});

// Ellipse tokens
const EllipseStart = createToken({
  name: 'EllipseStart',
  pattern: /\(-/,
  push_mode: 'text_mode',
});

// Cylinder tokens
const CylinderStart = createToken({
  name: 'CylinderStart',
  pattern: /\[\(/,
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

// Style separator for direct class application (:::)
const StyleSeparator = createToken({
  name: 'StyleSeparator',
  pattern: /:::/,
});

const Pipe = createToken({
  name: 'PIPE',
  pattern: /\|/,
  push_mode: 'text_mode',
});

const Ampersand = createToken({
  name: 'AMP',
  pattern: /&/,
  longer_alt: NODE_STRING,
});

const AtSymbol = createToken({
  name: 'AtSymbol',
  pattern: /@/,
  longer_alt: NODE_STRING,
});

const Minus = createToken({
  name: 'Minus',
  pattern: /-/,
  longer_alt: NODE_STRING,
});

// Additional special character tokens for node IDs - currently unused but kept for future reference
// const Hash = createToken({
//   name: 'Hash',
//   pattern: /#/,
//   longer_alt: NODE_STRING,
// });

// const Asterisk = createToken({
//   name: 'Asterisk',
//   pattern: /\*/,
//   longer_alt: NODE_STRING,
// });

// const Dot = createToken({
//   name: 'Dot',
//   pattern: /\./,
//   longer_alt: NODE_STRING,
// });

// Backslash token removed - handled entirely by NODE_STRING

// const Slash = createToken({
//   name: 'Slash',
//   pattern: /\//,
//   longer_alt: NODE_STRING,
// });

// const Underscore = createToken({
//   name: 'Underscore',
//   pattern: /_/,
//   longer_alt: NODE_STRING,
// });

const NumberToken = createToken({
  name: 'NumberToken',
  pattern: /\d+(?![A-Za-z])/,
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
  name: 'textToken',
  pattern: /(?:[^"()[\]{|}\\/-]|-(?!\))|\/(?!\])|\\(?!\]))+/,
});

// Rect text content - allows | characters in text
const RectTextContent = createToken({
  name: 'RectTextContent',
  pattern: /(?:[^"()[\]{}\\/-]|-(?!\))|\/(?!\])|\\(?!\])|\|(?!\]))+/,
});

const BackslashInText = createToken({
  name: 'BackslashInText',
  pattern: /\\/,
});

const QuotedString = createToken({
  name: 'QuotedString',
  pattern: /"[^"]*"/,
});

const SquareEnd = createToken({
  name: 'SQE',
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
  name: 'DOUBLECIRCLEEND',
  pattern: /\){3}/,
  pop_mode: true,
});

const CircleEnd = createToken({
  name: 'CIRCLEEND',
  pattern: /\)\)/,
  pop_mode: true,
});

// Hexagon end token
const HexagonEnd = createToken({
  name: 'HEXEND',
  pattern: /}}/,
  pop_mode: true,
});

const DiamondEnd = createToken({
  name: 'DIAMOND_STOP',
  pattern: /}/,
  pop_mode: true,
});

// Subroutine end token
const SubroutineEnd = createToken({
  name: 'SubroutineEnd',
  pattern: /\]\]/,
  pop_mode: true,
});

// Trapezoid end token
const TrapezoidEnd = createToken({
  name: 'TrapezoidEnd',
  pattern: /\\\]/,
  pop_mode: true,
});

// Inverted trapezoid end token
const InvTrapezoidEnd = createToken({
  name: 'InvTrapezoidEnd',
  pattern: /\/\]/,
  pop_mode: true,
});

// Lean right end token
const LeanRightEnd = createToken({
  name: 'LeanRightEnd',
  pattern: /\\\\\]/,
  pop_mode: true,
});

// Note: Lean left end uses TrapezoidEnd (\]) token
// The distinction between lean_left and trapezoid is made in the parser

// Note: Rect shapes use SquareEnd (]) token
// The distinction between square and rect is made in the parser based on start token

// Note: Odd shapes use SquareEnd (]) token
// The distinction between square, rect, and odd is made in the parser based on start token

// Stadium end token
const StadiumEnd = createToken({
  name: 'StadiumEnd',
  pattern: /\]\)/,
  pop_mode: true,
});

// Ellipse end token
const EllipseEnd = createToken({
  name: 'EllipseEnd',
  pattern: /-\)/,
  pop_mode: true,
});

// Cylinder end token
const CylinderEnd = createToken({
  name: 'CylinderEnd',
  pattern: /\)\]/,
  pop_mode: true,
});

// Pipe token for text mode that pops back to initial mode
const PipeEnd = createToken({
  name: 'PipeEnd',
  pattern: /\|/,
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
      Interpolate,
      Direction,

      // Links (order matters for precedence - must come before DirectionValue)
      // Full patterns must come before partial patterns to avoid conflicts
      THICK_LINK,
      DOTTED_LINK,
      LINK,
      START_THICK_LINK,
      START_DOTTED_LINK,
      START_LINK,

      // Link ID (must come before NODE_STRING to avoid conflicts)
      LINK_ID,

      // Odd shape start (must come before DirectionValue to avoid conflicts)
      NodeIdWithOddStart, // Must come before OddStart to handle "nodeId->" pattern
      OddStart,

      // Direction values (must come after LINK tokens and OddStart)
      DirectionValue,

      // String starts (QuotedString must come before StringStart to avoid conflicts)
      MarkdownStringStart,
      QuotedString,
      StringStart,

      // Shape data
      ShapeDataStart,

      // Shape starts (order matters - longer patterns first)
      LeanRightStart,
      SubroutineStart,
      TrapezoidStart,
      InvTrapezoidStart,
      StadiumStart,
      EllipseStart,
      CylinderStart,
      RectStart,
      SquareStart,
      DoubleCircleStart,
      CircleStart,
      PS,
      HexagonStart,
      DiamondStart,

      // Basic punctuation (must come before NODE_STRING for proper tokenization)
      Pipe,
      Ampersand,
      AtSymbol,
      Minus,
      StyleSeparator, // Must come before Colon to avoid conflicts (:::)
      Colon,
      Comma,

      // Numbers must come before NODE_STRING to avoid being captured by it
      NumberToken,

      // Node strings (must come after punctuation and numbers)
      NODE_STRING,

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
      // Shape end tokens must come first to have priority
      EllipseEnd, // -) pattern must come before TextContent
      LeanRightEnd,
      SubroutineEnd,
      TrapezoidEnd,
      InvTrapezoidEnd,
      StadiumEnd,
      CylinderEnd,
      SquareEnd,
      DoubleCircleEnd,
      CircleEnd,
      PE,
      HexagonEnd,
      DiamondEnd,
      QuotedString,
      PipeEnd, // Pipe that pops back to initial mode
      BackslashInText,
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

    // rectText mode - for rect shapes that allow | in text
    rectText_mode: [
      WhiteSpace,
      Comment,
      // Shape end tokens must come first to have priority
      SquareEnd, // ] pattern for rect shapes
      BackslashInText,
      RectTextContent,
    ],

    // shapeData mode (JISON lines 57-64)
    shapeData_mode: [WhiteSpace, Comment, ShapeDataEnd, ShapeDataStringStart, ShapeDataContent],

    // shapeDataStr mode (JISON lines 49-56)
    shapeDataStr_mode: [ShapeDataStringEnd, ShapeDataStringContent],
  },

  defaultMode: 'initial_mode',
};

const OriginalFlowchartLexer = new Lexer(multiModeLexerDefinition);

// Debug wrapper for lexer tokenization
const tokenizeWithDebug = (input: string) => {
  const lexResult = OriginalFlowchartLexer.tokenize(input);

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
  ...OriginalFlowchartLexer,
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

  // Links (must come before NODE_STRING to avoid conflicts)
  LINK_ID,
  LINK,
  START_LINK,
  THICK_LINK,
  START_THICK_LINK,
  DOTTED_LINK,
  START_DOTTED_LINK,

  // Shapes (must come before NODE_STRING to avoid conflicts)
  LeanRightStart,
  LeanRightEnd,
  SubroutineStart,
  SubroutineEnd,
  TrapezoidStart,
  TrapezoidEnd,
  InvTrapezoidStart,
  InvTrapezoidEnd,
  StadiumStart,
  StadiumEnd,
  EllipseStart,
  EllipseEnd,
  CylinderStart,
  CylinderEnd,
  RectStart,
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
  NodeIdWithOddStart,
  OddStart,

  // Numbers must come before NODE_STRING to avoid being captured by it
  NumberToken,

  // Node strings and identifiers
  NODE_STRING,

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
  Interpolate,

  // Direction
  Direction,
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

  // Edge text
  EdgeTextContent,
  EdgeTextPipe,
  EdgeTextEnd,

  // Text content
  TextContent,
  RectTextContent,
  BackslashInText,
  QuotedString,

  // Basic punctuation
  StyleSeparator, // Must come before Colon to avoid conflicts (:::)
  Colon,
  Comma,
  Pipe,
  PipeEnd,
  Ampersand,
  AtSymbol,
  Minus,
];

// Context-aware lexer that provides full compatibility
const ContextAwareFlowchartLexer = {
  ...OriginalFlowchartLexer,
  tokenize: contextAwareTokenize,
};

export { ContextAwareFlowchartLexer as FlowchartLexer };

// Export individual tokens for parser use
export {
  // Basic tokens
  WhiteSpace,
  Comment,
  Newline,
  Semicolon,
  Space,
  EOF,

  // Numbers must come before NODE_STRING to avoid being captured by it
  NumberToken,

  // Node strings and identifiers
  NODE_STRING,

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
  Interpolate,

  // Direction
  Direction,
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
  LINK_ID,
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
  LeanRightStart,
  LeanRightEnd,
  SubroutineStart,
  SubroutineEnd,
  TrapezoidStart,
  TrapezoidEnd,
  InvTrapezoidStart,
  InvTrapezoidEnd,
  StadiumStart,
  StadiumEnd,
  EllipseStart,
  EllipseEnd,
  CylinderStart,
  CylinderEnd,
  RectStart,
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
  NodeIdWithOddStart,
  OddStart,

  // Text content
  TextContent,
  RectTextContent,
  BackslashInText,
  QuotedString,

  // Basic punctuation
  StyleSeparator, // Must come before Colon to avoid conflicts (:::)
  Colon,
  Comma,
  Pipe,
  PipeEnd,
  Ampersand,
  AtSymbol,
  Minus,
};
