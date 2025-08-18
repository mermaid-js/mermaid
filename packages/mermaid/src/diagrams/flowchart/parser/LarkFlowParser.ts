/**
 * Lark-inspired Flowchart Parser
 *
 * This is a JavaScript implementation inspired by Lark.js parsing philosophy.
 * It uses a recursive descent parser with a clean, grammar-driven approach.
 */

import { FlowDB } from '../flowDb.js';

/**
 * Token types for the lexer
 */
export enum TokenType {
  // Keywords
  GRAPH = 'GRAPH',
  FLOWCHART = 'FLOWCHART',
  SUBGRAPH = 'SUBGRAPH',
  END = 'END',
  STYLE = 'STYLE',
  CLASS = 'CLASS',
  CLASSDEF = 'CLASSDEF',
  CLICK = 'CLICK',
  HREF = 'HREF',
  CALL = 'CALL',
  LINKSTYLE = 'LINKSTYLE',
  INTERPOLATE = 'INTERPOLATE',
  DEFAULT = 'DEFAULT',

  // Directions
  DIRECTION = 'DIRECTION',

  // Node shapes
  SQUARE_START = 'SQUARE_START',
  SQUARE_END = 'SQUARE_END',
  ROUND_START = 'ROUND_START',
  ROUND_END = 'ROUND_END',
  ELLIPSE_START = 'ELLIPSE_START',
  ELLIPSE_END = 'ELLIPSE_END',
  DIAMOND_START = 'DIAMOND_START',
  DIAMOND_END = 'DIAMOND_END',
  CIRCLE_START = 'CIRCLE_START',
  CIRCLE_END = 'CIRCLE_END',
  HEXAGON_START = 'HEXAGON_START',
  HEXAGON_END = 'HEXAGON_END',
  DOUBLECIRCLE_START = 'DOUBLECIRCLE_START',
  DOUBLECIRCLE_END = 'DOUBLECIRCLE_END',

  // Complex node shapes
  CYLINDER_START = 'CYLINDER_START', // [(
  CYLINDER_END = 'CYLINDER_END', // )]
  STADIUM_START = 'STADIUM_START', // ([
  STADIUM_END = 'STADIUM_END', // ])
  SUBROUTINE_START = 'SUBROUTINE_START', // [[
  SUBROUTINE_END = 'SUBROUTINE_END', // ]]
  TRAPEZOID_START = 'TRAPEZOID_START', // [/
  TRAPEZOID_END = 'TRAPEZOID_END', // \]
  INV_TRAPEZOID_START = 'INV_TRAPEZOID_START', // [\
  INV_TRAPEZOID_END = 'INV_TRAPEZOID_END', // /]
  LEAN_RIGHT_START = 'LEAN_RIGHT_START', // [/
  LEAN_RIGHT_END = 'LEAN_RIGHT_END', // /]
  LEAN_LEFT_START = 'LEAN_LEFT_START', // [\
  LEAN_LEFT_END = 'LEAN_LEFT_END', // \]
  ODD_START = 'ODD_START', // >
  ODD_END = 'ODD_END', // ]
  RECT_START = 'RECT_START', // [|

  // Edges
  ARROW = 'ARROW',
  LINE = 'LINE',
  DOTTED_ARROW = 'DOTTED_ARROW',
  DOTTED_LINE = 'DOTTED_LINE',
  THICK_ARROW = 'THICK_ARROW',
  THICK_LINE = 'THICK_LINE',
  DOUBLE_ARROW = 'DOUBLE_ARROW',
  DOUBLE_THICK_ARROW = 'DOUBLE_THICK_ARROW',
  DOUBLE_DOTTED_ARROW = 'DOUBLE_DOTTED_ARROW',

  // Special arrow endings
  CIRCLE_ARROW = 'CIRCLE_ARROW', // --o
  CROSS_ARROW = 'CROSS_ARROW', // --x

  // Edge text patterns (for complex arrows with text)
  START_LINK = 'START_LINK',
  EDGE_TEXT = 'EDGE_TEXT',
  LINK = 'LINK',

  // Literals
  WORD = 'WORD',
  STRING = 'STRING',
  MARKDOWN_STRING = 'MARKDOWN_STRING',
  NUMBER = 'NUMBER',
  COLOR = 'COLOR',

  // Node data syntax
  NODE_DATA_START = 'NODE_DATA_START', // @{
  NODE_DATA_END = 'NODE_DATA_END', // }
  NODE_DATA_TEXT = 'NODE_DATA_TEXT', // content inside @{ ... }

  // Punctuation
  PIPE = 'PIPE',
  COMMA = 'COMMA',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  TRIPLE_COLON = 'TRIPLE_COLON',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  BRACKET_OPEN = 'BRACKET_OPEN',
  BRACKET_CLOSE = 'BRACKET_CLOSE',

  // Whitespace
  NEWLINE = 'NEWLINE',
  SPACE = 'SPACE',
  COMMENT = 'COMMENT',

  // Special
  EOF = 'EOF',
}

/**
 * Token interface
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Lexer states for handling complex edge text patterns and node data
 */
enum LexerState {
  INITIAL = 'INITIAL',
  EDGE_TEXT = 'EDGE_TEXT',
  THICK_EDGE_TEXT = 'THICK_EDGE_TEXT',
  DOTTED_EDGE_TEXT = 'DOTTED_EDGE_TEXT',
  NODE_DATA = 'NODE_DATA',
}

/**
 * Lark-inspired Lexer
 */
