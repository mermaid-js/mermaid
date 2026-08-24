import type { CstNode, CstParser, ILexingResult, Lexer } from 'chevrotain';

interface ChevrotainParseConfig {
  diagramType: string;
  lexer: Lexer;
  parser: CstParser;
  entry: () => CstNode;
  visit: (cst: CstNode) => void;
  /**
   * Optional check on the token stream, run after lexing succeeds and before parsing. Throw to
   * reject the input. Diagrams with lexer modes use this to reject input that ended with a mode
   * still open, which Chevrotain does not report as a lexing error on its own.
   */
  checkLexerResult?: (result: ILexingResult) => void;
}

/** Runs a singleton lexer/parser pair and visits the resulting CST. */
export function runChevrotainParse(config: ChevrotainParseConfig, input: string): void {
  const lexResult = config.lexer.tokenize(input);
  if (lexResult.errors.length > 0) {
    // Lexer failures never reach `parser.errors`, so callers cannot enrich them the way
    // they enrich parser errors. Attach the position here so both failure modes report
    // the same fields.
    const lexError = lexResult.errors[0];
    const start = Number.isFinite(lexError.offset) ? lexError.offset : input.length;
    const end = start + (Number.isFinite(lexError.length) ? lexError.length : 0);
    throw new Error(
      `Error lexing ${config.diagramType} diagram: ${lexError.message} at line ${
        lexError.line ?? 1
      }, column ${lexError.column ?? 1} [${start},${end})`
    );
  }

  config.checkLexerResult?.(lexResult);

  config.parser.input = lexResult.tokens;
  const cst = config.entry();
  if (config.parser.errors.length > 0) {
    throw new Error(
      `Error parsing ${config.diagramType} diagram: ${config.parser.errors[0].message}`
    );
  }

  config.visit(cst);
}
