/**
 * The kanban `ParserDefinition`.
 *
 * Shaped like the jison module it replaces: a named `parser` export carrying a mutable `yy` and a
 * synchronous `parse`, plus a default export for the diagram definition. Keeping `parse`
 * synchronous preserves the existing contract — callers assert on thrown errors, not on rejected
 * promises — and `Diagram.ts` still assigns `parser.parser.yy` before every parse.
 */
import type { IToken } from 'chevrotain';
import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import type { ParserDefinition } from '../../../diagram-api/types.js';
import kanbanDb from '../kanbanDb.js';
import type { KanbanDB } from '../kanbanTypes.js';
import {
  UnterminatedKanbanInputError,
  assertLexerFinishedInDefaultMode,
  kanbanLexer,
} from './kanban.lexer.js';
import { kanbanParser } from './kanban.parser.js';
import { kanbanVisitor } from './kanban.visitor.js';

class KanbanChevrotainParser {
  /** The db this parse fills. Reassigned by `Diagram.ts`, and by the diagram's specs. */
  public yy: KanbanDB = kanbanDb;

  public parse(text: string): void {
    kanbanParser.input = [];
    try {
      runChevrotainParse(
        {
          diagramType: 'kanban',
          lexer: kanbanLexer,
          parser: kanbanParser,
          checkLexerResult: assertLexerFinishedInDefaultMode,
          entry: () => kanbanParser.start(),
          visit: (cst) => kanbanVisitor.build(cst, this.yy, text),
        },
        text
      );
    } catch (error) {
      throw locate(error, text);
    }
  }
}

/**
 * Puts the offending line and column in front of the detail rather than after it, so the position
 * stays readable even when Chevrotain's detail runs to several lines.
 */
function at(token: IToken, detail: string, text: string): Error {
  // The EOF token carries `NaN` for every position, so each field falls back to the offset.
  const start = Number.isFinite(token.startOffset) ? token.startOffset : text.length;
  const line = Number.isFinite(token.startLine)
    ? token.startLine
    : text.slice(0, start).split(/\r\n|\r|\n/).length;
  const column = Number.isFinite(token.startColumn)
    ? token.startColumn
    : start - text.lastIndexOf('\n', start - 1);
  return new Error(`Error parsing kanban diagram at line ${line}, column ${column}: ${detail}`);
}

function locate(error: unknown, text: string): unknown {
  if (error instanceof UnterminatedKanbanInputError) {
    return at(error.token, error.message, text);
  }
  const parseError = kanbanParser.errors[0];
  return parseError ? at(parseError.token, parseError.message, text) : error;
}

/** Singleton, mirroring the jison module's named `parser` export. */
export const parser = new KanbanChevrotainParser();

const parserDefinition: ParserDefinition = {
  parse: (text: string) => parser.parse(text),
  parser,
};

export default parserDefinition;
