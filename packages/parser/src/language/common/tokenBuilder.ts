import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import type { TokenType } from '../chevrotainWrapper.js';

import { DefaultTokenBuilder } from 'langium';

export class MermaidTokenBuilder extends DefaultTokenBuilder {
  private keywords: Set<string>;
  constructor(public _keywords: string[]) {
    super();
    this.keywords = new Set<string>(_keywords);
  }

  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes.forEach((tokenType: TokenType): void => {
      if (this.keywords.has(tokenType.name) && tokenType.PATTERN !== undefined) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
