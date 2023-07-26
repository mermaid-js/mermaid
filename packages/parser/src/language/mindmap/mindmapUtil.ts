import type { IToken } from 'chevrotain';

export const t = (
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

  // const nodes: IToken[] = matchedTokens.filter((matchedToken: IToken): boolean => {
  //   const name: string = matchedToken.tokenType.name;
  //   if (
  //     name === 'MINDMAP_NODE_SQUARE_TITLE' ||
  //     name === 'MINDMAP_NODE_CIRCLE_TITLE' ||
  //     name === 'MINDMAP_NODE_ROUNDED_SQUARE_TITLE' ||
  //     name === 'MINDMAP_NODE_BANG_TITLE' ||
  //     name === 'MINDMAP_NODE_CLOUD_TITLE' ||
  //     name === 'MINDMAP_NODE_HEXAGON_TITLE' ||
  //     name === 'MINDMAP_NODE_DEFAULT'
  //   ) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // });

  return { isFirstLine, isStartOfLine };
};
