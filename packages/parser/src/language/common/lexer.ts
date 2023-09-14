import type { LexerResult } from 'langium';
import { DefaultLexer } from 'langium';

export class CommonLexer extends DefaultLexer {
  public override tokenize(text: string): LexerResult {
    return super.tokenize(text + '\n');
  }
}
