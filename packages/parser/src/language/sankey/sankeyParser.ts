import type { AstNode, LangiumParser, ParseResult } from 'langium';
import { createLangiumParser } from 'langium';

import type { SankeyServices } from './sankeyModule.js';
import type { SankeyLink } from '../generated/ast.js';
import { isSankey } from '../generated/ast.js';

export function createSankeyParser(services: SankeyServices): LangiumParser {
  const parser: LangiumParser = createLangiumParser(services);
  const parse = parser.parse.bind(parser);
  parser.parse = <T extends AstNode = AstNode>(input: string): ParseResult<T> => {
    const parseResult: ParseResult<T> = parse(input);

    if (isSankey(parseResult.value)) {
      const nodes: Set<string> = new Set<string>();
      parseResult.value.links.forEach((link: SankeyLink) => {
        if (!nodes.has(link.source)) {
          nodes.add(link.source);
        }
        if (!nodes.has(link.target)) {
          nodes.add(link.target);
        }
      });
      parseResult.value.nodes = [...nodes];
    }

    return parseResult;
  };
  return parser;
}
