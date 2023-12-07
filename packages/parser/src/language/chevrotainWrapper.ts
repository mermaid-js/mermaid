/* eslint-disable @typescript-eslint/no-explicit-any */

type CustomPatternMatcherReturn = [string] & { payload?: any };

export type CustomPatternMatcherFunc = (
  text: string,
  offset: number,
  tokens: IToken[],
  groups: {
    [groupName: string]: IToken[];
  }
) => CustomPatternMatcherReturn | RegExpExecArray | null;

interface ICustomPattern {
  exec: CustomPatternMatcherFunc;
}

type TokenPattern = RegExp | string | CustomPatternMatcherFunc | ICustomPattern;

export interface IToken {
  image: string;
  startOffset: number;
  startLine?: number;
  startColumn?: number;
  endOffset?: number;
  endLine?: number;
  endColumn?: number;
  isInsertedInRecovery?: boolean;
  tokenTypeIdx: number;
  tokenType: TokenType;
  payload?: any;
}

export interface TokenType {
  name: string;
  GROUP?: string;
  PATTERN?: TokenPattern;
  LABEL?: string;
  LONGER_ALT?: TokenType | TokenType[];
  POP_MODE?: boolean;
  PUSH_MODE?: string;
  LINE_BREAKS?: boolean;
  CATEGORIES?: TokenType[];
  tokenTypeIdx?: number;
  categoryMatches?: number[];
  categoryMatchesMap?: {
    [tokType: number]: boolean;
  };
  isParent?: boolean;
  START_CHARS_HINT?: (string | number)[];
}
