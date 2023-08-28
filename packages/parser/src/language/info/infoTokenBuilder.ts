import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import { DefaultTokenBuilder } from 'langium';

import type { TokenType } from '../chevrotainWrapper.js';

export class InfoTokenBuilder extends DefaultTokenBuilder {
  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    // to restrict users, they mustn't have any non-whitespace characters after the keyword.
    tokenTypes.forEach((tokenType: TokenType): void => {
      if (
        (tokenType.name === 'info' || tokenType.name === 'showInfo') &&
        tokenType.PATTERN !== undefined
      ) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
