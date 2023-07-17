import type { TokenType } from 'chevrotain';
import type { GrammarAST } from 'langium';

import { CommonTokenBuilder } from '../common/commonTokenBuilder.js';

export class PieTokenBuilder extends CommonTokenBuilder {
  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    const tokenType = super.buildTerminalToken(terminal);
    return PieTokenBuilder.customBuildTokens(tokenType);
  }

  public static customBuildTokens(tokenType: TokenType) {
    return tokenType;
  }
}