export class LarkFlowLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private state: LexerState = LexerState.INITIAL;
  private stateStack: LexerState[] = [];

  constructor(input: string) {
    this.input = input || '';
  }

  /**
   * Tokenize the input string
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.state = LexerState.INITIAL;
    this.stateStack = [];

    while (this.position < this.input.length) {
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  /**
   * Push current state and switch to new state
   */
  private pushState(newState: LexerState): void {
    this.stateStack.push(this.state);
    this.state = newState;
  }

  /**
   * Pop previous state
   */
  private popState(): void {
    if (this.stateStack.length > 0) {
      this.state = this.stateStack.pop()!;
    } else {
      this.state = LexerState.INITIAL;
    }
  }

  private scanToken(): void {
    // Dispatch to appropriate scanner based on current state
    switch (this.state) {
      case LexerState.INITIAL:
        this.scanTokenInitial();
        break;
      case LexerState.EDGE_TEXT:
        this.scanTokenEdgeText();
        break;
      case LexerState.THICK_EDGE_TEXT:
        this.scanTokenThickEdgeText();
        break;
      case LexerState.DOTTED_EDGE_TEXT:
        this.scanTokenDottedEdgeText();
        break;
      case LexerState.NODE_DATA:
        this.scanTokenNodeData();
        break;
    }
  }

  private scanTokenInitial(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    const char = this.advance();

    switch (char) {
      case ' ':
      case '\t':
        this.scanWhitespace();
        break;
      case '\n':
      case '\r':
        this.scanNewline();
        break;
      case '%':
        if (this.peek() === '%') {
          this.scanComment();
        } else {
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        }
        break;
      case '[':
        // Check for complex node shapes starting with [
        if (this.peek() === '(') {
          // Cylinder: [(
          this.advance(); // consume (
          this.addToken(TokenType.CYLINDER_START, '[(', startLine, startColumn);
        } else if (this.peek() === '[') {
          // Subroutine: [[
          this.advance(); // consume second [
          this.addToken(TokenType.SUBROUTINE_START, '[[', startLine, startColumn);
        } else if (this.peek() === '/') {
          // Could be trapezoid [/ or lean_right [/
          this.advance(); // consume /
          this.addToken(TokenType.TRAPEZOID_START, '[/', startLine, startColumn);
        } else if (this.peek() === '\\') {
          // Could be inv_trapezoid [\ or lean_left [\
          this.advance(); // consume \
          this.addToken(TokenType.INV_TRAPEZOID_START, '[\\', startLine, startColumn);
        } else if (this.peek() === '|') {
          // Rect: [|
          this.advance(); // consume |
          this.addToken(TokenType.RECT_START, '[|', startLine, startColumn);
        } else {
          // Check if this is a subgraph title bracket or a node shape
          if (this.isInSubgraphTitleContext()) {
            this.addToken(TokenType.BRACKET_OPEN, char, startLine, startColumn);
          } else {
            // Regular square: [
            this.addToken(TokenType.SQUARE_START, char, startLine, startColumn);
          }
        }
        break;
      case ']':
        // Check for complex endings
        if (this.peek() === ')') {
          // Stadium end: ])
          this.advance(); // consume )
          this.addToken(TokenType.STADIUM_END, '])', startLine, startColumn);
        } else if (this.peek() === ']') {
          // Subroutine end: ]]
          this.advance(); // consume second ]
          this.addToken(TokenType.SUBROUTINE_END, ']]', startLine, startColumn);
        } else {
          // Check if this is a subgraph title bracket or a node shape
          if (this.isInSubgraphTitleContext()) {
            this.addToken(TokenType.BRACKET_CLOSE, char, startLine, startColumn);
          } else {
            // Regular square end
            this.addToken(TokenType.SQUARE_END, char, startLine, startColumn);
          }
        }
        break;
      case '(':
        if (this.peek() === '(' && this.peekNext() === '(') {
          // Triple parentheses: (((
          this.advance(); // consume second (
          this.advance(); // consume third (
          this.addToken(TokenType.DOUBLECIRCLE_START, '(((', startLine, startColumn);
        } else if (this.peek() === '(') {
          this.advance();
          this.addToken(TokenType.CIRCLE_START, '((', startLine, startColumn);
        } else if (this.peek() === '[') {
          // Stadium: ([
          this.advance(); // consume [
          this.addToken(TokenType.STADIUM_START, '([', startLine, startColumn);
        } else if (this.peek() === '-') {
          // Ellipse: (-
          this.advance(); // consume -
          this.addToken(TokenType.ELLIPSE_START, '(-', startLine, startColumn);
        } else {
          // Check if this is part of a node shape or a standalone parenthesis
          if (this.isInNodeContext()) {
            this.addToken(TokenType.ROUND_START, char, startLine, startColumn);
          } else {
            this.addToken(TokenType.LPAREN, char, startLine, startColumn);
          }
        }
        break;
      case ')':
        if (this.peek() === ')' && this.peekNext() === ')') {
          // Triple parentheses: )))
          this.advance(); // consume second )
          this.advance(); // consume third )
          this.addToken(TokenType.DOUBLECIRCLE_END, ')))', startLine, startColumn);
        } else if (this.peek() === ')') {
          this.advance();
          this.addToken(TokenType.CIRCLE_END, '))', startLine, startColumn);
        } else if (this.peek() === ']') {
          // Cylinder end: )]
          this.advance(); // consume ]
          this.addToken(TokenType.CYLINDER_END, ')]', startLine, startColumn);
        } else {
          // Check if this is part of a node shape or a standalone parenthesis
          if (this.isInNodeContext()) {
            this.addToken(TokenType.ROUND_END, char, startLine, startColumn);
          } else {
            this.addToken(TokenType.RPAREN, char, startLine, startColumn);
          }
        }
        break;
      case '{':
        if (this.peek() === '{') {
          this.advance();
          this.addToken(TokenType.HEXAGON_START, '{{', startLine, startColumn);
        } else {
          this.addToken(TokenType.DIAMOND_START, char, startLine, startColumn);
        }
        break;
      case '}':
        if (this.peek() === '}') {
          this.advance();
          this.addToken(TokenType.HEXAGON_END, '}}', startLine, startColumn);
        } else {
          this.addToken(TokenType.DIAMOND_END, char, startLine, startColumn);
        }
        break;
      case '-':
        // Check for ellipse end pattern: -)
        if (this.peek() === ')' && this.isInNodeContext()) {
          this.advance(); // consume )
          this.addToken(TokenType.ELLIPSE_END, '-)', startLine, startColumn);
        } else if (this.isPartOfPunctuationSequence()) {
          // If this is part of a punctuation sequence, treat it as punctuation
          this.scanPunctuation(startLine, startColumn);
        } else if (this.isInSubgraphTitleContext()) {
          // If we're in a subgraph title context, treat as word/punctuation
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        } else {
          this.scanEdge(startLine, startColumn);
        }
        break;
      case '=':
        this.scanThickEdge(startLine, startColumn);
        break;
      case '<':
        // Check if this is a standalone direction symbol or part of an edge
        if (this.isStandaloneDirection(char)) {
          this.addToken(TokenType.DIRECTION, char, startLine, startColumn);
        } else {
          this.scanBidirectionalEdge(startLine, startColumn);
        }
        break;
      case '>':
        // Check if this is a standalone direction symbol or odd shape start
        if (this.isStandaloneDirection(char)) {
          this.addToken(TokenType.DIRECTION, char, startLine, startColumn);
        } else if (this.isInNodeContext()) {
          // Odd shape start: >
          this.addToken(TokenType.ODD_START, char, startLine, startColumn);
        } else {
          this.scanWord(startLine, startColumn);
        }
        break;
      case '^':
        // Check if this is a standalone direction symbol
        if (this.isStandaloneDirection(char)) {
          this.addToken(TokenType.DIRECTION, char, startLine, startColumn);
        } else {
          this.scanWord(startLine, startColumn);
        }
        break;
      case '|':
        this.addToken(TokenType.PIPE, char, startLine, startColumn);
        break;
      case ',':
        // Always tokenize commas as COMMA tokens for proper parsing
        this.addToken(TokenType.COMMA, char, startLine, startColumn);
        break;
      case ':':
        if (this.peek() === ':' && this.peekNext() === ':') {
          // Triple colon: :::
          this.advance(); // consume second :
          this.advance(); // consume third :
          this.addToken(TokenType.TRIPLE_COLON, ':::', startLine, startColumn);
        } else {
          this.addToken(TokenType.COLON, char, startLine, startColumn);
        }
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON, char, startLine, startColumn);
        break;
      case '"':
      case "'":
        this.scanString(char, startLine, startColumn);
        break;
      case '#':
        this.scanColor(startLine, startColumn);
        break;
      case '@':
        if (this.peek() === '{') {
          this.advance(); // consume '{'
          this.addToken(TokenType.NODE_DATA_START, '@{', startLine, startColumn);
          this.pushState(LexerState.NODE_DATA);
        } else {
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        }
        break;
      case '/':
        if (this.peek() === ']') {
          // Could be trapezoid end /] or lean_right end /]
          this.advance(); // consume ]
          this.addToken(TokenType.LEAN_RIGHT_END, '/]', startLine, startColumn);
        } else {
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        }
        break;
      case '\\':
        if (this.peek() === ']') {
          // Could be inv_trapezoid end \] or lean_left end \]
          this.advance(); // consume ]
          this.addToken(TokenType.LEAN_LEFT_END, '\\]', startLine, startColumn);
        } else {
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        }
        break;

      default:
        if (this.isAlpha(char)) {
          this.scanWord(startLine, startColumn);
        } else if (this.isDigit(char)) {
          this.scanNumber(startLine, startColumn);
        } else if (this.isPunctuation(char)) {
          // Scan punctuation as a continuous sequence
          this.scanPunctuation(startLine, startColumn);
        } else {
          // Unknown character, treat as word
          this.addToken(TokenType.WORD, char, startLine, startColumn);
        }
        break;
    }
  }

  private scanWhitespace(): void {
    const startLine = this.line;
    const startColumn = this.column;
    let whitespace = ' '; // Start with the current space character

    while (this.peek() === ' ' || this.peek() === '\t') {
      whitespace += this.advance();
    }

    // Generate a SPACE token for the whitespace
    this.addToken(TokenType.SPACE, whitespace, startLine, startColumn);
  }

  private scanNewline(): void {
    if (this.current() === '\r' && this.peek() === '\n') {
      this.advance();
    }
    this.addToken(TokenType.NEWLINE, '\n', this.line, this.column);
    this.line++;
    this.column = 1;
  }

  private scanComment(): void {
    this.advance(); // consume second %
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
    // Ignore comment tokens for now
  }

  private scanEdge(startLine: number, startColumn: number): void {
    let value = '-';

    // Look ahead to capture complete edge patterns like --x, --o, -->, etc.
    let lookahead = '-'; // Initialize with the first dash that's already consumed
    let pos = this.position;

    // Collect the complete edge pattern
    while (pos < this.input.length) {
      const char = this.input[pos];
      if (char === '-' || char === '.' || char === '>') {
        lookahead += char;
        pos++;
      } else if (char === 'x' || char === 'o') {
        // Only include 'x' or 'o' if they are likely edge endings, not part of node names
        const nextChar = pos + 1 < this.input.length ? this.input[pos + 1] : '';

        // Include 'x' or 'o' if:
        // 1. It's at the end of input, OR
        // 2. It's followed by a non-letter character (space, punctuation, etc.), OR
        // 3. It's 'x' followed by a single uppercase letter (like 'xB' in '--xB'), OR
        // 4. It's 'o' or 'x' preceded by dashes (edge ending like '--o' or '--x')
        if (
          !nextChar ||
          !/[a-zA-Z]/.test(nextChar) ||
          (char === 'x' &&
            /[A-Z]/.test(nextChar) &&
            (pos + 2 >= this.input.length || !/[a-zA-Z]/.test(this.input[pos + 2]))) ||
          (lookahead.includes('-') && (char === 'o' || char === 'x'))
        ) {
          lookahead += char;
          pos++;
        } else {
          // 'x' or 'o' is part of a longer word, don't include it
          break;
        }
      } else {
        break;
      }
    }

    // Consume the lookahead characters (excluding the first dash which was already consumed)
    // The lookahead includes the first dash, but we already consumed it when scanEdge() was called
    for (let i = 1; i < lookahead.length; i++) {
      this.advance();
    }

    value += lookahead;

    // Determine token type based on complete pattern
    if (value.includes('>')) {
      if (value.includes('.')) {
        this.addToken(TokenType.DOTTED_ARROW, value, startLine, startColumn);
      } else {
        this.addToken(TokenType.ARROW, value, startLine, startColumn);
      }
    } else if (value.includes('x')) {
      // Cross ending like --x

      this.addToken(TokenType.CROSS_ARROW, value, startLine, startColumn);
    } else if (value.includes('o')) {
      // Circle ending like --o

      this.addToken(TokenType.CIRCLE_ARROW, value, startLine, startColumn);
    } else if (value.includes('.')) {
      this.addToken(TokenType.DOTTED_LINE, value, startLine, startColumn);
    } else {
      this.addToken(TokenType.LINE, value, startLine, startColumn);
    }
  }

  private scanThickEdge(startLine: number, startColumn: number): void {
    let value = '=';

    if (this.peek() === '=') {
      this.advance();
      value += '=';

      if (this.peek() === '>') {
        this.advance();
        value += '>';
        this.addToken(TokenType.THICK_ARROW, value, startLine, startColumn);
      } else {
        this.addToken(TokenType.THICK_LINE, value, startLine, startColumn);
      }
    } else {
      this.addToken(TokenType.WORD, value, startLine, startColumn);
    }
  }

  private scanBidirectionalEdge(startLine: number, startColumn: number): void {
    // Disable complex pattern matching for now and use stateful approach
    // const complexPattern = this.tryMatchComplexEdgePattern(startLine, startColumn);
    // if (complexPattern) {
    //   return;
    // }

    // Use stateful bidirectional edge scanning
    let value = '<';

    if (this.peek() === '-') {
      this.advance();
      value += '-';

      if (this.peek() === '-') {
        this.advance();
        value += '-';

        if (this.peek() === '>') {
          // Complete double arrow: <-->
          this.advance();
          value += '>';
          this.addToken(TokenType.DOUBLE_ARROW, value, startLine, startColumn);
        } else {
          // Incomplete pattern: <-- (start of edge text)
          this.addToken(TokenType.START_LINK, value, startLine, startColumn);
          this.pushState(LexerState.EDGE_TEXT);
        }
      } else if (this.peek() === '.') {
        this.advance();
        value += '.';

        // For dotted arrows, <-. is the start pattern, not <-.-
        // Check if this is followed by -> for complete pattern <-.->
        if (this.peek() === '-' && this.peekNext() === '>') {
          this.advance(); // consume -
          this.advance(); // consume >
          value += '->';
          this.addToken(TokenType.DOUBLE_DOTTED_ARROW, value, startLine, startColumn);
        } else {
          // Incomplete pattern: <-. (start of dotted edge text)
          this.addToken(TokenType.START_LINK, value, startLine, startColumn);
          this.pushState(LexerState.DOTTED_EDGE_TEXT);
        }
      } else if (this.peek() === '>') {
        // Simple double arrow: <->
        this.advance();
        value += '>';
        this.addToken(TokenType.DOUBLE_ARROW, value, startLine, startColumn);
      } else {
        // Incomplete pattern: <- (not a valid start link, treat as word)
        this.addToken(TokenType.WORD, value, startLine, startColumn);
      }
    } else if (this.peek() === '=') {
      this.advance();
      value += '=';

      if (this.peek() === '=') {
        this.advance();
        value += '=';

        if (this.peek() === '>') {
          // Complete double thick arrow: <==>
          this.advance();
          value += '>';
          this.addToken(TokenType.DOUBLE_THICK_ARROW, value, startLine, startColumn);
        } else {
          // Incomplete pattern: <== (start of thick edge text)
          this.addToken(TokenType.START_LINK, value, startLine, startColumn);
          this.pushState(LexerState.THICK_EDGE_TEXT);
        }
      }
    } else {
      this.addToken(TokenType.WORD, value, startLine, startColumn);
    }
  }

  /**
   * Try to match complete complex edge patterns like <-- text -->
   * Returns true if a pattern was matched and tokens were generated
   */
  private tryMatchComplexEdgePattern(startLine: number, startColumn: number): boolean {
    const savedPosition = this.position;
    const savedLine = this.line;
    const savedColumn = this.column;

    try {
      // Try to match <-- text -->
      if (this.matchComplexPattern('<--', '-->')) {
        return true;
      }

      // Try to match <== text ==>
      if (this.matchComplexPattern('<==', '==>')) {
        return true;
      }

      // Try to match <-. text .->
      if (this.matchComplexPattern('<-.', '.->')) {
        return true;
      }

      return false;
    } catch (error) {
      // Restore position if pattern matching fails
      this.position = savedPosition;
      this.line = savedLine;
      this.column = savedColumn;
      return false;
    }
  }

  /**
   * Try to match a specific complex pattern like <-- text -->
   */
  private matchComplexPattern(startPattern: string, endPattern: string): boolean {
    const originalPosition = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    // Check if we start with the start pattern
    if (!this.matchString(startPattern)) {
      return false;
    }

    // Consume the start pattern
    for (let i = 0; i < startPattern.length; i++) {
      this.advance();
    }

    // Look for the end pattern
    let textContent = '';
    while (!this.isAtEnd()) {
      // Check if we've found the end pattern
      if (this.matchString(endPattern)) {
        // Found complete pattern! Generate tokens
        this.addToken(TokenType.START_LINK, startPattern, startLine, startColumn);

        if (textContent.trim()) {
          // Add edge text token (use original position for line/column)
          this.addToken(
            TokenType.EDGE_TEXT,
            textContent.trim(),
            startLine,
            startColumn + startPattern.length
          );
        }

        // Consume end pattern and add LINK token
        const linkStartColumn = this.column;
        for (let i = 0; i < endPattern.length; i++) {
          this.advance();
        }
        this.addToken(TokenType.LINK, endPattern, this.line, linkStartColumn);

        return true;
      }

      // Collect text content, but be careful not to include end pattern characters
      const char = this.advance();

      // Stop if we hit a newline or semicolon (end of statement)
      if (char === '\n' || char === ';') {
        // Put back the character and break
        this.position--;
        break;
      }

      textContent += char;
    }

    // Pattern not found, restore position
    this.position = originalPosition;
    return false;
  }

  /**
   * Check if the current position matches a specific string
   */
  private matchString(pattern: string): boolean {
    if (this.position + pattern.length > this.input.length) {
      return false;
    }

    for (let i = 0; i < pattern.length; i++) {
      if (this.input[this.position + i] !== pattern[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Scan tokens in EDGE_TEXT state (for patterns like <-- text -->)
   */
  private scanTokenEdgeText(): void {
    const startLine = this.line;
    const startColumn = this.column;

    // Check for end pattern: --> (check BEFORE advancing)
    const currentChar = this.input[this.position];
    const nextChar = this.input[this.position + 1];
    const nextNextChar = this.input[this.position + 2];

    if (currentChar === '-' && nextChar === '-' && nextNextChar === '>') {
      this.advance(); // consume first -
      this.advance(); // consume second -
      this.advance(); // consume >
      this.addToken(TokenType.LINK, '-->', startLine, startColumn);
      this.popState();
      return;
    }

    // Handle whitespace
    if (currentChar === ' ' || currentChar === '\t') {
      this.scanWhitespace();
      return;
    }

    // Handle newlines
    if (currentChar === '\n' || currentChar === '\r') {
      this.scanNewline();
      return;
    }

    // Scan edge text content
    this.scanEdgeTextWord();
  }

  /**
   * Scan tokens in THICK_EDGE_TEXT state (for patterns like <== text ==>)
   */
  private scanTokenThickEdgeText(): void {
    const startLine = this.line;
    const startColumn = this.column;

    // Check for end pattern: ==>
    if (this.input[this.position] === '=' && this.peek() === '=' && this.peekNext() === '>') {
      this.advance(); // consume first =
      this.advance(); // consume second =
      this.advance(); // consume >
      this.addToken(TokenType.LINK, '==>', startLine, startColumn);
      this.popState();
      return;
    }

    // Handle whitespace
    if (this.input[this.position] === ' ' || this.input[this.position] === '\t') {
      this.scanWhitespace();
      return;
    }

    // Handle newlines
    if (this.input[this.position] === '\n' || this.input[this.position] === '\r') {
      this.scanNewline();
      return;
    }

    // Scan edge text content
    this.scanEdgeTextWord();
  }

  /**
   * Scan tokens in DOTTED_EDGE_TEXT state (for patterns like <-. text .->)
   */
  private scanTokenDottedEdgeText(): void {
    const startLine = this.line;
    const startColumn = this.column;

    // Check for end pattern: .->
    if (this.input[this.position] === '.' && this.peek() === '-' && this.peekNext() === '>') {
      this.advance(); // consume .
      this.advance(); // consume -
      this.advance(); // consume >
      this.addToken(TokenType.LINK, '.->', startLine, startColumn);
      this.popState();
      return;
    }

    // Handle whitespace
    if (this.input[this.position] === ' ' || this.input[this.position] === '\t') {
      this.scanWhitespace();
      return;
    }

    // Handle newlines
    if (this.input[this.position] === '\n' || this.input[this.position] === '\r') {
      this.scanNewline();
      return;
    }

    // Scan edge text content
    this.scanEdgeTextWord();
  }

  /**
   * Scan tokens in NODE_DATA state (for patterns like @{ shape: rounded })
   */
  private scanTokenNodeData(): void {
    const startLine = this.line;
    const startColumn = this.column;

    // Check for end pattern: }
    const currentChar = this.input[this.position];
    if (currentChar === '}') {
      this.advance();
      this.addToken(TokenType.NODE_DATA_END, '}', startLine, startColumn);
      this.popState();
      return;
    }

    // Handle whitespace
    if (currentChar === ' ' || currentChar === '\t') {
      this.scanWhitespace();
      return;
    }

    // Handle newlines
    if (currentChar === '\n' || currentChar === '\r') {
      this.scanNewline();
      return;
    }

    // Scan node data content
    this.scanNodeDataContent();
  }

  /**
   * Scan node data content (everything inside @{ ... })
   */
  private scanNodeDataContent(): void {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    // Collect all characters until we hit the closing }
    while (!this.isAtEnd()) {
      const char = this.input[this.position];

      // Stop at closing brace
      if (char === '}') {
        break;
      }

      // Handle quoted strings within node data
      if (char === '"' || char === "'") {
        const quote = char;
        value += this.advance(); // consume opening quote

        // Consume everything until closing quote
        while (!this.isAtEnd() && this.input[this.position] !== quote) {
          if (this.input[this.position] === '\\') {
            value += this.advance(); // consume escape character
            if (!this.isAtEnd()) {
              value += this.advance(); // consume escaped character
            }
          } else {
            value += this.advance();
          }
        }

        if (!this.isAtEnd() && this.input[this.position] === quote) {
          value += this.advance(); // consume closing quote
        }
      } else {
        value += this.advance();
      }
    }

    if (value.trim()) {
      this.addToken(TokenType.NODE_DATA_TEXT, value.trim(), startLine, startColumn);
    }
  }

  /**
   * Scan edge text word (for use in edge text states)
   */
  private scanEdgeTextWord(): void {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    // Collect word characters, but check for end patterns before each character
    while (!this.isAtEnd()) {
      const char = this.input[this.position];

      // Stop at whitespace
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        break;
      }

      // Stop at statement terminators
      if (char === ';') {
        break;
      }

      // IMPORTANT: Check for end pattern BEFORE consuming the character
      if (this.isEndPattern()) {
        break;
      }

      // Consume the character
      value += char;
      this.advance();

      // For non-alphanumeric characters, stop after one character
      // This prevents consuming multiple special characters that might be part of patterns
      // Exception: allow punctuation characters to be grouped together
      if (!this.isAlphaNumeric(char) && !this.isPunctuation(char)) {
        break;
      }
    }

    if (value.length > 0) {
      this.addToken(TokenType.EDGE_TEXT, value, startLine, startColumn);
    }
  }

  /**
   * Check if current position is at an end pattern for the current state
   */
  private isEndPattern(): boolean {
    const currentChar = this.input[this.position];
    const nextChar = this.peek();
    const nextNextChar = this.peekNext();

    switch (this.state) {
      case LexerState.EDGE_TEXT:
        return currentChar === '-' && nextChar === '-' && nextNextChar === '>';
      case LexerState.THICK_EDGE_TEXT:
        return currentChar === '=' && nextChar === '=' && nextNextChar === '>';
      case LexerState.DOTTED_EDGE_TEXT:
        return currentChar === '.' && nextChar === '-' && nextNextChar === '>';
      default:
        return false;
    }
  }

  /**
   * Check if we're about to encounter an end pattern (look ahead)
   */
  private isEndPatternAhead(): boolean {
    switch (this.state) {
      case LexerState.EDGE_TEXT:
        return this.peek() === '-' && this.peekNext() === '-' && this.peekNextNext() === '>';
      case LexerState.THICK_EDGE_TEXT:
        return this.peek() === '=' && this.peekNext() === '=' && this.peekNextNext() === '>';
      case LexerState.DOTTED_EDGE_TEXT:
        return this.peek() === '.' && this.peekNext() === '-' && this.peekNextNext() === '>';
      default:
        return false;
    }
  }

  /**
   * Peek at the character three positions ahead
   */
  private peekNextNext(): string {
    if (this.position + 2 >= this.input.length) return '\0';
    return this.input.charAt(this.position + 2);
  }

  /**
   * Check if character is whitespace
   */
  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private scanString(quote: string, startLine: number, startColumn: number): void {
    let value = '';

    // Check if this is a markdown string (starts with backtick after quote)
    const isMarkdownString = this.peek() === '`';

    if (isMarkdownString) {
      // Consume the opening backtick
      this.advance();

      // Collect content until closing backtick
      while (this.peek() !== '`' && !this.isAtEnd()) {
        if (this.peek() === '\n') this.line++;
        value += this.advance();
      }

      if (this.isAtEnd()) {
        throw new Error(`Unterminated markdown string at line ${startLine}`);
      }

      // Consume closing backtick
      this.advance();

      // Consume closing quote
      if (this.peek() !== quote) {
        throw new Error(`Expected closing quote after markdown string at line ${startLine}`);
      }
      this.advance();

      this.addToken(TokenType.MARKDOWN_STRING, value, startLine, startColumn);
    } else {
      // Regular string processing
      while (this.peek() !== quote && !this.isAtEnd()) {
        if (this.peek() === '\n') this.line++;
        value += this.advance();
      }

      if (this.isAtEnd()) {
        throw new Error(`Unterminated string at line ${startLine}`);
      }

      this.advance(); // consume closing quote
      this.addToken(TokenType.STRING, value, startLine, startColumn);
    }
  }

  private scanColor(startLine: number, startColumn: number): void {
    let value = '#';

    while (this.isHexDigit(this.peek())) {
      value += this.advance();
    }

    if (value.length >= 4 && value.length <= 7) {
      this.addToken(TokenType.COLOR, value, startLine, startColumn);
    } else {
      this.addToken(TokenType.WORD, value, startLine, startColumn);
    }
  }

  private scanWord(startLine: number, startColumn: number): void {
    let value = this.current();

    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      value += this.advance();
    }

    // Check for keywords
    const type = this.getKeywordType(value.toLowerCase());
    this.addToken(type, value, startLine, startColumn);
  }

  private scanNumber(startLine: number, startColumn: number): void {
    let value = this.current();

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    // Check if there are letters after the number (e.g., "1test")
    // If so, treat it as a WORD token instead of a NUMBER token
    if (this.isAlpha(this.peek())) {
      while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
        value += this.advance();
      }
      // Check for keywords
      const type = this.getKeywordType(value.toLowerCase());
      this.addToken(type, value, startLine, startColumn);
    } else {
      this.addToken(TokenType.NUMBER, value, startLine, startColumn);
    }
  }

  private scanPunctuation(startLine: number, startColumn: number): void {
    let value = this.current();

    // Continue scanning punctuation characters to form a continuous sequence
    while (this.isPunctuation(this.peek())) {
      value += this.advance();
    }

    this.addToken(TokenType.WORD, value, startLine, startColumn);
  }

  private getKeywordType(word: string): TokenType {
    switch (word) {
      case 'graph':
        return TokenType.GRAPH;
      case 'flowchart':
        return TokenType.FLOWCHART;
      case 'subgraph':
        return TokenType.SUBGRAPH;
      case 'end':
        return TokenType.END;
      case 'style':
        return TokenType.STYLE;
      case 'class':
        return TokenType.CLASS;
      case 'classdef':
        return TokenType.CLASSDEF;
      case 'click':
        return TokenType.CLICK;
      case 'href':
        return TokenType.HREF;
      case 'call':
        return TokenType.CALL;
      case 'linkstyle':
        return TokenType.LINKSTYLE;
      case 'interpolate':
        return TokenType.INTERPOLATE;
      case 'default':
        return TokenType.DEFAULT;
      case 'td':
      case 'tb':
      case 'bt':
      case 'rl':
      case 'lr':
        return TokenType.DIRECTION;
      case '>':
      case '<':
      case '^':
      case 'v':
        // Only treat single character directions as DIRECTION in specific contexts
        return this.isDirectionContext() ? TokenType.DIRECTION : TokenType.WORD;
      default:
        return TokenType.WORD;
    }
  }

  private isDirectionContext(): boolean {
    // Check if we're in a context where single character directions should be recognized
    // Look at the last few tokens to determine context

    if (this.tokens.length === 0) return false;

    // Look for patterns like "graph TD" or "flowchart LR" or "direction v"
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i];

      // Skip spaces and newlines
      if (token.type === TokenType.SPACE || token.type === TokenType.NEWLINE) {
        continue;
      }

      // If we find "graph" or "flowchart", this is a direction context
      if (token.type === TokenType.GRAPH || token.type === TokenType.FLOWCHART) {
        return true;
      }

      // If we find "direction" keyword, this is a direction context
      if (token.type === TokenType.WORD && token.value.toLowerCase() === 'direction') {
        return true;
      }

      // If we encounter any other significant token, stop looking
      if (token.type !== TokenType.SEMICOLON) {
        break;
      }
    }

    return false;
  }

  private addToken(type: TokenType, value: string, line: number, column: number): void {
    this.tokens.push({ type, value, line, column });
  }

  private advance(): string {
    const char = this.input.charAt(this.position);
    this.position++;
    this.column++;
    return char;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input.charAt(this.position);
  }

  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input.charAt(this.position + 1);
  }

  private previousChar(): string {
    if (this.position <= 1) return '\0';
    return this.input.charAt(this.position - 2);
  }

  private current(): string {
    return this.input.charAt(this.position - 1);
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  /**
   * Check if we're in a node context (for distinguishing node shapes from function calls)
   * This is a simplified heuristic - in a full implementation, we'd track parser state
   */
  private isInNodeContext(): boolean {
    // Look back to see if we're likely in a node definition
    // This is a simple heuristic - could be improved with proper state tracking
    const recentTokens = this.tokens.slice(-3);
    return recentTokens.some(
      (token) =>
        token.type === TokenType.WORD ||
        token.type === TokenType.SQUARE_START ||
        token.type === TokenType.DIAMOND_START
    );
  }

  /**
   * Check if we're currently in a subgraph title context (for bracket disambiguation)
   */
  private isInSubgraphTitleContext(): boolean {
    // Look for 'subgraph' followed by a WORD token (the ID) in recent tokens
    let foundSubgraph = false;
    let foundWord = false;

    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i];
      if (token.type === TokenType.SPACE) {
        continue;
      }
      if (token.type === TokenType.NEWLINE || token.type === TokenType.SEMICOLON) {
        break; // End of current statement
      }
      if (token.type === TokenType.WORD && foundSubgraph) {
        foundWord = true;
        break;
      }
      if (token.type === TokenType.SUBGRAPH) {
        foundSubgraph = true;
      }
    }

    return foundSubgraph && foundWord;
  }

  /**
   * Check if the current '-' character is part of a punctuation sequence
   * This helps distinguish between edge patterns (like '-->' or '---') and punctuation text (like ',.?!+-*')
   */
  private isPartOfPunctuationSequence(): boolean {
    const prevChar = this.position > 0 ? this.input.charAt(this.position - 1) : '';
    const nextChar = this.peek();

    // If the previous character is punctuation (but not '-'), this is likely part of a punctuation sequence
    if (this.isPunctuation(prevChar) && prevChar !== '-') {
      return true;
    }

    // If the next character is punctuation (but not '-' or '>'), this is likely part of a punctuation sequence
    if (this.isPunctuation(nextChar) && nextChar !== '-' && nextChar !== '>') {
      return true;
    }

    return false;
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_\u00C0-\u017F\u0100-\u024F]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isPunctuation(char: string): boolean {
    // Include common punctuation that might appear in text content
    return /[,.?!+\-*<>]/.test(char);
  }

  private isStandaloneDirection(char: string): boolean {
    // Check if this character is a standalone direction symbol
    // It's standalone if it's followed by whitespace, semicolon, newline, or EOF
    const nextChar = this.peek();
    return (
      nextChar === ' ' ||
      nextChar === '\t' ||
      nextChar === '\n' ||
      nextChar === '\r' ||
      nextChar === ';' ||
      nextChar === '' ||
      this.position + 1 >= this.input.length
    );
  }

  private isHexDigit(char: string): boolean {
    return /[0-9a-fA-F]/.test(char);
  }
}

