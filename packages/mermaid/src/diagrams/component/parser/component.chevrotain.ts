import type { ParserDefinition } from '../../../diagram-api/types.js';
import { isKnownLocation, runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { db } from '../componentDb.js';
import { componentLexer } from './component.lexer.js';
import { componentParser } from './component.parser.js';
import { componentVisitor } from './component.visitor.js';

export const parser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- normalizes synchronous parser errors into rejected promises
  parse: async (input: string): Promise<void> => {
    db.clear();
    componentParser.input = [];
    try {
      runChevrotainParse(
        {
          diagramType: 'component',
          lexer: componentLexer,
          parser: componentParser,
          entry: () => componentParser.start(),
          visit: (cst) => componentVisitor.build(cst),
        },
        input
      );
    } catch (error) {
      db.clear();
      const parseError = componentParser.errors[0];
      if (parseError) {
        const { token } = parseError;
        const start = isKnownLocation(token.startOffset) ? token.startOffset : input.length;
        const end = isKnownLocation(token.endOffset) ? token.endOffset + 1 : start;
        const line = isKnownLocation(token.startLine)
          ? token.startLine
          : input.slice(0, start).split(/\r\n|\r|\n/).length;
        const lineStart = Math.max(
          input.lastIndexOf('\n', start - 1),
          input.lastIndexOf('\r', start - 1)
        );
        const column = isKnownLocation(token.startColumn) ? token.startColumn : start - lineStart;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${message} at line ${line}, column ${column} [${start},${end})`);
      }
      throw error;
    }
  },
};
