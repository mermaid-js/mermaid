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

  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    // put the greedy annotated terminal rules at the end of the array
    const rulesArray = rules.toArray();
    rules.forEach((rule, index) => {
      const comment = this.commentProvider.getComment(rule);
      if (comment && /@greedy/.test(comment)) {
        rulesArray.push(rulesArray.splice(index, 1)[0]);
      }
    });
    return super.buildTerminalTokens(stream(rulesArray));
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
