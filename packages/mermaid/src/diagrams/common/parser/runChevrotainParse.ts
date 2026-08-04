import type { CstNode, CstParser, Lexer } from 'chevrotain';

export interface ChevrotainParseConfig {
  /** Diagram id — used in error messages. */
  diagramType: string;
  /** Singleton lexer. */
  lexer: Lexer;
  /** Singleton parser instance (for `parser.input` and `parser.errors`). */
  parser: CstParser;
  /** Runs the entry rule and returns the CST, e.g. `() => pieParser.pieChart()`. */
  entry: () => CstNode;
  /** Walks the CST and populates the diagram `db`. */
  visit: (cst: CstNode) => void;
}

/**
 * Shared Chevrotain parse pipeline used by every diagram's `<name>.chevrotain.ts` wrapper:
 * append a trailing newline (so the final statement terminates), tokenize, run the grammar, surface
 * lexer/parser errors as Mermaid-shaped errors, then visit. Throws on any lexing/parsing error;
 * the visitor's own throws (e.g. an invalid value) propagate unchanged.
 */
export function runChevrotainParse(config: ChevrotainParseConfig, input: string): void {
  const { diagramType, lexer, parser, entry, visit } = config;
  const text = input.endsWith('\n') ? input : `${input}\n`;

  const lexResult = lexer.tokenize(text);
  if (lexResult.errors.length > 0) {
    throw new Error(`Error lexing ${diagramType} diagram: ${lexResult.errors[0].message}`);
  }

  parser.input = lexResult.tokens;
  const cst = entry();
  if (parser.errors.length > 0) {
    throw new Error(`Error parsing ${diagramType} diagram: ${parser.errors[0].message}`);
  }

  visit(cst);
}
