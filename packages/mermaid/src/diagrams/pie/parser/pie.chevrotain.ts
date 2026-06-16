import type { ParserDefinition } from '../../../diagram-api/types.js';
import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { pieLexer } from './pie.lexer.js';
import { pieParser } from './pie.parser.js';
import { pieVisitor } from './pie.visitor.js';

/**
 * Chevrotain-backed pie parser. `async` so the visitor's synchronous throws (e.g. a negative
 * section value) surface as a rejected Promise, and so `parse()` always returns a Promise (the
 * legacy parser does too; specs use `.rejects` / `.resolves`).
 */
export const chevrotainParser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- async purely to normalize sync throws into a rejected Promise
  parse: async (input: string): Promise<void> => {
    runChevrotainParse(
      {
        diagramType: 'pie',
        lexer: pieLexer,
        parser: pieParser,
        entry: () => pieParser.pieChart(),
        visit: (cst) => pieVisitor.visit(cst),
      },
      input
    );
  },
};
