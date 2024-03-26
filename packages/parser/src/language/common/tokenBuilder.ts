import type { TokenType } from 'chevrotain';
import type {
  CommentProvider,
  GrammarAST,
  LangiumCoreServices,
  Stream,
  TokenBuilderOptions,
} from 'langium';
import { DefaultTokenBuilder, stream } from 'langium';

export abstract class AbstractMermaidTokenBuilder extends DefaultTokenBuilder {
  private keywords: Set<string>;
  private commentProvider: CommentProvider;

  public constructor(keywords: string[], services: LangiumCoreServices) {
    super();
    this.keywords = new Set<string>(keywords);
    this.commentProvider = services.documentation.CommentProvider;
  }

  // TODO: This responsibility might better belong in CommentProvider (e.g. AbstractMermaidCommentProvider that is a subclass of CommentProvider).
  private ruleHasGreedyComment(rule: GrammarAST.AbstractRule): boolean {
    const comment = this.commentProvider.getComment(rule);
    return !!comment && /@greedy/.test(comment);
  }

  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    if (rules.some((rule: GrammarAST.AbstractRule) => this.ruleHasGreedyComment(rule))) {
      const notGreedyRules: GrammarAST.AbstractRule[] = [];
      const lastRules: GrammarAST.AbstractRule[] = [];
      // put terminal rules with @greedy in their comment at the end of the array
      rules.forEach((rule) => {
        if (this.ruleHasGreedyComment(rule)) {
          lastRules.push(rule);
        } else {
          notGreedyRules.push(rule);
        }
      });
      return super.buildTerminalTokens(stream([...notGreedyRules, ...lastRules]));
    } else {
      return super.buildTerminalTokens(rules);
    }
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
}

export class CommonTokenBuilder extends AbstractMermaidTokenBuilder {}
