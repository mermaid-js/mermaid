import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import { DefaultTokenBuilder } from 'langium';

import type { TokenType } from '../chevrotainWrapper.js';

export class PieTokenBuilder extends DefaultTokenBuilder {
  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes.forEach((tokenType: TokenType): void => {
      if (
        (tokenType.name === 'pie' || tokenType.name === 'showData') &&
        tokenType.PATTERN !== undefined
      ) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
