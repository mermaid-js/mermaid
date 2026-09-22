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
    usecaseParser.input = [];
    try {
      runChevrotainParse(
        {
          diagramType: 'usecase',
          lexer: usecaseLexer,
          parser: usecaseParser,
          entry: () => usecaseParser.start(),
          visit: (cst) => usecaseVisitor.build(cst, input),
        },
        input
      );
    } catch (error) {
      db.clear();
      const parseError = usecaseParser.errors[0];
      if (parseError) {
        const { token } = parseError;
        const start = Number.isFinite(token.startOffset) ? token.startOffset : input.length;
        const end =
          typeof token.endOffset === 'number' && Number.isFinite(token.endOffset)
            ? token.endOffset + 1
            : start;
        const line = token.startLine ?? input.slice(0, start).split(/\r\n|\r|\n/).length;
        const lineStart = Math.max(
          input.lastIndexOf('\n', start - 1),
          input.lastIndexOf('\r', start - 1)
        );
        const column = token.startColumn ?? start - lineStart;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${message} at line ${line}, column ${column} [${start},${end})`);
      }
      throw error;
    }
  },
};
