import type { TokenType } from 'chevrotain';
import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import { InfoTokenBuilder } from '../index.js';
import { TimelineTokenBuilder } from '../timeline/timelineTokenBuilder.js';

export class MermiadTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    let tokenType: TokenType = super.buildTerminalToken(terminal);
    tokenType = TimelineTokenBuilder.customBuildTokens(tokenType);
    return tokenType;
  }

  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    let tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes = InfoTokenBuilder.customBuildKeywordTokens(tokenTypes);
    return tokenTypes;
  }
}
