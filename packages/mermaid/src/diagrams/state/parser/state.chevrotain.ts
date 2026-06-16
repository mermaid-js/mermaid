import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import type { StateDB } from '../stateDb.js';
import { stateLexer } from './state.lexer.js';
import { stateParser } from './state.parser.js';
import { stateVisitor } from './state.visitor.js';

/**
 * Chevrotain-backed state parse: lex → parse → visit into the given `yy` (the `StateDB` the
 * diagram/spec is populating). Synchronous and throws on error — matching the legacy jison parser
 * (state specs use `expect(() => parse()).toThrow()`).
 */
export function parseStateChevrotain(input: string, yy: StateDB): void {
  stateVisitor.yy = yy;
  runChevrotainParse(
    {
      diagramType: 'state',
      lexer: stateLexer,
      parser: stateParser,
      entry: () => stateParser.stateDiagram(),
      visit: (cst) => stateVisitor.visit(cst),
    },
    input
  );
}
