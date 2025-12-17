import type { ASTNode, RailroadRule } from '../railroadTypes.js';
import { db } from '../railroadDb.js';
import { log } from '../../../logger.js';

/**
 * Token types for Railroad diagram lexer
 */
const TokenType = {
  RAILROAD_DIAGRAM: 'RAILROAD_DIAGRAM',
  TITLE: 'TITLE',
  IDENTIFIER: 'IDENTIFIER',
  DOUBLE_STRING: 'DOUBLE_STRING',
  SINGLE_STRING: 'SINGLE_STRING',
  EQUALS: 'EQUALS',
  BNF_DEFINE: 'BNF_DEFINE',
  SEMICOLON: 'SEMICOLON',
  PIPE: 'PIPE',
  QUESTION: 'QUESTION',
  STAR: 'STAR',
  PLUS: 'PLUS',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  COMMA: 'COMMA',
  MINUS: 'MINUS',
  SPECIAL: 'SPECIAL',
  COMMENT: 'COMMENT',
  ISO_COMMENT: 'ISO_COMMENT',
  EOF: 'EOF',
} as const;

type TokenType = (typeof TokenType)[keyof typeof TokenType];

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Simple lexer for Railroad diagram syntax
 */
class RailroadLexer {
  private input: string;
  private position = 0;
  private line = 1;
  private column = 1;

  constructor(input: string) {
    this.input = input;
  }

  private peek(offset = 0): string {
    return this.input[this.position + offset] || '';
  }

  private advance(): string {
    const char = this.input[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.advance();
    }
  }

  private skipComment(): void {
    // C-style comment /* ... */
    if (this.peek() === '/' && this.peek(1) === '*') {
      this.advance(); // /
      this.advance(); // *
      while (this.position < this.input.length) {
        if (this.peek() === '*' && this.peek(1) === '/') {
          this.advance(); // *
          this.advance(); // /
          break;
        }
        this.advance();
      }
    }
    // ISO comment (* ... *)
    else if (this.peek() === '(' && this.peek(1) === '*') {
      this.advance(); // (
      this.advance(); // *
      while (this.position < this.input.length) {
        if (this.peek() === '*' && this.peek(1) === ')') {
          this.advance(); // *
          this.advance(); // )
          break;
        }
        this.advance();
      }
    }
  }

  private readString(quote: string): Token {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // skip opening quote

    let value = '';
    while (this.peek() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        // Handle escape sequences
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          default:
            value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.peek() !== quote) {
      throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
    }

    this.advance(); // skip closing quote

    return {
      type: quote === '"' ? TokenType.DOUBLE_STRING : TokenType.SINGLE_STRING,
      value,
      line: startLine,
      column: startColumn,
    };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (/[\w-]/.test(this.peek())) {
      value += this.advance();
    }

    // Check for keywords
    let type: TokenType = TokenType.IDENTIFIER;
    if (value === 'railroad-diagram' || value === 'railroad') {
      type = TokenType.RAILROAD_DIAGRAM;
    } else if (value === 'title') {
      type = TokenType.TITLE;
    }

    return {
      type,
      value,
      line: startLine,
      column: startColumn,
    };
  }

  private readSpecial(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // skip opening ?

    let value = '';
    while (this.peek() && this.peek() !== '?') {
      value += this.advance();
    }

    if (this.peek() !== '?') {
      throw new Error(`Unterminated special sequence at line ${startLine}, column ${startColumn}`);
    }

    this.advance(); // skip closing ?

    return {
      type: TokenType.SPECIAL,
      value,
      line: startLine,
      column: startColumn,
    };
  }

