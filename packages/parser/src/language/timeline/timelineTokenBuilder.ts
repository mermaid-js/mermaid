import type { TokenType } from 'chevrotain';
import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';

import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import {
  matchTimelinePeriodEventTitle,
  matchTimelinePeroidTitle,
  matchTimelineSectionTitle,
} from './timelineMatcher.js';

export class TimelineTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    return TimelineTokenBuilder.customBuildTerminalTokens(tokenTypes);
  }

  public static customBuildTerminalTokens(tokenTypes: TokenType[]): TokenType[] {
    tokenTypes.forEach((tokenType: TokenType): void => {
      switch (tokenType.name) {
        case 'TIMELINE_SECTION_TITLE': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchTimelineSectionTitle;
          tokenType.START_CHARS_HINT = ['section'];
          break;
        }
        case 'TIMELINE_PERIOD_TITLE': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchTimelinePeroidTitle;
          break;
        }
        case 'TIMELINE_PERIOD_EVENT': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchTimelinePeriodEventTitle;
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
    return TimelineTokenBuilder.customBuildKeywordTokens(tokenTypes);
  }

  public static customBuildKeywordTokens(tokenTypes: TokenType[]): TokenType[] {
    tokenTypes.forEach((token) => {
      if (token.name === 'timeilne' && token.PATTERN !== undefined) {
        token.PATTERN = new RegExp(token.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
