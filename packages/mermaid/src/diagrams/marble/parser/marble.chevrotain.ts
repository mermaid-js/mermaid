import type { DiagramDB, ParserDefinition } from '../../../diagram-api/types.js';
import { isKnownLocation, runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { MarbleDB } from '../marbleDb.js';
import { marbleLexer } from './marble.lexer.js';
import { marbleParser } from './marble.parser.js';
import { marbleVisitor } from './marble.visitor.js';

/** Line and column of a Chevrotain parser error, falling back to the end of the input. */
const positionOf = (input: string): { line: number; column: number } | undefined => {
  const parseError = marbleParser.errors[0];
  if (!parseError) {
    return undefined;
  }
  const { token } = parseError;
  const start = isKnownLocation(token.startOffset) ? token.startOffset : input.length;
  const line = isKnownLocation(token.startLine)
    ? token.startLine
    : input.slice(0, start).split(/\r\n|\r|\n/).length;
  const lineStart = Math.max(
    input.lastIndexOf('\n', start - 1),
    input.lastIndexOf('\r', start - 1)
  );
  const column = isKnownLocation(token.startColumn) ? token.startColumn : start - lineStart;
  return { line, column };
};

export const parser: ParserDefinition = {
  // `Diagram.fromText` sets `yy` to the db it read from the diagram definition before it
  // parses. That definition hands out a new MarbleDB on every read, so each parse writes
  // into its own db.
  parser: { yy: undefined as unknown as DiagramDB },
  // eslint-disable-next-line @typescript-eslint/require-await -- normalizes synchronous parser errors into rejected promises
  parse: async (input: string): Promise<void> => {
    const db = parser.parser?.yy;
    if (!(db instanceof MarbleDB)) {
      throw new Error(
        'parser.parser.yy was not a MarbleDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    marbleParser.input = [];
    // Errors from the visitor come from the db, which already maps lines to the source.
    let visiting = false;
    try {
      runChevrotainParse(
        {
          diagramType: 'marble',
          lexer: marbleLexer,
          parser: marbleParser,
          entry: () => marbleParser.start(),
          visit: (cst) => {
            visiting = true;
            marbleVisitor.build(cst, db);
          },
        },
        input
      );
    } catch (error) {
      if (visiting) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes(' at line ')) {
        // A lexer error: its position is relative to the text after front matter.
        throw new Error(
          message.replace(/ at line (\d+)/, (_, line: string) => ` at line ${db.sourceLine(+line)}`)
        );
      }
      const position = positionOf(input);
      if (position) {
        throw new Error(
          `${message} at line ${db.sourceLine(position.line)}, column ${position.column}`
        );
      }
      throw error;
    }
  },
};