  nextToken(): Token {
    this.skipWhitespace();

    // Skip comments
    while (
      (this.peek() === '/' && this.peek(1) === '*') ||
      (this.peek() === '(' && this.peek(1) === '*')
    ) {
      this.skipComment();
      this.skipWhitespace();
    }

    const line = this.line;
    const column = this.column;

    if (this.position >= this.input.length) {
      return { type: TokenType.EOF, value: '', line, column };
    }

    const char = this.peek();

    // Strings
    if (char === '"') {
      return this.readString('"');
    }
    if (char === "'") {
      return this.readString("'");
    }

    // Special sequence (? text ?)
    // Only treat as special if followed by non-whitespace and not immediately followed by operators/delimiters
    if (char === '?' && this.peek(1) && /[^\s);\]|}]/.test(this.peek(1)) && this.peek(1) !== '?') {
      // Look ahead to see if there's a closing ?
      let pos = 1;
      while (this.peek(pos) && this.peek(pos) !== '?') {
        pos++;
      }
      // If we found a closing ?, treat as special sequence
      if (this.peek(pos) === '?') {
        return this.readSpecial();
      }
    }

    // Multi-character operators
    if (char === ':' && this.peek(1) === ':' && this.peek(2) === '=') {
      this.advance();
      this.advance();
      this.advance();
      return { type: TokenType.BNF_DEFINE, value: '::=', line, column };
    }

    // Single character tokens
    switch (char) {
      case '=':
        this.advance();
        return { type: TokenType.EQUALS, value: '=', line, column };
      case ';':
        this.advance();
        return { type: TokenType.SEMICOLON, value: ';', line, column };
      case '|':
        this.advance();
        return { type: TokenType.PIPE, value: '|', line, column };
      case '?':
        this.advance();
        return { type: TokenType.QUESTION, value: '?', line, column };
      case '*':
        this.advance();
        return { type: TokenType.STAR, value: '*', line, column };
      case '+':
        this.advance();
        return { type: TokenType.PLUS, value: '+', line, column };
      case '(':
        this.advance();
        return { type: TokenType.LPAREN, value: '(', line, column };
      case ')':
        this.advance();
        return { type: TokenType.RPAREN, value: ')', line, column };
      case '[':
        this.advance();
        return { type: TokenType.LBRACKET, value: '[', line, column };
      case ']':
        this.advance();
        return { type: TokenType.RBRACKET, value: ']', line, column };
      case '{':
        this.advance();
        return { type: TokenType.LBRACE, value: '{', line, column };
      case '}':
        this.advance();
        return { type: TokenType.RBRACE, value: '}', line, column };
      case ',':
        this.advance();
        return { type: TokenType.COMMA, value: ',', line, column };
      case '-':
        this.advance();
        return { type: TokenType.MINUS, value: '-', line, column };
    }

    // Identifiers
    if (/[A-Z_a-z]/.test(char)) {
      return this.readIdentifier();
    }

    throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token: Token;

    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== TokenType.EOF);

    return tokens;
  }
}

/**
 * Simple parser for Railroad diagram syntax
 */
