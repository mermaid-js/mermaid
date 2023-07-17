import type { TokenType } from 'chevrotain';
import { DefaultTokenBuilder, type GrammarAST } from 'langium';

import { matchAccessibilityDescr, matchAccessibilityTitle, matchTitle } from './commonMatcher.js';

export class CommonTokenBuilder extends DefaultTokenBuilder {
  override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    const tokenType = super.buildTerminalToken(terminal);
    switch (tokenType.name) {
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
    }
    return tokenType;
  }
}
