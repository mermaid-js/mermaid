import type { TokenType } from 'chevrotain';
import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';

import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';

export class PieTokenBuilder extends CommonTokenBuilder {
  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    return PieTokenBuilder.customBuildKeywordTokens(tokenTypes);
  }

  public static customBuildKeywordTokens(tokenTypes: TokenType[]): TokenType[] {
    tokenTypes.forEach((token) => {
      if ((token.name === 'pie' || token.name === 'showData') && token.PATTERN !== undefined) {
        token.PATTERN = new RegExp(token.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
