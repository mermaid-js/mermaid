import type { TokenType } from 'chevrotain';
import {
  DefaultTokenBuilder,
  type GrammarAST,
  type Stream,
  type TokenBuilderOptions,
} from 'langium';

import { matchJourneyTaskTitle } from './journeyMatcher.js';

export class JourneyTokenBuilder extends DefaultTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes.forEach((tokenType: TokenType): void => {
      switch (tokenType.name) {
        case 'JOURNEY_TASK_TITLE': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchJourneyTaskTitle;
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
      if (tokenType.name === 'journey' && tokenType.PATTERN !== undefined) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