class RailroadParser {
  private tokens: Token[];
  private position = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    return this.tokens[this.position + offset] || this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    return this.tokens[this.position++];
  }

  private expect(type: TokenType): Token {
    const token = this.advance();
    if (token.type !== type) {
      throw new Error(
        `Expected ${type} but got ${token.type} at line ${token.line}, column ${token.column}`
      );
    }
    return token;
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.peek().type);
  }

  /**
   * Parse the entire Railroad diagram
   */
  parse(): void {
    db.clear();

    // Expect 'railroad-diagram' keyword
    this.expect(TokenType.RAILROAD_DIAGRAM);

    // Optional title
    if (this.match(TokenType.TITLE)) {
      this.advance(); // consume 'title'
      const titleToken = this.advance();
      if (
        titleToken.type === TokenType.DOUBLE_STRING ||
        titleToken.type === TokenType.SINGLE_STRING ||
        titleToken.type === TokenType.IDENTIFIER
      ) {
        db.setTitle(titleToken.value);
      }
    }

    // Parse rules
    while (!this.match(TokenType.EOF)) {
      this.parseRule();
    }
  }

  /**
   * Parse a single rule
   */
  private parseRule(): void {
    const nameToken = this.expect(TokenType.IDENTIFIER);
    const ruleName = nameToken.value;

    // = or ::=
    if (!this.match(TokenType.EQUALS, TokenType.BNF_DEFINE)) {
      throw new Error(
        `Expected '=' or '::=' after rule name at line ${this.peek().line}, column ${
          this.peek().column
        }`
      );
    }
    this.advance();

    // Parse expression
    const definition = this.parseExpression();

    // Semicolon
    this.expect(TokenType.SEMICOLON);

    // Create and add rule
    const rule: RailroadRule = {
      name: ruleName,
      definition,
    };

    db.addRule(rule);
    log.debug('[Railroad Parser] Parsed rule:', ruleName);
  }

  /**
   * Parse expression (handles alternation)
   */
  private parseExpression(): ASTNode {
    return this.parseAlternation();
  }

  /**
   * Parse alternation (choice with |)
   */
  private parseAlternation(): ASTNode {
    const alternatives: ASTNode[] = [this.parseConcatenation()];

    while (this.match(TokenType.PIPE)) {
      this.advance(); // consume |
      alternatives.push(this.parseConcatenation());
    }

    if (alternatives.length === 1) {
      return alternatives[0];
    }

    return {
      type: 'choice',
      alternatives,
    };
  }

  /**
   * Parse concatenation (sequence)
   */
  private parseConcatenation(): ASTNode {
    const elements: ASTNode[] = [];

    while (!this.match(TokenType.PIPE, TokenType.SEMICOLON, TokenType.RPAREN, TokenType.RBRACKET, TokenType.RBRACE, TokenType.EOF)) {
      // Skip optional commas (ISO style)
      if (this.match(TokenType.COMMA)) {
        this.advance();
        continue;
      }

      elements.push(this.parseTerm());
    }

    if (elements.length === 0) {
      throw new Error(`Empty expression at line ${this.peek().line}`);
    }

    if (elements.length === 1) {
      return elements[0];
    }

    return {
      type: 'sequence',
      elements,
    };
  }

  /**
   * Parse term (handles postfix operators)
   */
  private parseTerm(): ASTNode {
    let node = this.parseFactor();

    // Postfix operators
    while (this.match(TokenType.QUESTION, TokenType.STAR, TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.advance();

      switch (operator.type) {
        case TokenType.QUESTION:
          node = {
            type: 'optional',
            element: node,
          };
          break;
        case TokenType.STAR:
          node = {
            type: 'repetition',
            element: node,
            min: 0,
            max: Infinity,
          };
          break;
        case TokenType.PLUS:
          node = {
            type: 'repetition',
            element: node,
            min: 1,
            max: Infinity,
          };
          break;
        case TokenType.MINUS: {
          // Exception: A - B
          const except = this.parseFactor();
          node = {
            type: 'exception',
            base: node,
            except,
          };
          break;
        }
      }
    }

    return node;
  }

  /**
   * Parse factor (basic elements)
   */
  private parseFactor(): ASTNode {
    const token = this.peek();

    // Terminal strings
    if (this.match(TokenType.DOUBLE_STRING, TokenType.SINGLE_STRING)) {
      this.advance();
      return {
        type: 'terminal',
        value: token.value,
      };
    }

    // Non-terminal identifiers
    if (this.match(TokenType.IDENTIFIER)) {
      this.advance();
      return {
        type: 'nonterminal',
        name: token.value,
      };
    }

    // Special sequences
    if (this.match(TokenType.SPECIAL)) {
      this.advance();
      return {
        type: 'special',
        text: token.value,
      };
    }

    // Grouping with parentheses
    if (this.match(TokenType.LPAREN)) {
      this.advance(); // (
      const element = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return {
        type: 'group',
        element,
      };
    }

    // Optional with brackets (ISO style)
    if (this.match(TokenType.LBRACKET)) {
      this.advance(); // [
      const element = this.parseExpression();
      this.expect(TokenType.RBRACKET);
      return {
        type: 'optional',
        element,
      };
    }

    // Repetition with braces (ISO style)
    if (this.match(TokenType.LBRACE)) {
      this.advance(); // {
      const element = this.parseExpression();
      this.expect(TokenType.RBRACE);
      return {
        type: 'repetition',
        element,
        min: 0,
        max: Infinity,
      };
    }

    throw new Error(`Unexpected token ${token.type} at line ${token.line}, column ${token.column}`);
  }
}

/**
 * Main parser interface
 */
export const parser = {
  parse: (input: string): void => {
    try {
      log.debug('[Railroad Parser] Starting parse');
      const lexer = new RailroadLexer(input);
      const tokens = lexer.tokenize();
      log.debug('[Railroad Parser] Tokens:', tokens.length);

      const parser = new RailroadParser(tokens);
      parser.parse();

      log.debug('[Railroad Parser] Parse complete');
    } catch (error) {
      log.error('[Railroad Parser] Parse error:', error);
      throw error;
    }
  },
  parser: {
    yy: db,
  },
};

export default parser;
