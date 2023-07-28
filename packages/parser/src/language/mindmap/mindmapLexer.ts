import type { LexerResult } from 'langium';
import { CommonLexer } from '../common/commonLexer.js';
import { type IToken, createTokenInstance } from 'chevrotain';
import { MINDMAP_OUTDENT } from './mindmapTokenBuilder.js';

/**
 * The indentation stack,
 * the first element indicates the minimum indentation level.
 * It might change according to the root node indent level.
 */
export let indentStack: number[] = [0];

export class MindmapLexer extends CommonLexer {
  public override tokenize(text: string): LexerResult {
    indentStack = [0];
    const lexerResult: LexerResult = super.tokenize(text);

    const lastToken: IToken = lexerResult.tokens[lexerResult.tokens.length - 1];
    // add remaining OUTDENTs
    while (indentStack.length > 1) {
      lexerResult.tokens.push(
        createTokenInstance(
          MINDMAP_OUTDENT,
          '',
          lastToken.startOffset,
          lastToken.endOffset ?? NaN,
          lastToken.startLine ?? NaN,
          lastToken.endLine ?? NaN,
          lastToken.startColumn ?? NaN,
          lastToken.endColumn ?? NaN
        )
      );
      indentStack.pop();
    }

    return lexerResult;
  }
}
