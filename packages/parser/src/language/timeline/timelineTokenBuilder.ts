import type { TokenType } from 'chevrotain';
import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';

import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import { matchTimelinePeriodTitle } from './timelineMatcher.js';

export class TimelineTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes.forEach((tokenType: TokenType): void => {
      switch (tokenType.name) {
        case 'TIMELINE_PERIOD_TITLE': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchTimelinePeriodTitle;
          break;
        }
      }
    });
    return tokenTypes;
  }

  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenType[],
    options?: TokenBuilderOptions
  ): TokenType[] {
    const tokenTypes: TokenType[] = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes.forEach((tokenType: TokenType): void => {
      if (tokenType.name === 'timeline' && tokenType.PATTERN !== undefined) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
