import type { TokenType } from 'chevrotain';
import type { GrammarAST } from 'langium';
import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';
import { TimelineTokenBuilder } from '../timeline/timelineTokenBuilder.js';

export class MermiadTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    let tokenType: TokenType = super.buildTerminalToken(terminal);
    tokenType = TimelineTokenBuilder.customBuildTokens(tokenType);
    return tokenType;
  }
}
