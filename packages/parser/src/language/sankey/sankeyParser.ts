import { AstNode, LangiumParser, ParseResult, createLangiumParser } from 'langium';

import { SankeyServices } from './sankeyModule.js';
import type { Sankey, SankeyLink } from '../generated/ast.js';

export function createSankeyParser(services: SankeyServices): LangiumParser {
  const parser: LangiumParser = createLangiumParser(services);
  const parse = parser.parse.bind(parser);
  parser.parse = <T extends AstNode = AstNode>(input: string): ParseResult<T> => {
    const parseResult: ParseResult<T> = parse(input);

    const sankeyValue: Sankey = parseResult.value as unknown as Sankey;
    const links: SankeyLink[] = sankeyValue.links;

    const nodes: Set<string> = new Set<string>();
    links.forEach((link: SankeyLink) => {
      nodes.add(link.source);
      nodes.add(link.target);
    });
    sankeyValue.nodes = [...nodes.values()];

    return parseResult;
  };
  return parser;
}
