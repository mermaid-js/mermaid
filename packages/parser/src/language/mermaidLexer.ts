import { DefaultLexer, LexerResult } from 'langium';

export class MermaidLexer extends DefaultLexer {
  override tokenize(text: string): LexerResult {
    if (!/\r?\n$/.test(text)) {
      return super.tokenize(text + '\n');
    }
    return super.tokenize(text);
  }
}
