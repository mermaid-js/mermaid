import { AstNode, LangiumParser, ParseResult, createLangiumParser } from 'langium';

import { InfoServices } from './infoModule.js';
import { Info } from '../generated/ast.js';
import { version } from '../../../package.json';

export function createInfoParser(services: InfoServices): LangiumParser {
  const parser: LangiumParser = createLangiumParser(services);
  const parse = parser.parse.bind(parser);
  parser.parse = <T extends AstNode = AstNode>(input: string): ParseResult<T> => {
    const parseResult: ParseResult<T> = parse(input);
    (<Info>parseResult.value).version = version;
    return parseResult;
  };
  return parser;
}
