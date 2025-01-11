import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import type { TokenType } from 'chevrotain';

import { DefaultTokenBuilder } from 'langium';

export abstract class AbstractMermaidTokenBuilder extends DefaultTokenBuilder {
  private keywords: Set<string>;

  public constructor(keywords: string[]) {
    super();
    this.keywords = new Set<string>(keywords);
  }

  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    // to restrict users, they mustn't have any non-whitespace characters after the keyword.
    tokenTypes.forEach((tokenType: TokenType): void => {
      if (this.keywords.has(tokenType.name) && tokenType.PATTERN !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?:(?=%%)|(?!\\S))');
      }
    });
    return tokenTypes;
  }
}

export class CommonTokenBuilder extends AbstractMermaidTokenBuilder {}
