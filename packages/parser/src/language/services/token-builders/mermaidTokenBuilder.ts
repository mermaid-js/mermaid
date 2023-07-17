import type { TokenType } from 'chevrotain';
import type { GrammarAST } from 'langium';
import { CommonTokenBuilder } from '../../common/commonTokenBuilder.js';
import { PieTokenBuilder } from './pieTokenBuilder.js';
import { TimelineTokenBuilder } from './timelineTokenBuilder.js';

export class MermiadTokenBuilder extends CommonTokenBuilder {
  override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    let tokenType = super.buildTerminalToken(terminal);
    tokenType = PieTokenBuilder.customBuildTokens(tokenType);
    tokenType = TimelineTokenBuilder.customBuildTokens(tokenType);
    return tokenType;
  }
}
