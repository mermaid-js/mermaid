import { createToken, type TokenVocabulary, type TokenType } from 'chevrotain';
import {
  DefaultTokenBuilder,
  type Grammar,
  type GrammarAST,
  type Stream,
  type TokenBuilderOptions,
} from 'langium';

import {
  matchMindmapIndent,
  matchMindmapNodeDefault,
  matchMindmapNodeId,
  matchMindmapOutdent,
} from './mindmapMatcher.js';
import { swapByIndex } from './mindmapUtil.js';

export const MINDMAP_OUTDENT: TokenType = createToken({
  line_breaks: false,
  name: 'MINDMAP_OUTDENT',
  pattern: matchMindmapOutdent,
});

export class MindmapTokenBuilder extends DefaultTokenBuilder {
  public override buildTokens(grammar: Grammar, options?: TokenBuilderOptions): TokenVocabulary {
    const tokenTypes: TokenType[] = super.buildTokens(grammar, options) as TokenType[];

    // langium sorts the array from optimization, so we manually order tokens
    const tokenTypesNames: string[] = tokenTypes.map(
      (tokenType: TokenType): string => tokenType.name
    );
    const mindmapWhitespaceIndex = tokenTypesNames.indexOf('MINDMAP_WHITESPACE');
    const mindmapIndentIndex = tokenTypesNames.indexOf('MINDMAP_INDENT');
    swapByIndex(tokenTypes, mindmapWhitespaceIndex, mindmapIndentIndex);

    return tokenTypes;
  }

  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokenTypes: TokenType[] = super.buildTerminalTokens(rules);
    tokenTypes.forEach((tokenType: TokenType, index: number): void => {
      switch (tokenType.name) {
        case 'MINDMAP_OUTDENT': {
          tokenTypes[index] = MINDMAP_OUTDENT;
          break;
        }
        case 'MINDMAP_INDENT': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchMindmapIndent;
          break;
        }
        case 'MINDMAP_NODE_ID': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchMindmapNodeId;
          break;
        }
        case 'MINDMAP_NODE_DEFAULT': {
          tokenType.LINE_BREAKS = false;
          tokenType.PATTERN = matchMindmapNodeDefault;
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
      if (tokenType.name === 'mindmap' && tokenType.PATTERN !== undefined) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + '(?!\\S)');
      }
    });
    return tokenTypes;
  }
}
