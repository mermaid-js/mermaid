import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import type { TokenType, TokenVocabulary } from 'chevrotain';

import { DefaultTokenBuilder } from 'langium';

export abstract class MermaidTokenBuilder extends DefaultTokenBuilder {
  private keywords: Set<string>;

  public constructor(keywords: string[]) {
    super();
    this.keywords = new Set<string>(keywords);
  }

  public override buildTokens(
    grammar: GrammarAST.Grammar,
    options?: TokenBuilderOptions | undefined
  ): TokenVocabulary {
    this.rearrangeRules(grammar.rules);
    return super.buildTokens(grammar, options);
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
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?:(?=%%)|(?!\\S))');
      }
    });
    return tokenTypes;
  }

  private rearrangeRules(rules: GrammarAST.AbstractRule[]): GrammarAST.AbstractRule[] {
    const pivotIndex = rules.findIndex((rule) => rule.name === 'TitleAndAccessibilities');
    if (pivotIndex === -1) {
      return rules;
    }
    return [...rules.slice(pivotIndex), ...rules.slice(0, pivotIndex)];
  }
}
