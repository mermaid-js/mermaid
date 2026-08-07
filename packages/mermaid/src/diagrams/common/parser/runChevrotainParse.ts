import type { CstNode, CstParser, Lexer } from 'chevrotain';

interface ChevrotainParseConfig {
  diagramType: string;
  lexer: Lexer;
  parser: CstParser;
  entry: () => CstNode;
  visit: (cst: CstNode) => void;
}

/** Runs a singleton lexer/parser pair and visits the resulting CST. */
export function runChevrotainParse(config: ChevrotainParseConfig, input: string): void {
  const lexResult = config.lexer.tokenize(input);
  if (lexResult.errors.length > 0) {
    throw new Error(`Error lexing ${config.diagramType} diagram: ${lexResult.errors[0].message}`);
  }

  config.parser.input = lexResult.tokens;
  const cst = config.entry();
  if (config.parser.errors.length > 0) {
    throw new Error(
      `Error parsing ${config.diagramType} diagram: ${config.parser.errors[0].message}`
    );
  }

  config.visit(cst);
}
