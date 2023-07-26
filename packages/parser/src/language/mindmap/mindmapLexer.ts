import type { LexerResult } from 'langium';
import { CommonLexer } from '../common/commonLexer.js';
import { createTokenInstance } from 'chevrotain';
import { matchMindmapOutdent } from './mindmapMatcher.js';

/**
 * The indentation stack,
 * the first element indicates the minimum indentation level.
 * It might change according to the root node indent level.
 */
export let indentStack: number[] = [0];

export class MindmapLexer extends CommonLexer {
  public override tokenize(text: string): LexerResult {
    indentStack = [0];
    const LexerResult: LexerResult = super.tokenize(text);

    // add remaining OUTDENTs
    while (indentStack.length > 1) {
      LexerResult.tokens.push(
        createTokenInstance(
          {
            name: 'MINDMAP_OUTDENT',
            PATTERN: matchMindmapOutdent,
            LINE_BREAKS: false,
          },
          '',
          NaN,
          NaN,
          NaN,
          NaN,
          NaN,
          NaN
        )
      );
      indentStack.pop();
    }

    return LexerResult;
  }
}
