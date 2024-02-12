import type { GrammarAST, Stream, TokenBuilderOptions } from 'langium';
import { DefaultTokenBuilder } from 'langium';
import type { TokenType } from 'chevrotain';

import { matchSankeyLinkNode } from './matcher.js';

export class SankeyTokenBuilder extends DefaultTokenBuilder {
  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes.forEach((tokenType: TokenType): void => {
      switch (tokenType.name) {
        case 'SANKEY_LINK_NODE': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchSankeyLinkNode;
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
      if (tokenType.name === 'sankey-beta' && tokenType.PATTERN !== undefined) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