/**
 * Lark-inspired Parser
 */
export class LarkFlowParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private db: FlowDB;

  constructor(db: FlowDB) {
    this.db = db;
  }

  /**
   * Parse the input string
   */
  parse(input: string): void {
    // Validate input
    if (input === null || input === undefined) {
      throw new Error('Input cannot be null or undefined');
    }

    if (typeof input !== 'string') {
      throw new Error(`Invalid input type: expected string, got ${typeof input}`);
    }

    try {
      const lexer = new LarkFlowLexer(input);
      this.tokens = lexer.tokenize();

      this.current = 0;
      this.parseStart();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add more context for common errors
      if (errorMessage.includes('trim')) {
        throw new Error(
          `Parse error: Attempted to call trim() on undefined value. This may indicate a tokenization issue. Original error: ${errorMessage}`
        );
      }

      throw new Error(`Parse error: ${errorMessage}`);
    }
  }

  private parseStart(): void {
    // start: graph_config? document
    if (this.checkGraphConfig()) {
      this.parseGraphConfig();
    }
    this.parseDocument();
  }

  private checkGraphConfig(): boolean {
    return this.check(TokenType.GRAPH) || this.check(TokenType.FLOWCHART);
  }

  private parseGraphConfig(): void {
    // graph_config: GRAPH direction | FLOWCHART direction
    if (this.match(TokenType.GRAPH, TokenType.FLOWCHART)) {
      // Skip any spaces between GRAPH/FLOWCHART and DIRECTION
      while (this.check(TokenType.SPACE)) {
        this.advance();
      }

      if (this.match(TokenType.DIRECTION)) {
        const direction = this.previous().value;
        this.db.setDirection(direction);
      }
      // Consume optional semicolon
      if (this.check(TokenType.SEMICOLON)) {
        this.advance();
      }
    }
  }

  private parseDocument(): void {
    // document: line (NEWLINE|SEMICOLON line)*

    // Skip initial whitespace and newlines
    while (this.match(TokenType.NEWLINE, TokenType.SPACE)) {
      // Continue
    }

    // Parse lines until end of input
    while (!this.isAtEnd() && !this.check(TokenType.EOF)) {
      this.parseLine();

      // Skip separators and whitespace
      while (this.match(TokenType.NEWLINE, TokenType.SEMICOLON, TokenType.SPACE)) {
        // Continue
      }
    }
  }

  private parseLine(): void {
    // line: statement | SPACE | COMMENT

    if (this.check(TokenType.SPACE) || this.check(TokenType.COMMENT)) {
      this.advance();
      return;
    }

    this.parseStatement();
  }

  private parseStatement(): void {
    // statement: node_stmt | edge_stmt | subgraph_stmt | style_stmt | class_stmt | click_stmt | linkstyle_stmt

    if (this.check(TokenType.SUBGRAPH)) {
      this.parseSubgraphStmt();
    } else if (this.check(TokenType.STYLE)) {
      this.parseStyleStmt();
    } else if (this.check(TokenType.CLASS)) {
      this.parseClassStmt();
    } else if (this.check(TokenType.CLASSDEF)) {
      this.parseClassDefStmt();
    } else if (this.check(TokenType.CLICK)) {
      this.parseClickStmt();
    } else if (this.check(TokenType.LINKSTYLE)) {
      this.parseLinkStyleStmt();
    } else if (this.checkNodeOrEdge()) {
      this.parseNodeOrEdgeStmt();
    }

    // Don't consume semicolon here - let parseDocument handle it
  }

  private checkNodeOrEdge(): boolean {
    return this.check(TokenType.WORD);
  }

  private parseNodeOrEdgeStmt(): void {
    const nodeId = this.consume(TokenType.WORD, 'Expected node identifier').value;

    // Check if this is an edge statement
    if (this.checkEdge()) {
      this.parseEdgeStmt(nodeId);
    } else {
      this.parseNodeStmt(nodeId);
    }
  }

  private parseNodeStmt(nodeId: string): void {
    // node_stmt: node_id node_text? node_data?
    let text = nodeId;
    let type = 'default';
    let labelType = 'string';
    let nodeData: any = undefined;

    if (this.checkNodeText()) {
      const nodeText = this.parseNodeText();
      text = nodeText.text;
      type = nodeText.type;
      labelType = nodeText.labelType;
    }

    // Check for node data syntax (@{ ... })
    if (this.check(TokenType.NODE_DATA_START)) {
      const parsedNodeData = this.parseNodeData();

      // Apply node data properties to type and text
      if (parsedNodeData.shape) {
        type = parsedNodeData.shape;
      }
      if (parsedNodeData.label) {
        text = parsedNodeData.label;
        labelType = 'string'; // Override labelType for custom labels
      }

      // Convert node data object to YAML string for FlowDB
      nodeData = this.convertNodeDataToYaml(parsedNodeData);
    }

    // Check for inline class application (:::className)
    const classes: string[] = [];
    if (this.check(TokenType.TRIPLE_COLON)) {
      this.advance(); // consume :::
      const className = this.consume(TokenType.WORD, 'Expected class name after :::').value;
      classes.push(className);
    }

    this.db.addVertex(nodeId, { text, type: labelType }, type, [], classes, '', {}, nodeData);

    // Check if this node is followed by an edge (chained statement)
    if (this.checkEdge()) {
      this.parseEdgeStmt(nodeId);
    }
  }

  private checkNodeText(): boolean {
    return (
      this.check(TokenType.SQUARE_START) ||
      this.check(TokenType.ROUND_START) ||
      this.check(TokenType.ELLIPSE_START) ||
      this.check(TokenType.DIAMOND_START) ||
      this.check(TokenType.CIRCLE_START) ||
      this.check(TokenType.HEXAGON_START) ||
      this.check(TokenType.DOUBLECIRCLE_START) ||
      this.check(TokenType.CYLINDER_START) ||
      this.check(TokenType.STADIUM_START) ||
      this.check(TokenType.SUBROUTINE_START) ||
      this.check(TokenType.TRAPEZOID_START) ||
      this.check(TokenType.INV_TRAPEZOID_START) ||
      this.check(TokenType.ODD_START) ||
      this.check(TokenType.RECT_START)
    );
  }

  private parseNodeText(): { text: string; type: string; labelType: string } {
    if (this.match(TokenType.SQUARE_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.SQUARE_END, "Expected ']'");
      return { text: textContent.text, type: 'square', labelType: textContent.labelType };
    } else if (this.match(TokenType.ROUND_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.ROUND_END, "Expected ')'");
      return { text: textContent.text, type: 'round', labelType: textContent.labelType };
    } else if (this.match(TokenType.ELLIPSE_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.ELLIPSE_END, "Expected '-)'");
      return { text: textContent.text, type: 'ellipse', labelType: textContent.labelType };
    } else if (this.match(TokenType.DIAMOND_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.DIAMOND_END, "Expected '}'");
      return { text: textContent.text, type: 'diamond', labelType: textContent.labelType };
    } else if (this.match(TokenType.CIRCLE_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.CIRCLE_END, "Expected '))'");
      return { text: textContent.text, type: 'circle', labelType: textContent.labelType };
    } else if (this.match(TokenType.HEXAGON_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.HEXAGON_END, "Expected '}}'");
      return { text: textContent.text, type: 'hexagon', labelType: textContent.labelType };
    } else if (this.match(TokenType.DOUBLECIRCLE_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.DOUBLECIRCLE_END, "Expected ')))'");
      return { text: textContent.text, type: 'doublecircle', labelType: textContent.labelType };
    } else if (this.match(TokenType.CYLINDER_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.CYLINDER_END, "Expected ')]'");
      return { text: textContent.text, type: 'cylinder', labelType: textContent.labelType };
    } else if (this.match(TokenType.STADIUM_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.STADIUM_END, "Expected '])'");
      return { text: textContent.text, type: 'stadium', labelType: textContent.labelType };
    } else if (this.match(TokenType.SUBROUTINE_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.SUBROUTINE_END, "Expected ']]'");
      return { text: textContent.text, type: 'subroutine', labelType: textContent.labelType };
    } else if (this.match(TokenType.TRAPEZOID_START)) {
      const textContent = this.parseTextContent();
      // Check what kind of ending we have to determine the actual shape
      if (this.check(TokenType.LEAN_LEFT_END)) {
        this.advance(); // consume \]
        return { text: textContent.text, type: 'trapezoid', labelType: textContent.labelType };
      } else if (this.check(TokenType.LEAN_RIGHT_END)) {
        this.advance(); // consume /]
        return { text: textContent.text, type: 'lean_right', labelType: textContent.labelType };
      } else {
        throw new Error('Expected trapezoid or lean_right ending');
      }
    } else if (this.match(TokenType.INV_TRAPEZOID_START)) {
      const textContent = this.parseTextContent();
      // Check what kind of ending we have to determine the actual shape
      if (this.check(TokenType.LEAN_RIGHT_END)) {
        this.advance(); // consume /]
        return { text: textContent.text, type: 'inv_trapezoid', labelType: textContent.labelType };
      } else if (this.check(TokenType.LEAN_LEFT_END)) {
        this.advance(); // consume \]
        return { text: textContent.text, type: 'lean_left', labelType: textContent.labelType };
      } else {
        throw new Error('Expected inv_trapezoid or lean_left ending');
      }
    } else if (this.match(TokenType.ODD_START)) {
      const textContent = this.parseTextContent();
      this.consume(TokenType.SQUARE_END, "Expected ']'");
      return { text: textContent.text, type: 'odd', labelType: textContent.labelType };
    } else if (this.match(TokenType.RECT_START)) {
      // Parse rect syntax: [|field:value|text]
      // Skip the field:value part for now (we already consumed [|)
      while (!this.check(TokenType.PIPE) && !this.isAtEnd()) {
        this.advance();
      }
      this.consume(TokenType.PIPE, "Expected '|' after rect properties");
      const textContent = this.parseTextContent();
      this.consume(TokenType.SQUARE_END, "Expected ']'");
      return { text: textContent.text, type: 'rect', labelType: textContent.labelType };
    }

    return { text: '', type: 'default', labelType: 'string' };
  }

  private parseTextContent(): { text: string; labelType: string } {
    let text = '';
    let labelType = 'string'; // default to string

    while (!this.checkNodeTextEnd() && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const token = this.advance();
        text += token.value || '';
      } else if (this.check(TokenType.MARKDOWN_STRING)) {
        const token = this.advance();
        text += token.value || '';
        labelType = 'markdown'; // set to markdown if we find any markdown strings
      } else if (this.check(TokenType.WORD)) {
        const token = this.advance();
        text += token.value || '';
      } else if (this.check(TokenType.SPACE)) {
        // Preserve the original space token value to maintain spacing
        const token = this.advance();
        text += token.value || ' ';
      } else {
        const token = this.advance();
        text += token.value || '';
      }
    }

    return { text: text.trim(), labelType };
  }

  private checkNodeTextEnd(): boolean {
    return (
      this.check(TokenType.SQUARE_END) ||
      this.check(TokenType.ROUND_END) ||
      this.check(TokenType.ELLIPSE_END) ||
      this.check(TokenType.DIAMOND_END) ||
      this.check(TokenType.CIRCLE_END) ||
      this.check(TokenType.HEXAGON_END) ||
      this.check(TokenType.DOUBLECIRCLE_END) ||
      this.check(TokenType.CYLINDER_END) ||
      this.check(TokenType.STADIUM_END) ||
      this.check(TokenType.SUBROUTINE_END) ||
      this.check(TokenType.LEAN_RIGHT_END) ||
      this.check(TokenType.LEAN_LEFT_END)
    );
  }

  private parseNodeData(): any {
    // Parse node data syntax: @{ shape: rounded, label: "Custom Label" }
    this.consume(TokenType.NODE_DATA_START, "Expected '@{'");

    // Skip whitespace after NODE_DATA_START
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    const nodeData: any = {};

    if (this.check(TokenType.NODE_DATA_TEXT)) {
      const dataText = this.advance().value;

      // Parse the node data content
      try {
        // Simple parsing of key-value pairs
        const pairs = this.parseNodeDataContent(dataText);
        Object.assign(nodeData, pairs);
      } catch (error) {
        console.warn('Failed to parse node data:', dataText, error);
      }
    }

    // Skip whitespace before closing brace
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    this.consume(TokenType.NODE_DATA_END, "Expected '}'");

    return nodeData;
  }

  private parseNodeDataContent(content: string): any {
    const result: any = {};

    // Split by commas, but be careful about quoted strings
    const pairs = this.splitNodeDataPairs(content);

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        result[key] = value;
      }
    }

    return result;
  }

  private splitNodeDataPairs(content: string): string[] {
    const pairs: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (!inQuotes && char === ',') {
        if (current.trim()) {
          pairs.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      pairs.push(current.trim());
    }

    return pairs;
  }

  private convertNodeDataToYaml(nodeData: any): string {
    // Convert node data object to YAML string format expected by FlowDB
    const yamlPairs: string[] = [];

    for (const [key, value] of Object.entries(nodeData)) {
      if (typeof value === 'string') {
        yamlPairs.push(`${key}: "${value}"`);
      } else {
        yamlPairs.push(`${key}: ${value}`);
      }
    }

    return yamlPairs.join('\n');
  }

  private parseStyleProperties(): string[] {
    // Parse style properties using token-based approach with whitespace reconstruction
    const styles: string[] = [];
    let currentStyle = '';

    while (!this.checkStatementEnd() && !this.isAtEnd()) {
      const token = this.advance();

      if (token.type === TokenType.COMMA) {
        if (currentStyle.trim()) {
          styles.push(currentStyle.trim());
          currentStyle = '';
        }
      } else if (token.type === TokenType.SEMICOLON || token.type === TokenType.NEWLINE) {
        // End of statement
        break;
      } else {
        // Add token value with smart spacing
        if (currentStyle && this.needsSpaceBefore(token, currentStyle)) {
          currentStyle += ' ';
        }
        currentStyle += token.value;
      }
    }

    // Add the last style if any
    if (currentStyle.trim()) {
      styles.push(currentStyle.trim());
    }

    return styles;
  }

  private needsSpaceBefore(token: Token, currentStyle: string): boolean {
    // Add space before token if it would make sense
    const lastChar = currentStyle[currentStyle.length - 1];
    const firstChar = token.value[0];

    // Add space between alphanumeric characters, but be conservative
    if (this.isAlphaNumeric(lastChar) && this.isAlphaNumeric(firstChar)) {
      // Only add space for words that should be separated (like "solid red")
      if (token.value.match(/^(solid|dotted|dashed|red|blue|green|black|white)$/)) {
        return true;
      }
    }

    return false;
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }

  private checkEdge(): boolean {
    // Skip spaces and check for edge tokens
    let index = this.current;
    while (index < this.tokens.length && this.tokens[index].type === TokenType.SPACE) {
      index++;
    }

    if (index >= this.tokens.length) {
      return false;
    }

    const token = this.tokens[index];
    return (
      token.type === TokenType.ARROW ||
      token.type === TokenType.LINE ||
      token.type === TokenType.DOTTED_ARROW ||
      token.type === TokenType.DOTTED_LINE ||
      token.type === TokenType.THICK_ARROW ||
      token.type === TokenType.THICK_LINE ||
      token.type === TokenType.DOUBLE_ARROW ||
      token.type === TokenType.DOUBLE_THICK_ARROW ||
      token.type === TokenType.DOUBLE_DOTTED_ARROW ||
      token.type === TokenType.START_LINK
    );
  }

  private checkEdgeToken(): boolean {
    return (
      this.check(TokenType.ARROW) ||
      this.check(TokenType.LINE) ||
      this.check(TokenType.DOTTED_ARROW) ||
      this.check(TokenType.DOTTED_LINE) ||
      this.check(TokenType.THICK_ARROW) ||
      this.check(TokenType.THICK_LINE) ||
      this.check(TokenType.DOUBLE_ARROW) ||
      this.check(TokenType.DOUBLE_THICK_ARROW) ||
      this.check(TokenType.DOUBLE_DOTTED_ARROW) ||
      this.check(TokenType.START_LINK)
    );
  }

  /**
   * Check if an edge pattern is partial and can be completed with space-delimited text
   * Partial patterns are simple line patterns like '--' that can be followed by text and another edge token
   */
  private isPartialEdgePattern(pattern: string): boolean {
    // Only simple line patterns can have space-delimited text
    // These are patterns that don't already have an arrow head
    return pattern === '--' || pattern === '---' || pattern === '----';
  }

  private parseEdgeStmt(startNode: string): void {
    // Skip any spaces before the edge token
    while (this.check(TokenType.SPACE)) {
      this.advance();
    }

    // Check if this is a START_LINK pattern (complex edge with text)
    if (this.check(TokenType.START_LINK)) {
      this.parseComplexEdgeStmt(startNode);
    } else {
      // Handle edge patterns like: A --> B, A --x B, A ---|text| B
      const edgeToken = this.advance();
      let edgePattern = edgeToken.value; // Capture the actual edge pattern

      let edgeText = '';
      let endNode = '';
      let edgeTextLabelType = 'string'; // Default label type

      // CRITICAL FIX: Skip any spaces immediately after consuming the edge token
      // This handles cases like "A-->B" where there might be no space, or "A --> B" with spaces
      while (this.check(TokenType.SPACE)) {
        this.advance();
      }

      // Check for space-delimited text BEFORE skipping spaces: A -- text --x B
      // Only apply this for partial edge patterns that need completion
      if (this.check(TokenType.SPACE) && this.isPartialEdgePattern(edgePattern)) {
        // Skip spaces and check if there's a word after
        while (this.check(TokenType.SPACE)) {
          this.advance();
        }

        if (this.check(TokenType.WORD)) {
          // Collect words until we find another edge token
          const textTokens: string[] = [];
          while (this.check(TokenType.WORD) && !this.isAtEnd()) {
            textTokens.push(this.advance().value);

            // Skip spaces between words
            while (this.check(TokenType.SPACE)) {
              this.advance();
            }
          }

          // Now we should have another edge token
          if (this.checkEdge()) {
            const arrowToken = this.advance();

            // Combine the line pattern with arrow pattern for complete edge
            const completeEdgePattern = edgePattern + arrowToken.value;
            edgeText = textTokens.join(' ');

            // Get the end node
            if (this.check(TokenType.WORD)) {
              endNode = this.advance().value;
            } else {
              throw new Error('Expected target node identifier');
            }

            // Ensure start vertex exists
            this.ensureVertex(startNode);

            // Parse target node (may have text)
            const hasMoreEdges = this.parseTargetNode(endNode);

            // Create link object using the complete edge pattern
            const linkData = this.createLinkDataFromPattern(
              completeEdgePattern,
              edgeText,
              edgeTextLabelType
            );

            // Call addLink with arrays like JISON does
            this.db.addLink([startNode], [endNode], linkData);

            // Continue parsing chained edges iteratively
            if (hasMoreEdges) {
              this.parseEdgeStmt(endNode);
            }
            return;
          } else {
            // No second edge token found, treat the first word as the target node
            endNode = textTokens[0];
          }
        }
      }

      // Skip any spaces after the first edge token
      while (this.check(TokenType.SPACE)) {
        this.advance();
      }

      // Check for quoted text: A -- "text" --> B or A -- "`markdown`" --> B
      if (this.check(TokenType.STRING) || this.check(TokenType.MARKDOWN_STRING)) {
        const textToken = this.advance();
        edgeText = textToken.value; // Token value already has quotes removed

        // Set label type based on token type
        if (textToken.type === TokenType.MARKDOWN_STRING) {
          edgeTextLabelType = 'markdown';
        }

        // Skip any spaces after the text token
        while (this.check(TokenType.SPACE)) {
          this.advance();
        }

        // Consume the second part of the edge (e.g., -->)
        if (this.checkEdgeToken()) {
          const secondEdgeToken = this.advance();
          // Use the second edge token as the pattern (it determines the final edge type)
          edgePattern = secondEdgeToken.value;
        }

        // Skip any spaces after the second edge token
        while (this.check(TokenType.SPACE)) {
          this.advance();
        }

        // Get target node
        if (this.check(TokenType.WORD)) {
          endNode = this.advance().value;
        } else {
          throw new Error('Expected target node identifier after quoted edge text');
        }
      }
      // Check for pipe-delimited text: A ---|text| B
      else if (this.check(TokenType.PIPE)) {
        edgeTextLabelType = 'string';
        this.advance(); // consume first |

        // Collect text until second | with markdown support
        const textTokens: string[] = [];
        while (!this.check(TokenType.PIPE) && !this.isAtEnd()) {
          if (this.check(TokenType.WORD)) {
            textTokens.push(this.advance().value);
          } else if (this.check(TokenType.STRING)) {
            textTokens.push(this.advance().value);
          } else if (this.check(TokenType.MARKDOWN_STRING)) {
            textTokens.push(this.advance().value);
            edgeTextLabelType = 'markdown';
          } else if (this.check(TokenType.SPACE)) {
            // Preserve spaces in the text
            textTokens.push(' ');
            this.advance();
          } else {
            textTokens.push(this.advance().value);
          }
        }

        if (this.check(TokenType.PIPE)) {
          this.advance(); // consume second |
          edgeText = textTokens.join(''); // Preserve original spacing

          // Skip any spaces after the second |
          while (this.check(TokenType.SPACE)) {
            this.advance();
          }

          // Get target node
          if (this.check(TokenType.WORD)) {
            endNode = this.advance().value;
          } else {
            throw new Error('Expected target node identifier after edge text');
          }
        }
      }
      // Check for inline text: A -- "text" --> B
      else if (this.check(TokenType.STRING) || this.check(TokenType.MARKDOWN_STRING)) {
        if (this.check(TokenType.MARKDOWN_STRING)) {
          edgeText = this.advance().value;
          edgeTextLabelType = 'markdown';
        } else {
          edgeText = this.advance().value;
          edgeTextLabelType = 'string';
        }

        // Consume the arrow part (should be next token)
        if (this.checkEdge()) {
          const arrowToken = this.advance();
          // Combine the line pattern with arrow pattern for complete edge
          const completeEdgePattern = edgePattern + arrowToken.value;

          // Get the end node
          if (this.check(TokenType.WORD)) {
            endNode = this.advance().value;
          } else {
            throw new Error('Expected target node identifier after edge with text');
          }

          // Ensure start vertex exists
          this.ensureVertex(startNode);

          // Parse target node (may have text)
          const hasMoreEdges = this.parseTargetNode(endNode);

          // Create link object using the complete edge pattern
          const linkData = this.createLinkDataFromPattern(
            completeEdgePattern,
            edgeText,
            edgeTextLabelType
          );

          // Call addLink with arrays like JISON does
          this.db.addLink([startNode], [endNode], linkData);

          // Continue parsing chained edges iteratively
          if (hasMoreEdges) {
            this.parseEdgeStmt(endNode);
          }
          return;
        }
      }

      // Get target node (only if not already set by pipe-delimited text processing)
      if (!endNode) {
        // Skip any spaces before target node
        while (this.check(TokenType.SPACE)) {
          this.advance();
        }

        if (this.check(TokenType.WORD)) {
          endNode = this.advance().value;
        } else {
          throw new Error('Expected target node identifier');
        }
      }

      // Ensure start vertex exists
      this.ensureVertex(startNode);

      // Parse target node (may have text)
      const hasMoreEdges = this.parseTargetNode(endNode);

      // Create link object using the captured edge pattern
      const linkData = this.createLinkDataFromPattern(edgePattern, edgeText, edgeTextLabelType);

      // Call addLink with arrays like JISON does
      this.db.addLink([startNode], [endNode], linkData);

      // Continue parsing chained edges iteratively
      if (hasMoreEdges) {
        this.parseEdgeStmt(endNode);
      }
    }
  }

  private parseComplexEdgeStmt(startNode: string): void {
    // Complex edge: node_id START_LINK edge_text* LINK node_id
    const startLinkToken = this.consume(TokenType.START_LINK, 'Expected START_LINK');

    // Collect edge text tokens with markdown support
    const edgeTextInfo = this.parseEdgeText();

    // Skip whitespace before LINK token
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Consume the LINK token
    const linkToken = this.consume(TokenType.LINK, 'Expected LINK token');

    // Skip whitespace after LINK token
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Get the end node
    const endNode = this.consume(TokenType.WORD, 'Expected target node identifier').value || '';

    // Ensure start vertex exists
    this.ensureVertex(startNode);

    // Parse target node (may have text)
    const hasMoreEdges = this.parseTargetNode(endNode);

    // Create link data - combine START_LINK and LINK to determine type
    const linkData = this.createComplexLinkData(
      startLinkToken.value,
      linkToken.value,
      edgeTextInfo.text,
      edgeTextInfo.labelType
    );

    // Call addLink with arrays like JISON does
    this.db.addLink([startNode], [endNode], linkData);

    // Continue parsing chained edges iteratively
    if (hasMoreEdges) {
      this.parseEdgeStmt(endNode);
    }
  }

  private createLinkData(tokenType: TokenType, edgeText: string): any {
    // For edge tokens, we need to get the actual token value to use destructLink
    const currentToken = this.tokens[this.current - 1]; // Get the last consumed token
    const edgePattern = currentToken?.value || '';

    // Use FlowDB's destructLink method to parse the edge pattern
    const linkInfo = this.db.destructLink(edgePattern, '');

    const linkData: any = {
      type: linkInfo.type,
      stroke: linkInfo.stroke,
      length: linkInfo.length || 1,
    };

    if (edgeText) {
      linkData.text = {
        text: edgeText,
        type: 'text',
      };
    }

    return linkData;
  }

  private createLinkDataFromPattern(
    edgePattern: string,
    edgeText: string,
    labelType: string = 'string'
  ): any {
    // Use FlowDB's destructLink method to parse the edge pattern
    const linkInfo = this.db.destructLink(edgePattern, '');

    const linkData: any = {
      type: linkInfo.type,
      stroke: linkInfo.stroke,
      length: linkInfo.length || 1,
    };

    if (edgeText) {
      linkData.text = {
        text: edgeText,
        type: labelType,
      };
    }

    return linkData;
  }

  private parseEdgeText(): { text: string; labelType: string } {
    let text = '';
    let labelType = 'string';

    while (
      this.check(TokenType.EDGE_TEXT) ||
      this.check(TokenType.STRING) ||
      this.check(TokenType.MARKDOWN_STRING) ||
      this.check(TokenType.SPACE)
    ) {
      if (this.check(TokenType.EDGE_TEXT)) {
        const textToken = this.advance();
        text += textToken.value;
      } else if (this.check(TokenType.STRING)) {
        const textToken = this.advance();
        text += textToken.value;
      } else if (this.check(TokenType.MARKDOWN_STRING)) {
        const textToken = this.advance();
        text += textToken.value;
        labelType = 'markdown';
      } else if (this.check(TokenType.SPACE)) {
        const spaceToken = this.advance();
        text += spaceToken.value;
      }
    }

    return { text: text.trim(), labelType };
  }

  private parseTargetNode(nodeId: string): boolean {
    // Parse target node like a regular node statement, including any text and node data
    let text = nodeId;
    let type = 'default';
    let labelType = 'string';
    let nodeData: any = undefined;

    // Special case: Handle odd vertex syntax where nodeId is followed by -> and then text and ]
    // This handles cases like "odd->Vertex Text]" where "odd-" should be the node ID
    if (this.check(TokenType.ARROW) && this.peek().value === '->') {
      // Look ahead to see if this looks like an odd vertex pattern
      let lookAheadIndex = this.current + 1; // Skip the -> token
      let hasTextTokens = false;
      let hasSquareEnd = false;

      // Check if there are text tokens followed by SQUARE_END
      while (lookAheadIndex < this.tokens.length) {
        const token = this.tokens[lookAheadIndex];
        if (token.type === TokenType.WORD || token.type === TokenType.SPACE) {
          hasTextTokens = true;
          lookAheadIndex++;
        } else if (token.type === TokenType.SQUARE_END) {
          hasSquareEnd = true;
          break;
        } else {
          break;
        }
      }

      // If this looks like an odd vertex pattern, handle it specially
      if (hasTextTokens && hasSquareEnd) {
        // Consume the -> token (reinterpret as - + >)
        this.advance(); // consume ->

        // Modify the node ID to include the dash
        const actualNodeId = nodeId + '-';

        // Parse the odd vertex text
        const textTokens: string[] = [];
        while (this.check(TokenType.WORD) || this.check(TokenType.SPACE)) {
          if (this.check(TokenType.WORD)) {
            textTokens.push(this.advance().value);
          } else {
            textTokens.push(' ');
            this.advance();
          }
        }

        // Consume the closing ]
        this.consume(TokenType.SQUARE_END, "Expected ']' for odd vertex");

        // Set the vertex properties
        text = textTokens.join('').trim();
        type = 'odd';
        labelType = 'string';

        // Add the vertex with the corrected node ID
        this.db.addVertex(actualNodeId, { text, type: labelType }, type, [], [], '', {}, nodeData);

        // Return whether this target node is followed by another edge (chained statement)
        return this.checkEdge();
      }
    }

    if (this.checkNodeText()) {
      const nodeText = this.parseNodeText();
      text = nodeText.text;
      type = nodeText.type;
      labelType = nodeText.labelType;
    }

    // Check for node data syntax (@{ ... })
    if (this.check(TokenType.NODE_DATA_START)) {
      const parsedNodeData = this.parseNodeData();

      // Apply node data properties to type and text
      if (parsedNodeData.shape) {
        type = parsedNodeData.shape;
      }
      if (parsedNodeData.label) {
        text = parsedNodeData.label;
        labelType = 'string'; // Override labelType for custom labels
      }

      // Convert node data object to YAML string for FlowDB
      nodeData = this.convertNodeDataToYaml(parsedNodeData);
    }

    // Check for inline class application (:::className)
    const classes: string[] = [];
    if (this.check(TokenType.TRIPLE_COLON)) {
      this.advance(); // consume :::
      const className = this.consume(TokenType.WORD, 'Expected class name after :::').value;
      classes.push(className);
    }

    this.db.addVertex(nodeId, { text, type: labelType }, type, [], classes, '', {}, nodeData);

    // Return whether this target node is followed by another edge (chained statement)
    return this.checkEdge();
  }

  private createComplexLinkData(
    startLink: string,
    endLink: string,
    edgeText: string,
    labelType: string = 'string'
  ): any {
    // Determine the link type based on the START_LINK and LINK combination
    let tokenType: TokenType;

    if (startLink === '<--' && endLink === '-->') {
      tokenType = TokenType.DOUBLE_ARROW;
    } else if (startLink === '<==' && endLink === '==>') {
      tokenType = TokenType.DOUBLE_THICK_ARROW;
    } else if (startLink === '<-.' && endLink === '.->') {
      tokenType = TokenType.DOUBLE_DOTTED_ARROW;
    } else {
      // Default to double arrow
      tokenType = TokenType.DOUBLE_ARROW;
    }

    const linkInfo = this.getLinkInfo(tokenType);

    const linkData: any = {
      type: linkInfo.type,
      stroke: linkInfo.stroke,
      length: linkInfo.length,
    };

    if (edgeText && edgeText.trim()) {
      linkData.text = {
        text: edgeText.trim(),
        type: labelType,
      };
    }

    return linkData;
  }

  private getLinkInfo(tokenType: TokenType): { type: string; stroke: string; length: number } {
    switch (tokenType) {
      case TokenType.ARROW:
        return { type: 'arrow_point', stroke: 'normal', length: 1 };
      case TokenType.LINE:
        return { type: 'arrow_open', stroke: 'normal', length: 1 };
      case TokenType.DOTTED_ARROW:
        return { type: 'arrow_point', stroke: 'dotted', length: 1 };
      case TokenType.DOTTED_LINE:
        return { type: 'arrow_open', stroke: 'dotted', length: 1 };
      case TokenType.THICK_ARROW:
        return { type: 'arrow_point', stroke: 'thick', length: 1 };
      case TokenType.THICK_LINE:
        return { type: 'arrow_open', stroke: 'thick', length: 1 };
      case TokenType.DOUBLE_ARROW:
        return { type: 'double_arrow_point', stroke: 'normal', length: 1 };
      case TokenType.DOUBLE_THICK_ARROW:
        return { type: 'double_arrow_point', stroke: 'thick', length: 1 };
      case TokenType.DOUBLE_DOTTED_ARROW:
        return { type: 'double_arrow_point', stroke: 'dotted', length: 1 };
      case TokenType.CIRCLE_ARROW:
        return { type: 'arrow_circle', stroke: 'normal', length: 1 };
      case TokenType.CROSS_ARROW:
        return { type: 'arrow_cross', stroke: 'normal', length: 1 };
      default:
        return { type: 'arrow_point', stroke: 'normal', length: 1 };
    }
  }

  private ensureVertex(nodeId: string): void {
    // Check if vertex already exists
    const vertices = this.db.getVertices();
    if (vertices && vertices.get && !vertices.get(nodeId)) {
      // Create vertex with default properties
      this.db.addVertex(
        nodeId,
        { text: nodeId, type: 'text' },
        'default',
        [],
        [],
        '',
        {},
        undefined
      );
    }
  }

  private parseSubgraphStmt(): void {
    // subgraph_stmt: "subgraph" subgraph_id? NEWLINE subgraph_body "end"
    this.consume(TokenType.SUBGRAPH, "Expected 'subgraph'");

    // Skip whitespace after 'subgraph' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    let subgraphId = '';
    let subgraphTitle = '';
    let subgraphLabelType = 'text';

    // Parse subgraph identifier and title
    if (this.check(TokenType.WORD) || this.check(TokenType.NUMBER)) {
      // First, collect all tokens that could be part of the ID until we hit a bracket or newline
      let idParts = [];
      let hasBrackets = false;
      let bracketPosition = -1;

      // Look ahead to see if there are brackets and where they are
      let lookAheadPos = this.current;
      while (lookAheadPos < this.tokens.length) {
        const token = this.tokens[lookAheadPos];
        if (token.type === TokenType.SQUARE_START) {
          hasBrackets = true;
          bracketPosition = lookAheadPos;
          break;
        }
        if (token.type === TokenType.NEWLINE || token.type === TokenType.SEMICOLON) {
          break;
        }
        lookAheadPos++;
      }

      // Collect ID tokens up to the bracket (if any) or until newline/semicolon
      while (
        this.current < this.tokens.length &&
        (!hasBrackets || this.current < bracketPosition) &&
        !this.check(TokenType.NEWLINE) &&
        !this.check(TokenType.SEMICOLON)
      ) {
        if (this.check(TokenType.WORD) || this.check(TokenType.NUMBER)) {
          idParts.push(this.advance().value);
        } else if (this.check(TokenType.SPACE)) {
          idParts.push(' ');
          this.advance();
        } else if (this.current < this.tokens.length) {
          const token = this.peek();
          // Include common separators that could be part of an ID
          // Also check for edge tokens that might be dashes in subgraph context
          if (
            token.value === '-' ||
            token.value === '_' ||
            token.value === '.' ||
            token.type === TokenType.LINE || // Single dash becomes LINE token
            token.type === TokenType.ARROW ||
            token.type === TokenType.THICK_ARROW ||
            token.type === TokenType.DOTTED_ARROW
          ) {
            // Only include if it's a single dash (not part of an arrow)
            if (
              token.value === '-' ||
              token.value === '_' ||
              token.value === '.' ||
              token.type === TokenType.LINE
            ) {
              let tokenValue = this.advance().value;
              // Convert double dashes to single dashes in subgraph context
              if (token.type === TokenType.LINE && tokenValue.startsWith('--')) {
                tokenValue = '-';
              }
              idParts.push(tokenValue);
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }

      subgraphId = idParts.join('').trim();
      subgraphTitle = subgraphId;

      // Now check for bracket notation: id[title] or id["title"]
      if (this.check(TokenType.SQUARE_START)) {
        this.advance(); // consume '['

        if (this.check(TokenType.STRING)) {
          subgraphTitle = this.advance().value;
        } else if (this.check(TokenType.MARKDOWN_STRING)) {
          subgraphTitle = this.advance().value;
          subgraphLabelType = 'markdown';
        } else {
          // Handle unquoted text in brackets - collect all tokens until ]
          let titleParts = [];
          while (!this.check(TokenType.SQUARE_END) && !this.isAtEnd()) {
            if (this.check(TokenType.WORD)) {
              titleParts.push(this.advance().value);
            } else if (this.check(TokenType.SPACE)) {
              titleParts.push(' ');
              this.advance();
            } else {
              // Skip other tokens but include their values
              titleParts.push(this.advance().value);
            }
          }
          subgraphTitle = titleParts.join('').trim();
        }

        this.consume(TokenType.SQUARE_END, "Expected ']'");
      }

      // Handle special case: if ID and title are the same and contain spaces/dashes, clear ID for auto-generation
      if (subgraphId === subgraphTitle && /[\s\-]/.test(subgraphTitle)) {
        subgraphId = '';
      }
    } else if (this.check(TokenType.STRING)) {
      // Quoted title without ID - generate automatic ID
      subgraphTitle = this.advance().value;
      subgraphId = ''; // Will be auto-generated in addSubGraph as 'subGraph0', 'subGraph1', etc.
    } else if (this.check(TokenType.MARKDOWN_STRING)) {
      // Markdown title without ID - generate automatic ID
      subgraphTitle = this.advance().value;
      subgraphId = ''; // Will be auto-generated in addSubGraph as 'subGraph0', 'subGraph1', etc.
      subgraphLabelType = 'markdown';
    }

    // Skip optional newlines after subgraph declaration
    while (this.match(TokenType.NEWLINE)) {
      // Continue
    }

    // Parse subgraph body - collect all statements inside the subgraph
    const subgraphStatements: any[] = [];

    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      if (this.check(TokenType.WORD) && this.peek().value === 'direction') {
        // Handle direction statement inside subgraph
        const direction = this.parseDirectionStmtForSubgraph();
        subgraphStatements.push({ stmt: 'dir', value: direction });
      } else if (this.checkEdgeStatement()) {
        // Parse edge statements, create the actual edge, and collect node IDs
        const nodeIds = this.parseEdgeStatementInSubgraph();
        subgraphStatements.push(...nodeIds);
      } else if (this.checkNodeStatement()) {
        // Parse node statements and collect node IDs
        const nodeIds = this.parseNodeStatement();
        subgraphStatements.push(...nodeIds);
      } else if (this.match(TokenType.NEWLINE, TokenType.SEMICOLON)) {
        // Skip separators
        continue;
      } else {
        // Skip unknown tokens
        this.advance();
      }
    }

    // Add the subgraph with collected statements
    // Follow JISON parser behavior: if id and title are the same and title has spaces, set id to undefined
    let finalId = subgraphId;
    if (subgraphId === subgraphTitle && /\s/.test(subgraphTitle)) {
      finalId = '';
    }

    // For quoted titles without explicit ID, ensure ID is empty so it gets auto-generated
    if (!subgraphId && subgraphTitle) {
      finalId = '';
    }

    // Pass empty string as text, which will be converted to undefined in addSubGraph for auto-generation
    this.db.addSubGraph({ text: finalId }, subgraphStatements, {
      text: subgraphTitle || subgraphId || '',
      type: subgraphLabelType,
    });

    this.consume(TokenType.END, "Expected 'end'");
  }

  private parseStyleStmt(): void {
    // style_stmt: "style" node_id style_props
    this.consume(TokenType.STYLE, "Expected 'style'");

    // Skip whitespace after 'style' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    const nodeId = this.consume(TokenType.WORD, 'Expected node identifier').value;

    // Parse style properties by collecting raw text
    const styles = this.parseStyleProperties();

    // Apply styles to the node
    if (styles.length > 0) {
      this.db.addVertex(
        nodeId,
        { text: nodeId, type: 'string' },
        'default',
        styles,
        [],
        '',
        {},
        undefined
      );
    }
  }

  private parseClassStmt(): void {
    // class_stmt: "class" node_list class_name
    this.consume(TokenType.CLASS, "Expected 'class'");

    // Skip whitespace after 'class' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Parse node list (comma-separated)
    const nodeIds: string[] = [];

    // Parse first node
    nodeIds.push(this.consume(TokenType.WORD, 'Expected node identifier').value);

    // Parse additional nodes if comma-separated
    while (this.check(TokenType.COMMA)) {
      this.advance(); // consume comma
      nodeIds.push(this.consume(TokenType.WORD, 'Expected node identifier').value);
    }

    // Skip whitespace before class name
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Parse class name
    const className = this.consume(TokenType.WORD, 'Expected class name').value;

    // Apply class to all nodes
    nodeIds.forEach((nodeId) => {
      this.db.setClass(nodeId, className);
    });
  }

  private parseClassDefStmt(): void {
    // classdef_stmt: "classDef" class_name_list style_props
    this.consume(TokenType.CLASSDEF, "Expected 'classDef'");

    // Skip whitespace after 'classDef' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Parse class name list (comma-separated)
    const classNames: string[] = [];

    // Parse first class name
    classNames.push(this.consume(TokenType.WORD, 'Expected class name').value);

    // Parse additional class names if comma-separated
    while (this.check(TokenType.COMMA)) {
      this.advance(); // consume comma
      classNames.push(this.consume(TokenType.WORD, 'Expected class name').value);
    }

    // Parse style properties by collecting raw text
    const styles = this.parseStyleProperties();

    // Apply class definition to all class names
    classNames.forEach((className) => {
      this.db.addClass(className, styles);
    });
  }

  private parseClickStmt(): void {
    // click_stmt: "click" node_id click_action
    this.consume(TokenType.CLICK, "Expected 'click'");

    // Skip whitespace after 'click' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Parse node ID
    const nodeId = this.parseNodeId();

    // Parse click action based on what follows
    this.parseClickAction(nodeId);
  }

  private parseLinkStyleStmt(): void {
    // linkstyle_stmt: "linkStyle" (DEFAULT | numList) ("interpolate" alphaNum)? stylesOpt?
    this.consume(TokenType.LINKSTYLE, "Expected 'linkStyle'");

    // Skip whitespace after 'linkStyle' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Parse target (default or number list)
    const targets: (string | number)[] = [];

    if (this.check(TokenType.DEFAULT)) {
      this.consume(TokenType.DEFAULT, "Expected 'default'");
      targets.push('default');
    } else if (this.check(TokenType.NUMBER)) {
      // Parse number list (e.g., "0", "1", "0,1")
      targets.push(parseInt(this.consume(TokenType.NUMBER, 'Expected number').value));

      // Handle comma-separated numbers
      while (this.check(TokenType.COMMA)) {
        this.consume(TokenType.COMMA, "Expected ','");
        targets.push(parseInt(this.consume(TokenType.NUMBER, 'Expected number').value));
      }
    } else {
      throw new Error("Expected 'default' or number after 'linkStyle'");
    }

    // Skip whitespace before checking for interpolate keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Check for interpolate keyword
    if (this.check(TokenType.INTERPOLATE)) {
      this.consume(TokenType.INTERPOLATE, "Expected 'interpolate'");

      // Skip whitespace after 'interpolate' keyword
      while (this.match(TokenType.SPACE)) {
        // Continue
      }

      const interpolateValue = this.consume(TokenType.WORD, 'Expected interpolation type').value;

      // Call updateLinkInterpolate on the database
      this.db.updateLinkInterpolate(targets, interpolateValue);
    }

    // Skip any remaining style properties for now
    while (!this.checkStatementEnd() && !this.isAtEnd()) {
      this.advance();
    }
  }

  private parseNodeId(): string {
    // Parse a simple node identifier
    if (this.check(TokenType.WORD)) {
      return this.consume(TokenType.WORD, 'Expected node ID').value;
    } else if (this.check(TokenType.STRING)) {
      // Handle quoted node IDs
      return this.parseString();
    } else {
      throw new Error(`Expected node ID, got ${this.peek().type}`);
    }
  }

  private parseString(): string {
    // Parse a string token and return its value (quotes already removed by lexer)
    return this.consume(TokenType.STRING, 'Expected string').value;
  }

  private parseClickAction(nodeId: string): void {
    // Skip whitespace before click action
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    // Check what type of click action this is
    if (this.check(TokenType.HREF)) {
      this.parseClickHref(nodeId);
    } else if (this.check(TokenType.CALL)) {
      this.parseClickCall(nodeId);
    } else if (this.check(TokenType.STRING)) {
      this.parseClickLink(nodeId);
    } else if (this.check(TokenType.WORD)) {
      this.parseClickCallback(nodeId);
    }
  }

  private parseClickCallback(nodeId: string): void {
    // click A callback
    // click A callback "tooltip"
    const callbackName = this.consume(TokenType.WORD, 'Expected callback name').value;

    // Check for optional tooltip
    let tooltip: string | undefined;
    if (this.check(TokenType.STRING)) {
      tooltip = this.parseString();
    }

    // Call setClickEvent
    this.db.setClickEvent(nodeId, callbackName);

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }
  }

  private parseClickCall(nodeId: string): void {
    // click A call callback()
    // click A call callback(args)
    this.consume(TokenType.CALL, "Expected 'call'");

    // Skip whitespace after 'call' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    const callbackName = this.consume(TokenType.WORD, 'Expected callback name').value;

    // Parse optional arguments
    let args: string | undefined;
    if (this.check(TokenType.LPAREN)) {
      this.consume(TokenType.LPAREN, "Expected '('");
      if (!this.check(TokenType.RPAREN)) {
        args = this.consume(TokenType.WORD, 'Expected callback arguments').value;
      }
      this.consume(TokenType.RPAREN, "Expected ')'");
    }

    // Call setClickEvent
    if (args) {
      this.db.setClickEvent(nodeId, callbackName, args);
    } else {
      this.db.setClickEvent(nodeId, callbackName);
    }
  }

  private parseClickHref(nodeId: string): void {
    // click A href "link.html"
    // click A href "link.html" "tooltip"
    // click A href "link.html" _blank
    // click A href "link.html" "tooltip" _blank
    this.consume(TokenType.HREF, "Expected 'href'");
    const link = this.parseString();

    let tooltip: string | undefined;
    let target: string | undefined;

    // Parse optional tooltip and/or target
    if (this.check(TokenType.STRING)) {
      tooltip = this.parseString();
      if (this.checkLinkTarget()) {
        target = this.parseLinkTarget();
      }
    } else if (this.checkLinkTarget()) {
      target = this.parseLinkTarget();
    }

    // Call setLink
    if (target) {
      this.db.setLink(nodeId, link, target);
    } else {
      this.db.setLink(nodeId, link);
    }

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }
  }

  private parseClickLink(nodeId: string): void {
    // click A "link.html"
    // click A "link.html" "tooltip"
    // click A "link.html" _blank
    // click A "link.html" "tooltip" _blank
    const link = this.parseString();

    let tooltip: string | undefined;
    let target: string | undefined;

    // Parse optional tooltip and/or target
    if (this.check(TokenType.STRING)) {
      tooltip = this.parseString();
      if (this.checkLinkTarget()) {
        target = this.parseLinkTarget();
      }
    } else if (this.checkLinkTarget()) {
      target = this.parseLinkTarget();
    }

    // Call setLink
    if (target) {
      this.db.setLink(nodeId, link, target);
    } else {
      this.db.setLink(nodeId, link);
    }

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }
  }

  private checkLinkTarget(): boolean {
    return (
      this.check(TokenType.WORD) &&
      ['_self', '_blank', '_parent', '_top'].includes(this.peek().value)
    );
  }

  private parseLinkTarget(): string {
    const target = this.consume(TokenType.WORD, 'Expected link target').value;
    if (!['_self', '_blank', '_parent', '_top'].includes(target)) {
      throw new Error(`Invalid link target: ${target}`);
    }
    return target;
  }

  private checkStatementEnd(): boolean {
    return (
      this.check(TokenType.NEWLINE) || this.check(TokenType.SEMICOLON) || this.check(TokenType.EOF)
    );
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    throw new Error(
      `${message} at line ${current.line}, column ${current.column}. Got ${current.type}`
    );
  }

  private parseDirectionStmt(): void {
    // direction_stmt: "direction" direction_value
    this.consume(TokenType.WORD, "Expected 'direction'");

    // Skip whitespace after 'direction' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    const direction = this.consume(TokenType.DIRECTION, 'Expected direction value').value;
    this.db.setDirection(direction);
  }

  private parseDirectionStmtForSubgraph(): string {
    // direction_stmt: "direction" direction_value (for subgraph context)
    this.consume(TokenType.WORD, "Expected 'direction'");

    // Skip whitespace after 'direction' keyword
    while (this.match(TokenType.SPACE)) {
      // Continue
    }

    const direction = this.consume(TokenType.DIRECTION, 'Expected direction value').value;
    return direction;
  }

  private checkNodeStatement(): boolean {
    // Check if current position looks like a node statement
    return this.check(TokenType.WORD) && !this.check(TokenType.DIRECTION);
  }

  private checkEdgeStatement(): boolean {
    // Check if current position looks like an edge statement
    // Look ahead to see if there's an edge operator after the current word
    if (!this.check(TokenType.WORD)) {
      return false;
    }

    // Look ahead for edge operators
    let lookAheadIndex = this.current + 1;
    while (lookAheadIndex < this.tokens.length) {
      const token = this.tokens[lookAheadIndex];

      // If we find an edge operator, this is an edge statement
      if (
        token.type === TokenType.ARROW ||
        token.type === TokenType.THICK_ARROW ||
        token.type === TokenType.DOTTED_ARROW ||
        token.value === '-->' ||
        token.value === '==>' ||
        token.value === '-.->' ||
        token.value === '<--' ||
        token.value === '<==' ||
        token.value === '<-.-'
      ) {
        return true;
      }

      // If we hit a statement end or other structural token, stop looking
      if (
        token.type === TokenType.NEWLINE ||
        token.type === TokenType.SEMICOLON ||
        token.type === TokenType.END ||
        token.value === 'direction'
      ) {
        break;
      }

      lookAheadIndex++;
    }

    return false;
  }

  private parseNodeStatement(): string[] {
    // Parse a simple node statement and return node IDs
    const nodeIds: string[] = [];

    if (this.check(TokenType.WORD)) {
      nodeIds.push(this.advance().value);
    }

    return nodeIds;
  }

  private parseEdgeStatement(): string[] {
    // Parse an edge statement and return all node IDs involved
    // Must match JISON parser behavior: for "a --> b", return ["b", "a"]
    const nodeIds: string[] = [];
    let sourceNode = '';
    let targetNode = '';

    // Parse source node
    if (this.check(TokenType.WORD)) {
      sourceNode = this.advance().value;
    }

    // Skip edge tokens and parse target node
    while (!this.checkStatementEnd() && !this.isAtEnd() && !this.check(TokenType.END)) {
      if (this.check(TokenType.WORD)) {
        const token = this.advance();
        // Only add if it's likely a node ID (not an edge operator)
        if (!['-->', '<--', '---', '-.', '==', '==>'].includes(token.value)) {
          targetNode = token.value;
          break; // Found target node, stop parsing
        }
      } else {
        this.advance();
      }
    }

    // CRITICAL: Add nodes in JISON parser order: target first, then source
    // This matches the JISON grammar: $node.concat($vertexStatement.nodes)
    // where $node is the target and $vertexStatement.nodes contains the source
    if (targetNode) {
      nodeIds.push(targetNode);
    }
    if (sourceNode) {
      nodeIds.push(sourceNode);
    }

    return nodeIds;
  }

  private parseEdgeStatementInSubgraph(): string[] {
    // Parse an edge statement within a subgraph context
    // This method both creates the edge AND returns node IDs for subgraph membership
    const nodeIds: string[] = [];
    const allNodes: string[] = [];
    let currentNode = '';
    let edgeType = '';

    // Parse the entire edge chain (e.g., a1-->a2-->a3)
    while (!this.checkStatementEnd() && !this.isAtEnd() && !this.check(TokenType.END)) {
      if (this.check(TokenType.WORD)) {
        const token = this.advance();
        currentNode = token.value || '';
        allNodes.push(currentNode);
      } else if (this.check(TokenType.ARROW, TokenType.THICK_ARROW, TokenType.DOTTED_ARROW)) {
        const token = this.advance();
        edgeType = token.value || '';
      } else {
        this.advance();
      }
    }

    // Create edges between consecutive nodes
    for (let i = 0; i < allNodes.length - 1; i++) {
      const sourceNode = allNodes[i];
      const targetNode = allNodes[i + 1];

      // Ensure vertices exist
      this.ensureVertex(sourceNode);
      this.ensureVertex(targetNode);

      // Create link data based on edge type
      const linkData = this.createSimpleLinkData(edgeType, '');

      // Call addLink to create the edge
      this.db.addLink([sourceNode], [targetNode], linkData);
    }

    // Return nodes in JISON parser order: reverse order (rightmost first)
    // For a1-->a2-->a3, JISON returns ['a3', 'a2', 'a1']
    return allNodes.reverse();
  }

  private createSimpleLinkData(edgeType: string, edgeText: string): any {
    // Create link data for simple edge types using the same structure as createLinkData
    let linkData: any;

    switch (edgeType) {
      case '-->':
        linkData = { type: 'arrow_point', stroke: 'normal', length: 1 };
        break;
      case '==>':
        linkData = { type: 'arrow_point', stroke: 'thick', length: 1 };
        break;
      case '-.->':
        linkData = { type: 'arrow_point', stroke: 'dotted', length: 1 };
        break;
      default:
        linkData = { type: 'arrow_point', stroke: 'normal', length: 1 };
        break;
    }

    // Add text in the same format as createLinkData
    if (edgeText) {
      linkData.text = {
        text: edgeText,
        type: 'text',
      };
    }

    return linkData;
  }
}
