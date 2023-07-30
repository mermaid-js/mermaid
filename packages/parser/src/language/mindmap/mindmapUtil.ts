import { createTokenInstance, type IToken } from 'chevrotain';

import { indentStack } from './mindmapLexer.js';
import { MINDMAP_OUTDENT } from './mindmapTokenBuilder.js';

let isFirstNodeMatched = false;

export const healperCondition = (
  startOffest: number,
  matchedTokens: IToken[]
): {
  isFirstLine: boolean;
  isStartOfLine: boolean;
} => {
  const noTokensMatchedYet: boolean = matchedTokens.length === 0;
  const newLines: IToken[] = matchedTokens.filter(
    (matchedToken: IToken) => matchedToken.tokenType.name === 'NEWLINE'
  );
  const noNewLinesMatchedYet: boolean = newLines.length === 0;
  const isFirstLine = noTokensMatchedYet && noNewLinesMatchedYet;
  const isStartOfLine =
    // only newlines matched so far
    (noTokensMatchedYet && !noNewLinesMatchedYet) ||
    // Both newlines and other Tokens have been matched AND the offset is just after the last newline
    (!noTokensMatchedYet &&
      !noNewLinesMatchedYet &&
      startOffest === newLines[newLines.length - 1].startOffset + 1);

  if (!isFirstNodeMatched) {
    const firstNodeIndex: number = matchedTokens.findIndex((matchedToken: IToken): boolean => {
      const name: string = matchedToken.tokenType.name;
      if (
        name === 'MINDMAP_NODE_SQUARE_TITLE' ||
        name === 'MINDMAP_NODE_CIRCLE_TITLE' ||
        name === 'MINDMAP_NODE_ROUNDED_SQUARE_TITLE' ||
        name === 'MINDMAP_NODE_BANG_TITLE' ||
        name === 'MINDMAP_NODE_CLOUD_TITLE' ||
        name === 'MINDMAP_NODE_HEXAGON_TITLE' ||
        name === 'MINDMAP_NODE_DEFAULT'
      ) {
        return true;
      } else {
        return false;
      }
    });

    if (
      firstNodeIndex !== -1 &&
      matchedTokens[firstNodeIndex - 1].tokenType.name === 'MINDMAP_INDENT'
    ) {
      // update the minimum indent level to be as the root node indent
      indentStack[0] = matchedTokens[firstNodeIndex - 1].image.length;
    }
    isFirstNodeMatched = true;
  }

  return { isFirstLine, isStartOfLine };
};

/**
 * Test if the current {@link startOffset} of the {@link text}
 * has a possible {@link lookahead} regexps.
 *
 * @param text - the actual text.
 * @param startOffset - the current offset.
 * @param lookahead - the possible regexps.
 * @returns if the passed {@link lookahead} is ahead the current {@link startOffset}.
 */
export const isRegExpAhead = (
  text: string,
  startOffset: number,
  lookahead: Record<string, RegExp>
): boolean => {
  for (const regexp of Object.values(lookahead)) {
    regexp.lastIndex = startOffset;
    const newText: string = text.slice(startOffset);
    if (regexp.test(newText)) {
      return true;
    }
  }
  return false;
};

export const createOutdentInstance = (lastToken: IToken): IToken => {
  return createTokenInstance(
    MINDMAP_OUTDENT,
    '',
    lastToken.startOffset,
    lastToken.endOffset ?? NaN,
    lastToken.startLine ?? NaN,
    lastToken.endLine ?? NaN,
    lastToken.startColumn ?? NaN,
    lastToken.endColumn ?? NaN
  );
};
