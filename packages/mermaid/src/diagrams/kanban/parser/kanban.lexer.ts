import { Lexer } from 'chevrotain';
import type { ILexingResult, IToken } from 'chevrotain';
import { MODE_CHANGE_GROUP, kanbanLexerModes } from './kanban.tokens.js';

/** Singleton mode-aware lexer; construction and validation happen once at module load. */
export const kanbanLexer = new Lexer(kanbanLexerModes);

/** Raised when the diagram ends while a delimiter is still open. Carries the opening token. */
export class UnterminatedKanbanInputError extends Error {
  constructor(public readonly token: IToken) {
    super(`"${token.image}" is never closed`);
    this.name = 'UnterminatedKanbanInputError';
  }
}

/**
 * Rejects input that ran out while a lexer mode was still open — an unclosed `@{ … }`, `::icon(`,
 * `:::` or quoted string.
 *
 * The legacy lexer's `<<EOF>>` rule lived only in the `INITIAL` state, so reaching end-of-input in
 * any other state yielded jison's internal `$end` symbol, which the grammar did not accept as a
 * statement terminator. Chevrotain instead ends quietly in whatever mode it was in, so the check
 * has to be explicit. The reported token is the outermost delimiter left open, which is the one
 * the author needs to see.
 */
export function assertLexerFinishedInDefaultMode(result: ILexingResult): void {
  const changes = [...result.tokens, ...(result.groups[MODE_CHANGE_GROUP] ?? [])]
    .filter((token) => token.tokenType.PUSH_MODE !== undefined || token.tokenType.POP_MODE)
    .sort((a, b) => a.startOffset - b.startOffset);

  const open: IToken[] = [];
  for (const token of changes) {
    if (token.tokenType.POP_MODE) {
      open.pop();
    }
    if (token.tokenType.PUSH_MODE !== undefined) {
      open.push(token);
    }
  }
  if (open.length > 0) {
    throw new UnterminatedKanbanInputError(open[0]);
  }
}
