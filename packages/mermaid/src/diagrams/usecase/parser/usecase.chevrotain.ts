import type { ParserDefinition } from '../../../diagram-api/types.js';
import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { db } from '../usecaseDb.js';
import { usecaseLexer } from './usecase.lexer.js';
import { usecaseParser } from './usecase.parser.js';
import { usecaseVisitor } from './usecase.visitor.js';

export const parser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- normalizes synchronous parser errors into rejected promises
  parse: async (input: string): Promise<void> => {
    db.clear();
    runChevrotainParse(
      {
        diagramType: 'usecase',
        lexer: usecaseLexer,
        parser: usecaseParser,
        entry: () => usecaseParser.start(),
        visit: (cst) => usecaseVisitor.visit(cst),
      },
      input
    );
  },
};
