import { AstNode, LangiumParser, ParseResult, createLangiumParser } from 'langium';

import type { InfoServices } from './infoModule.js';
import type { Info } from '../generated/ast.js';
import { version } from '../../../package.json';

export function createInfoParser(services: InfoServices): LangiumParser {
  const parser: LangiumParser = createLangiumParser(services);
  const parse: <T extends AstNode = AstNode>(input: string) => ParseResult<T> =
    parser.parse.bind(parser);
  parser.parse = <T extends AstNode = AstNode>(input: string): ParseResult<T> => {
    const parseResult: ParseResult<T> = parse<T>(input);
    (<Info>parseResult.value).version = version;
    return parseResult;
  };
  return parser;
}
