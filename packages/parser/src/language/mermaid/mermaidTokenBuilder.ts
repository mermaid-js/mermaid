import type { TokenType } from 'chevrotain';
import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import { InfoTokenBuilder } from '../info/infoTokenBuilder.js';
import { PieTokenBuilder } from '../pie/pieTokenBuilder.js';
import { TimelineTokenBuilder } from '../timeline/timelineTokenBuilder.js';

export class MermiadTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    let tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes = TimelineTokenBuilder.customBuildTerminalTokens(tokenTypes);
    return tokenTypes;
  }

  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    let tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes = InfoTokenBuilder.customBuildKeywordTokens(tokenTypes);
    tokenTypes = PieTokenBuilder.customBuildKeywordTokens(tokenTypes);
    tokenTypes = TimelineTokenBuilder.customBuildKeywordTokens(tokenTypes);
    return tokenTypes;
  }
}
