import { DefaultLexer, type LexerResult } from 'langium';

export class CommonLexer extends DefaultLexer {
  public override tokenize(text: string): LexerResult {
    return super.tokenize(text + '\n');
  }
}
