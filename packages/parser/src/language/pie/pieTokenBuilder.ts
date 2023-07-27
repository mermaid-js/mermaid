import type { TokenType } from 'chevrotain';
import {
  DefaultTokenBuilder,
  type GrammarAST,
  type Stream,
  type TokenBuilderOptions,
} from 'langium';

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
