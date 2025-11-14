import { BaseErrorListener } from 'antlr4ng';
import type { RecognitionException, Recognizer } from 'antlr4ng';

/**
 * Custom error listener for ANTLR usecase parser
 * Captures syntax errors and provides detailed error messages
 */
export class UsecaseErrorListener extends BaseErrorListener {
  private errors: { line: number; column: number; message: string; offendingSymbol?: any }[] = [];

  syntaxError(
    _recognizer: Recognizer<any>,
    offendingSymbol: any,
    line: number,
    charPositionInLine: number,
    message: string,
    _e: RecognitionException | null
  ): void {
    this.errors.push({
      line,
      column: charPositionInLine,
      message,
      offendingSymbol,
    });
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

  getErrors(): { line: number; column: number; message: string; offendingSymbol?: any }[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear(): void {
    this.errors = [];
  }

  /**
   * Create a detailed error with JISON-compatible hash property
   */
  createDetailedError(): Error {
    if (this.errors.length === 0) {
      return new Error('Unknown parsing error');
    }

    const firstError = this.errors[0];
    const message = `Parse error on line ${firstError.line}: ${firstError.message}`;
    const error = new Error(message);

    // Add hash property for JISON compatibility
    Object.assign(error, {
      hash: {
        line: firstError.line,
        loc: {
          first_line: firstError.line,
          last_line: firstError.line,
          first_column: firstError.column,
          last_column: firstError.column,
        },
        text: firstError.offendingSymbol?.text ?? '',
        token: firstError.offendingSymbol?.text ?? '',
        expected: [],
      },
    });

    return error;
  }

  /**
   * Get all error messages as a single string
   */
  getErrorMessages(): string {
    return this.errors
      .map((error) => `Line ${error.line}:${error.column} - ${error.message}`)
      .join('\n');
  }
}
