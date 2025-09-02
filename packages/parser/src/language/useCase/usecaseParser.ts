// Simple tokenizer and parser for usecase diagrams
// This approach is more compatible with the mermaid build system
import type {
  UsecaseDiagram,
  Statement,
  Actor,
  Usecase,
  SystemBoundary,
  SystemBoundaryMetadata,
  ActorUseCaseRelationship,
  Node,
  ActorNodeRelationship,
  InlineActorNodeRelationship,
  ParseResult
} from './usecaseTypes.js';

// Token types
enum TokenType {
  USECASE_START = 'USECASE_START',
  ACTOR = 'ACTOR',
  SYSTEM_BOUNDARY = 'SYSTEM_BOUNDARY',
  END = 'END',
  ARROW = 'ARROW',
  LABELED_ARROW = 'LABELED_ARROW',
  AT = 'AT',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  COLON = 'COLON',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

class UsecaseLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) {
        break;
      }

      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });

    return tokens;
  }

  private nextToken(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;

    // Skip comments
    if (this.peek() === '%') {
      this.skipComment();
      return null;
    }

    // Newlines
    if (this.peek() === '\n' || this.peek() === '\r') {
      this.advance();
      if (this.peek() === '\n') {
        this.advance();
      }
      this.line++;
      this.column = 1;
      return {
        type: TokenType.NEWLINE,
        value: '\n',
        line: startLine,
        column: startColumn
      };
    }



    // Strings
    if (this.peek() === '"' || this.peek() === "'") {
      return this.readString(startLine, startColumn);
    }

    // Arrow tokens (-->, ->, --label-->, --label->)
    if (this.peek() === '-') {
      if (this.peek(1) === '-') {
        // Check for labeled arrow: --label--> or --label->
        const labeledArrowMatch = this.tryParseLabeledArrow();
        if (labeledArrowMatch) {
          return labeledArrowMatch;
        }

        // Regular arrow: -->
        if (this.peek(2) === '>') {
          this.advance(3);
          return { type: TokenType.ARROW, value: '-->', line: startLine, column: startColumn };
        }
      } else if (this.peek(1) === '>') {
        // Regular arrow: ->
        this.advance(2);
        return { type: TokenType.ARROW, value: '->', line: startLine, column: startColumn };
      }
    }

    // Single character tokens
    switch (this.peek()) {
      case '@':
        this.advance();
        return { type: TokenType.AT, value: '@', line: startLine, column: startColumn };
      case '{':
        this.advance();
        return { type: TokenType.LBRACE, value: '{', line: startLine, column: startColumn };
      case '}':
        this.advance();
        return { type: TokenType.RBRACE, value: '}', line: startLine, column: startColumn };
      case ',':
        this.advance();
        return { type: TokenType.COMMA, value: ',', line: startLine, column: startColumn };
      case ':':
        this.advance();
        return { type: TokenType.COLON, value: ':', line: startLine, column: startColumn };
      case '(':
        this.advance();
        return { type: TokenType.LPAREN, value: '(', line: startLine, column: startColumn };
      case ')':
        this.advance();
        return { type: TokenType.RPAREN, value: ')', line: startLine, column: startColumn };
    }

    // Keywords and identifiers
    if (this.isAlpha(this.peek())) {
      return this.readIdentifierOrKeyword(startLine, startColumn);
    }

    // Skip unknown characters
    this.advance();
    return null;
  }



  private readIdentifierOrKeyword(line: number, column: number): Token {
    let value = '';

    while (this.position < this.input.length &&
           (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
      value += this.peek();
      this.advance();
    }

    // Check for keywords
    const type = this.getKeywordType(value);

    return {
      type,
      value,
      line,
      column
    };
  }

  private readString(line: number, column: number): Token {
    const quote = this.peek();
    this.advance(); // Skip opening quote

    let value = '';
    while (this.position < this.input.length && this.peek() !== quote) {
      value += this.peek();
      this.advance();
    }

    if (this.peek() === quote) {
      this.advance(); // Skip closing quote
    }

    return {
      type: TokenType.STRING,
      value: value, // Return the content without quotes
      line,
      column
    };
  }

  private getKeywordType(value: string): TokenType {
    switch (value.toLowerCase()) {
      case 'usecase': return TokenType.USECASE_START;
      case 'actor': return TokenType.ACTOR;
      case 'systemboundary': return TokenType.SYSTEM_BOUNDARY;
      case 'end': return TokenType.END;
      default: return TokenType.IDENTIFIER;
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length &&
           (this.peek() === ' ' || this.peek() === '\t')) {
      this.advance();
    }
  }

  private skipComment(): void {
    while (this.position < this.input.length &&
           this.peek() !== '\n' && this.peek() !== '\r') {
      this.advance();
    }
  }

  private peek(offset: number = 0): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : '';
  }

  private tryParseLabeledArrow(): Token | null {
    // Try to parse --label--> or --label->
    const startPos = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    // Skip initial '--'
    if (this.peek() !== '-' || this.peek(1) !== '-') {
      return null;
    }

    let pos = 2;
    let label = '';

    // Read the label
    while (pos < this.input.length - this.position) {
      const char = this.peek(pos);
      if (char === '-') {
        // Check if this is the end pattern
        if (this.peek(pos + 1) === '-' && this.peek(pos + 2) === '>') {
          // Found --label-->
          this.advance(pos + 3);
          return {
            type: TokenType.LABELED_ARROW,
            value: `--${label}-->`,
            line: startLine,
            column: startColumn
          };
        } else if (this.peek(pos + 1) === '>') {
          // Found --label->
          this.advance(pos + 2);
          return {
            type: TokenType.LABELED_ARROW,
            value: `--${label}->`,
            line: startLine,
            column: startColumn
          };
        } else {
          label += char;
          pos++;
        }
      } else if (char.match(/[a-zA-Z0-9_]/)) {
        label += char;
        pos++;
      } else {
        // Invalid character in label
        return null;
      }
    }

    return null;
  }

  private advance(count: number = 1): void {
    for (let i = 0; i < count && this.position < this.input.length; i++) {
      this.position++;
      this.column++;
    }
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }
}

class UsecaseParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): UsecaseDiagram {
    const statements: Statement[] = [];

    // Expect 'usecase' keyword at the start
    this.consume(TokenType.USECASE_START);
    this.skipNewlines();

    while (!this.isAtEnd()) {
      this.skipNewlines();

      if (this.isAtEnd()) {
        break;
      }

      const parsedStatements = this.parseStatement();
      if (parsedStatements) {
        if (Array.isArray(parsedStatements)) {
          statements.push(...parsedStatements);
        } else {
          statements.push(parsedStatements);
        }
      }
    }

    return {
      type: 'usecaseDiagram',
      statements
    };
  }

  private parseStatement(): Statement | Statement[] | null {
    const token = this.peek();

    switch (token.type) {
      case TokenType.ACTOR:
        return this.parseActorStatement();
      case TokenType.SYSTEM_BOUNDARY:
        return this.parseSystemBoundary();
      case TokenType.IDENTIFIER:
        // Look ahead to see if this is a systemBoundaryMetadata, relationship, or use case
        if (this.isSystemBoundaryMetadata()) {
          return this.parseSystemBoundaryMetadata();
        } else if (this.isRelationship()) {
          return this.parseRelationship();
        } else {
          return this.parseUseCase();
        }
      default:
        this.advance(); // Skip unknown tokens
        return null;
    }
  }

  private parseActorStatement(): Statement | Statement[] {
    this.consume(TokenType.ACTOR);

    // Check if this is an inline actor-node relationship
    // Look ahead: IDENTIFIER ARROW IDENTIFIER LPAREN
    if (this.isInlineActorNodeRelationship()) {
      return this.parseInlineActorNodeRelationship();
    }

    const actors: Actor[] = [];

    // Parse first actor
    actors.push(this.parseActorDefinition());

    // Parse additional actors separated by commas
    while (this.check(TokenType.COMMA)) {
      this.consume(TokenType.COMMA);
      actors.push(this.parseActorDefinition());
    }

    return actors;
  }

  private parseActorDefinition(): Actor {
    const name = this.consume(TokenType.IDENTIFIER).value;

    let metadata: Record<string, string> | undefined;

    // Check for optional metadata
    if (this.check(TokenType.AT)) {
      metadata = this.parseMetadata();
    }

    const actor: Actor = { type: 'actor', name };
    if (metadata) {
      actor.metadata = metadata;
    }

    return actor;
  }

  private parseSystemBoundary(): SystemBoundary {
    this.consume(TokenType.SYSTEM_BOUNDARY);
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.LBRACE);

    // Skip newlines after opening brace
    this.skipNewlines();

    const useCases: Usecase[] = [];

    // Parse use cases until we hit closing brace
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines();

      if (this.check(TokenType.RBRACE) || this.isAtEnd()) {
        break;
      }

      if (this.check(TokenType.IDENTIFIER)) {
        const useCase = this.parseUseCase();
        if (useCase) {
          useCases.push(useCase as Usecase);
        }
      } else {
        this.advance(); // Skip unknown tokens
      }
    }

    this.consume(TokenType.RBRACE);

    return {
      type: 'systemBoundary',
      name,
      useCases
    };
  }

  private parseSystemBoundaryMetadata(): SystemBoundaryMetadata {
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.AT);
    this.consume(TokenType.LBRACE);

    const metadata: Record<string, string> = {};

    // Parse metadata content
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const key = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.COLON);

        let value = '';
        if (this.check(TokenType.STRING)) {
          value = this.consume(TokenType.STRING).value;
          // Remove quotes from string value
          value = value.slice(1, -1);
        } else if (this.check(TokenType.IDENTIFIER)) {
          value = this.consume(TokenType.IDENTIFIER).value;
        }

        metadata[key] = value;

        // Optional comma
        if (this.check(TokenType.COMMA)) {
          this.advance();
        }
      } else {
        this.advance(); // Skip unknown tokens
      }
    }

    this.consume(TokenType.RBRACE);

    return {
      type: 'systemBoundaryMetadata',
      name,
      metadata
    };
  }

  private parseUseCase(): Usecase {
    const name = this.consume(TokenType.IDENTIFIER).value;

    return {
      type: 'usecase',
      name
    };
  }

  private isRelationship(): boolean {
    // Look ahead to see if there's an arrow after the identifier
    const currentPos = this.position;
    this.advance(); // Skip the identifier
    const hasArrow = this.check(TokenType.ARROW) || this.check(TokenType.LABELED_ARROW);
    this.position = currentPos; // Reset position
    return hasArrow;
  }

  private isSystemBoundaryMetadata(): boolean {
    // Look ahead to see if there's an @ after the identifier
    const currentPos = this.position;
    this.advance(); // Skip the identifier
    const hasAt = this.check(TokenType.AT);
    this.position = currentPos; // Reset position
    return hasAt;
  }

  private parseRelationship(): ActorUseCaseRelationship | ActorNodeRelationship {
    const from = this.consume(TokenType.IDENTIFIER).value;

    let arrowToken: Token;
    let label: string | undefined;

    if (this.check(TokenType.LABELED_ARROW)) {
      arrowToken = this.consume(TokenType.LABELED_ARROW);
      // Extract label from --label--> or --label->
      const arrowValue = arrowToken.value;
      const match = arrowValue.match(/^--(.+?)-+>$/);
      if (match) {
        label = match[1];
      }
    } else {
      arrowToken = this.consume(TokenType.ARROW);
    }

    // Check if target is a node definition (ID followed by parentheses)
    if (this.isNodeDefinition()) {
      const node = this.parseNodeDefinition();
      return {
        type: 'actorNodeRelationship',
        from,
        to: node.id,
        arrow: arrowToken.value,
        label
      };
    } else {
      const to = this.consume(TokenType.IDENTIFIER).value;
      return {
        type: 'actorUseCaseRelationship',
        from,
        to,
        arrow: arrowToken.value,
        label
      };
    }
  }

  private isInlineActorNodeRelationship(): boolean {
    // Look ahead: IDENTIFIER (ARROW|LABELED_ARROW) IDENTIFIER LPAREN
    const currentPos = this.position;

    if (!this.check(TokenType.IDENTIFIER)) {
      this.position = currentPos;
      return false;
    }
    this.advance(); // Skip actor name

    if (!this.check(TokenType.ARROW) && !this.check(TokenType.LABELED_ARROW)) {
      this.position = currentPos;
      return false;
    }
    this.advance(); // Skip arrow

    if (!this.check(TokenType.IDENTIFIER)) {
      this.position = currentPos;
      return false;
    }
    this.advance(); // Skip node ID

    const hasLParen = this.check(TokenType.LPAREN);
    this.position = currentPos; // Reset position
    return hasLParen;
  }

  private parseInlineActorNodeRelationship(): InlineActorNodeRelationship {
    const actor = this.consume(TokenType.IDENTIFIER).value;

    let arrowToken: Token;
    let label: string | undefined;

    if (this.check(TokenType.LABELED_ARROW)) {
      arrowToken = this.consume(TokenType.LABELED_ARROW);
      // Extract label from --label--> or --label->
      const arrowValue = arrowToken.value;
      const match = arrowValue.match(/^--(.+?)-+>$/);
      if (match) {
        label = match[1];
      }
    } else {
      arrowToken = this.consume(TokenType.ARROW);
    }

    const node = this.parseNodeDefinition();

    return {
      type: 'inlineActorNodeRelationship',
      actor,
      node,
      arrow: arrowToken.value,
      label
    };
  }

  private isNodeDefinition(): boolean {
    // Look ahead: IDENTIFIER LPAREN
    const currentPos = this.position;

    if (!this.check(TokenType.IDENTIFIER)) {
      this.position = currentPos;
      return false;
    }
    this.advance(); // Skip node ID

    const hasLParen = this.check(TokenType.LPAREN);
    this.position = currentPos; // Reset position
    return hasLParen;
  }

  private parseNodeDefinition(): Node {
    const id = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.LPAREN);

    // Parse node label (can be multiple words or a string)
    let label = '';
    if (this.check(TokenType.STRING)) {
      label = this.consume(TokenType.STRING).value;
      // Remove quotes
      label = label.slice(1, -1);
    } else {
      // Parse multiple identifiers as label
      const labelParts: string[] = [];
      while (this.check(TokenType.IDENTIFIER) && !this.check(TokenType.RPAREN)) {
        labelParts.push(this.consume(TokenType.IDENTIFIER).value);
      }
      label = labelParts.join(' ');
    }

    this.consume(TokenType.RPAREN);

    return {
      type: 'node',
      id,
      label
    };
  }



  private parseMetadata(): Record<string, string> {
    this.consume(TokenType.AT);
    this.consume(TokenType.LBRACE);

    const metadata: Record<string, string> = {};

    // Handle empty metadata
    if (this.check(TokenType.RBRACE)) {
      this.consume(TokenType.RBRACE);
      return metadata;
    }

    // Parse key-value pairs
    do {
      const key = this.consume(TokenType.IDENTIFIER).value;
      this.consume(TokenType.COLON);

      let value: string;
      if (this.check(TokenType.STRING)) {
        value = this.consume(TokenType.STRING).value;
      } else {
        value = this.consume(TokenType.IDENTIFIER).value;
      }

      metadata[key] = value;

      // Check for comma (more pairs) or closing brace
      if (this.check(TokenType.COMMA)) {
        this.consume(TokenType.COMMA);
      } else {
        break;
      }
    } while (!this.check(TokenType.RBRACE) && !this.isAtEnd());

    this.consume(TokenType.RBRACE);
    return metadata;
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.position++;
    }
    return this.tokens[this.position - 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private consume(type: TokenType): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const current = this.peek();
    throw new Error(`Expected ${type}, got ${current.type} at line ${current.line}`);
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.peek().type === TokenType.EOF;
  }
}

export function parseUsecase(input: string): ParseResult {
  try {
    const lexer = new UsecaseLexer(input);
    const tokens = lexer.tokenize();
    const parser = new UsecaseParser(tokens);
    const ast = parser.parse();

    return {
      success: true,
      ast
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}
