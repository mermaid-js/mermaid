import type { TokenType } from 'chevrotain';
import { DefaultTokenBuilder, type Stream, type GrammarAST } from 'langium';

import { matchAccessibilityDescr, matchAccessibilityTitle, matchTitle } from './commonMatcher.js';

export class CommonTokenBuilder extends DefaultTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes.forEach((tokenType: TokenType): void => {
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
    });
    return tokenTypes;
  }
}
