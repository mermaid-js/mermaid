import type { Network, NetworkNode } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { NetworkDBImpl } from './db.js';
import type { NetworkLinkDirection, NetworkNodeData } from './types.js';

const ARROW_TO_DIRECTION: Record<string, NetworkLinkDirection> = {
  '--': 'none',
  '---': 'none',
  '-->': 'forward',
  '<--': 'backward',
  '<-->': 'both',
};

const toNodeData = (node: NetworkNode): NetworkNodeData => ({
  id: node.id,
  nodeType: node.nodeType ?? 'default',
  label: node.label ?? node.id,
  meta:
    node.meta && node.meta.length > 0
      ? node.meta.map((m) => ({ key: m.key, value: m.value }))
      : undefined,
});

const populate = (ast: Network, db: NetworkDBImpl) => {
  populateCommonDb(ast, db);

  for (const node of ast.nodes ?? []) {
    db.addNode(toNodeData(node));
  }

  for (const link of ast.links ?? []) {
    db.addLink({
      source: link.source,
      target: link.target,
      label: link.label,
      direction: ARROW_TO_DIRECTION[link.arrow] ?? 'none',
    });
  }

  for (const subnet of ast.subnets ?? []) {
    const nodeIds: string[] = [];
    for (const node of subnet.nodes ?? []) {
      const data = toNodeData(node);
      data.subnet = subnet.id;
      db.addNode(data);
      nodeIds.push(node.id);
    }
    for (const link of subnet.links ?? []) {
      db.addLink({
        source: link.source,
        target: link.target,
        label: link.label,
        direction: ARROW_TO_DIRECTION[link.arrow] ?? 'none',
      });
    }
    db.addSubnet({
      id: subnet.id,
      label: subnet.label ?? subnet.id,
      nodeIds,
    });
  }
};

export const parser: ParserDefinition = {
  // @ts-expect-error - NetworkDBImpl is not assignable to DiagramDB
  parser: { yy: undefined },
  parse: async (input: string): Promise<void> => {
    const ast: Network = await parse('network', input);
    const db = parser.parser?.yy;
    if (!(db instanceof NetworkDBImpl)) {
      throw new Error(
        'parser.parser?.yy was not a NetworkDBImpl. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    log.debug(ast);
    populate(ast, db);
  },
};
