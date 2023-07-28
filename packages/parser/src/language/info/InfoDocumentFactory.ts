import { AstNode, DefaultLangiumDocumentFactory, ParseResult } from 'langium';
import { URI } from 'vscode-uri';

import type { Info } from '../generated/ast.js';
import { version } from '../../../package.json';

export class InfoDocumentFactory extends DefaultLangiumDocumentFactory {
  protected override parse<T extends AstNode>(uri: URI, text: string): ParseResult<T> {
    const parserResult: ParseResult<T> = super.parse<T>(uri, text);
    (<Info>parserResult.value).version = version;
    return parserResult;
  }
}
