import type { FlowDB } from '../flowDb.js';
import { flowLexer } from './flow.lexer.js';
import { flowParser } from './flow.parser.js';
import { flowVisitor } from './flow.visitor.js';

/**
 * Chevrotain parse entry for the flowchart diagram. Lexes → parses → visits the CST into `yy`
 * (a `FlowDB` instance), reproducing the jison parser's population of the DB.
 *
 * jison interleaves lexing and parsing and stops at the FIRST error, whereas Chevrotain lexes the whole
 * input up front — so a later unexpected character can mask an earlier parse error (or vice-versa). We
 * report whichever error is positionally first, restoring jison's first-error ordering:
 * - `A[hello ) world]` → the unexpected `)` (parse error), not the later stray `]` (lex error).
 * - `graph TQ; …` → the bad direction (lex error), not a downstream parse error.
 */
export function parseFlowchartChevrotain(input: string, yy: FlowDB): void {
  flowVisitor.yy = yy;
  const text = input.endsWith('\n') ? input : `${input}\n`;

  const lexResult = flowLexer.tokenize(text);
  flowParser.input = lexResult.tokens;
  const cst = flowParser.start();

  const lexError = lexResult.errors[0];
  const parseError = flowParser.errors[0];
  const lexFirst =
    lexError !== undefined &&
    (parseError === undefined || lexError.offset <= (parseError.token?.startOffset ?? Infinity));

  if (lexFirst) {
    throw new Error(`Error lexing flowchart diagram: ${lexError.message}`);
  }
  if (parseError !== undefined) {
    throw new Error(`Error parsing flowchart diagram: ${parseError.message}`);
  }

  flowVisitor.visit(cst);
}
