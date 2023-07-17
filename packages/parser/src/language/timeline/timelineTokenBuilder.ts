import type { TokenType } from 'chevrotain';
import type { GrammarAST } from 'langium';

import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import {
  matchTimelineEventTitle,
  matchTimelinePeroidTitle,
  matchTimelineSectionTitle,
} from './timelineMatcher.js';

export class TimelineTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    const tokenType = super.buildTerminalToken(terminal);
    return TimelineTokenBuilder.customBuildTokens(tokenType);
  }

  public static customBuildTokens(tokenType: TokenType) {
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
      case 'TIMELINE_EVENT': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchTimelineEventTitle;
        break;
      }
    }
    return tokenType;
  }
}
