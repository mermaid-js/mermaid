/**
 * True ANTLR Parser Implementation for UseCase Diagrams
 *
 * This parser uses the actual ANTLR-generated files from Usecase.g4
 * and implements the visitor pattern to build the AST.
 */

import { CharStream, CommonTokenStream, BaseErrorListener } from 'antlr4ng';
import type { RecognitionException, Recognizer } from 'antlr4ng';
import { UsecaseLexer } from './generated/UsecaseLexer.js';
import { UsecaseParser } from './generated/UsecaseParser.js';
import { UsecaseAntlrVisitor } from './visitor.js';
import type { AntlrUsecaseParser, UsecaseParseResult } from './types.js';

/**
 * Custom error listener for ANTLR parser to capture syntax errors
 */
class UsecaseErrorListener extends BaseErrorListener {
  private errors: string[] = [];

  syntaxError(
    _recognizer: Recognizer<any>,
    _offendingSymbol: any,
    line: number,
    charPositionInLine: number,
    message: string,
    _e: RecognitionException | null
  ): void {
    const errorMsg = `Syntax error at line ${line}:${charPositionInLine} - ${message}`;
    this.errors.push(errorMsg);
  }

  reportAmbiguity(): void {
    // Optional: handle ambiguity reports
  }

  reportAttemptingFullContext(): void {
    // Optional: handle full context attempts
  }

  reportContextSensitivity(): void {
    // Optional: handle context sensitivity reports
  }

  getErrors(): string[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Custom error class for usecase parsing errors
 */
export class UsecaseParseError extends Error {
  public line?: number;
  public column?: number;
  public token?: string;
  public expected?: string[];
  public hash?: Record<string, any>;

  constructor(
    message: string,
    details?: {
      line?: number;
      column?: number;
      token?: string;
      expected?: string[];
    }
  ) {
    super(message);
    this.name = 'UsecaseParseError';
    this.line = details?.line;
    this.column = details?.column;
    this.token = details?.token;
    this.expected = details?.expected;

    // Create hash object similar to other diagram types
    this.hash = {
      text: details?.token ?? '',
      token: details?.token ?? '',
      line: details?.line?.toString() ?? '1',
      loc: {
        first_line: details?.line ?? 1,
        last_line: details?.line ?? 1,
        first_column: details?.column ?? 1,
        last_column: (details?.column ?? 1) + (details?.token?.length ?? 0),
      },
      expected: details?.expected ?? [],
    };
  }
}

/**
 * ANTLR-based UseCase parser implementation
 */
export class UsecaseAntlrParser implements AntlrUsecaseParser {
  private visitor: UsecaseAntlrVisitor;
  private errorListener: UsecaseErrorListener;

  constructor() {
    this.visitor = new UsecaseAntlrVisitor();
    this.errorListener = new UsecaseErrorListener();
  }

  /**
   * Parse UseCase diagram input using true ANTLR parsing
   *
   * @param input - The UseCase diagram text to parse
   * @returns Parsed result with actors, use cases, and relationships
   * @throws UsecaseParseError when syntax errors are encountered
   */
  parse(input: string): UsecaseParseResult {
    // Clear previous errors
    this.errorListener.clear();

    try {
      // Step 1: Create ANTLR input stream
      const chars = CharStream.fromString(input);

      // Step 2: Create lexer from generated ANTLR lexer
      const lexer = new UsecaseLexer(chars);

      // Add error listener to lexer
      lexer.removeErrorListeners();
      lexer.addErrorListener(this.errorListener);

      // Step 3: Create token stream
      const tokens = new CommonTokenStream(lexer);

      // Step 4: Create parser from generated ANTLR parser
      const parser = new UsecaseParser(tokens);

      // Add error listener to parser
      parser.removeErrorListeners();
      parser.addErrorListener(this.errorListener);

      // Step 5: Parse using the grammar rule: usecaseDiagram
      const tree = parser.usecaseDiagram();

      // Check for syntax errors before proceeding
      if (this.errorListener.hasErrors()) {
        const errors = this.errorListener.getErrors();
        throw new UsecaseParseError(`Syntax error in usecase diagram: ${errors.join('; ')}`, {
          token: 'unknown',
          expected: ['valid usecase syntax'],
        });
      }

      // Step 6: Visit the parse tree using our visitor
      this.visitor.visitUsecaseDiagram!(tree);

      // Step 7: Get the parse result
      return this.visitor.getParseResult();
    } catch (error) {
      if (error instanceof UsecaseParseError) {
        throw error;
      }

      // Handle other types of errors
      throw new UsecaseParseError(
        `Failed to parse usecase diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          token: 'unknown',
          expected: ['valid usecase syntax'],
        }
      );
    }
  }
}

/**
 * Factory function to create a new ANTLR UseCase parser
 */
export function createUsecaseAntlrParser(): AntlrUsecaseParser {
  return new UsecaseAntlrParser();
}

/**
 * Convenience function for parsing UseCase diagrams
 *
 * @param input - The UseCase diagram text to parse
 * @returns Parsed result with actors, use cases, and relationships
 */
export function parseUsecaseWithAntlr(input: string): UsecaseParseResult {
  const parser = createUsecaseAntlrParser();
  return parser.parse(input);
}
