import type { ParserDefinition } from '../../../diagram-api/types.js';
import { pieLexer } from './pie.lexer.js';
import { pieParser } from './pie.parser.js';
import { pieVisitor } from './pie.visitor.js';

/**
 * Chevrotain-backed pie parser. Lex → parse (CST) → check errors → visit (populate `db`).
 * `async` so the visitor's synchronous throws (e.g. negative section value) surface as rejections,
 * and so `parse()` always returns a Promise (the legacy parser does too; specs use `.rejects`/`.resolves`).
 */
export const chevrotainParser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- async purely to normalize sync throws into a rejected Promise
  parse: async (input: string): Promise<void> => {
    // Guarantee a trailing newline so the final statement terminates (mirrors Diagram.fromText).
    const text = input.endsWith('\n') ? input : `${input}\n`;

    const lexResult = pieLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
      throw new Error(`Error lexing pie diagram: ${lexResult.errors[0].message}`);
    }

    pieParser.input = lexResult.tokens;
    const cst = pieParser.pieChart();
    if (pieParser.errors.length > 0) {
      throw new Error(`Error parsing pie diagram: ${pieParser.errors[0].message}`);
    }

    pieVisitor.visit(cst);
  },
};
