import type { Grammar, TokenBuilderOptions } from 'langium';
import type { IToken, TokenType, TokenVocabulary } from 'chevrotain';

import { AbstractMermaidTokenBuilder } from '../common/index.js';

const COMMENT = /;[^\n\r]*/y;
// Inside a rule, `;` is the terminator when only whitespace, a comment or the next rule follows it.
const TERMINATOR_FOLLOWER = /[\t ]*(?:[\n\r;]|$|[A-Za-z][\dA-Za-z-]*[\t ]*=)/y;
// A `;` starting a line is a commented-out line unless only whitespace or a spaced-out comment follows it.
const LINE_START_TERMINATOR_FOLLOWER = /[\t ]*(?:[\n\r]|$)|[\t ]+;/y;

const startsLine = (text: string, offset: number): boolean => {
  let i = offset - 1;
  while (text[i] === ' ' || text[i] === '\t') {
    i--;
  }
  return i < 0 || text[i] === '\n' || text[i] === '\r';
};

const isInsideRule = (tokens: IToken[]): boolean => {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].image === ';') {
      return false;
    }
    if (tokens[i].image === '=') {
      return true;
    }
  }
  return false;
};

const matchComment = (text: string, offset: number, tokens: IToken[]) => {
  if (isInsideRule(tokens)) {
    const follower = startsLine(text, offset)
      ? LINE_START_TERMINATOR_FOLLOWER
      : TERMINATOR_FOLLOWER;
    follower.lastIndex = offset + 1;
    if (follower.test(text)) {
      return null;
    }
  }
  COMMENT.lastIndex = offset;
  return COMMENT.exec(text);
};

export class RailroadAbnfTokenBuilder extends AbstractMermaidTokenBuilder {
  constructor() {
    super(['railroad-abnf-beta']);
  }

  public override buildTokens(grammar: Grammar, options?: TokenBuilderOptions): TokenVocabulary {
    const tokens = super.buildTokens(grammar, options) as TokenType[];
    // Swapped in after the build so the `;` keyword still gets the comment as its longer alternative.
    const comment = tokens.find(({ name }) => name === 'ABNF_COMMENT')!;
    comment.PATTERN = matchComment;
    comment.START_CHARS_HINT = [';'];
    comment.LINE_BREAKS = false;
    return tokens;
  }
}
