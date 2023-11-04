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

  /**
   * Reorders rules using a pivot rule.
   *
   * We use this function to reorder rules because imported rules are
   *  inserted at the end of the array.
   *
   * @param rules - the grammar rules.
   */
  private rearrangeRules(rules: GrammarAST.AbstractRule[]): void {
    const index = rules.findIndex((rule) => rule.name === 'TitleAndAccessibilities');
    if (index === -1) {
      return;
    }

    const [item] = rules.splice(index, 1);

    rules.unshift(item);

    const itemsToMove = rules.splice(1, index);
    rules.push(...itemsToMove);
  }
}

export class CommonTokenBuilder extends MermaidTokenBuilder {}
