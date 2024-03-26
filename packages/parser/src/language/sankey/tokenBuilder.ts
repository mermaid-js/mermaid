import type { GrammarAST, Stream } from 'langium';
import type { TokenType } from 'chevrotain';

import { AbstractMermaidTokenBuilder } from '../common/index.js';
import { matchSankeyLinkNode } from './matcher.js';
import type { SankeyServices } from './module.js';

export class SankeyTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor(services: SankeyServices) {
    super(['sankey-beta'], services);
  }

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
}
