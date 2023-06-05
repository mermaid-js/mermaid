import type { TokenType } from 'chevrotain';
import { DefaultTokenBuilder } from 'langium';
import { TerminalRule } from 'langium/lib/grammar/generated/ast.js';

import {
  matchAccessibilityDescr,
  matchAccessibilityTitle,
  matchTimelineEventTitle,
  matchTimelinePeroidTitle,
  matchTimelineSectionTitle,
  matchTitle,
} from './matchers/index.js';

export class MermiadTokenBuilder extends DefaultTokenBuilder {
  override buildTerminalToken(terminal: TerminalRule): TokenType {
    const tokenType = super.buildTerminalToken(terminal);
    switch (tokenType.name) {
      // common
      case 'ACC_DESCR': {
        tokenType.LINE_BREAKS = true;
        tokenType.PATTERN = matchAccessibilityDescr;
        tokenType.START_CHARS_HINT = ['accDescr'];
        break;
      }
      case 'ACC_TITLE': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchAccessibilityTitle;
        tokenType.START_CHARS_HINT = ['accTitle'];
        break;
      }
      case 'TITLE': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchTitle;
        tokenType.START_CHARS_HINT = ['title'];
        break;
      }

      // timeline
      case 'SECTION_TITLE': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchTimelineSectionTitle;
        tokenType.START_CHARS_HINT = ['section'];
        break;
      }
      case 'PERIOD_TITLE': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchTimelinePeroidTitle;
        break;
      }
      case 'EVENT': {
        tokenType.LINE_BREAKS = false;
        tokenType.PATTERN = matchTimelineEventTitle;
        break;
      }
    }
    return tokenType;
  }
}
