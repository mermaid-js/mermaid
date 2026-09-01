import type { ParserDefinition } from '../../../diagram-api/types.js';
import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { db } from '../db.js';
import { timingLexer } from './timing.lexer.js';
import { timingParser } from './timing.parser.js';
import { timingVisitor } from './timing.visitor.js';

export const parser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- normalize synchronous failures into rejected promises
  parse: async (input: string): Promise<void> => {
    timingParser.input = [];
    try {
      runChevrotainParse(
        {
          diagramType: 'timing',
          lexer: timingLexer,
          parser: timingParser,
          entry: () => timingParser.start(),
          visit: (cst) => timingVisitor.build(cst),
        },
        input
      );
    } catch (error) {
      db.clear();
      throw error;
    }
  },
};
