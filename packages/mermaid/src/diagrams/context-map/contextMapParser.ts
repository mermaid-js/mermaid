import type { ContextMap, ContextMapLink, ContextMapNode } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import db from './contextMapDb.js';
import type { ContextMapDb } from './contextMapDb.js';
import type { RawLink, RawLabel, Arrow } from './contextMap.js';

const populateDb = (ast: ContextMap, db: ContextMapDb) => {
  db.setContextMapName(ast.blocks[0].name);
  for (const anyNode of ast.blocks[0].body.filter((n) => n.$type === 'ContextMapNode')) {
    db.addNode((anyNode as ContextMapNode).name);
  }
  for (const anyLink of ast.blocks[0].body.filter((n) => n.$type === 'ContextMapLink')) {
    const link = anyLink as ContextMapLink;
    const leftNodeId = link.leftNode.$refText;
    const leftLink = link.leftLabelBox;
    const rightNodeId = link.rightNode.$refText;
    const rightLink = link.rightLabelBox;
    if (!leftNodeId) {
      continue;
    }
    if (!rightNodeId) {
      continue;
    }
    const rawLink: RawLink = {
      source: { id: leftNodeId, type: leftLink?.labels.map((l) => l as RawLabel) ?? [] },
      target: { id: rightNodeId, type: rightLink?.labels.map((l) => l as RawLabel) ?? [] },
      arrow: directionToArrow(link.direction),
    };
    db.addEdge(rawLink);
  }
};

function directionToArrow(direction: '<-' | '->' | '<->'): Arrow[] {
  if (direction === '->') {
    return ['right'];
  } else if (direction === '<-') {
    return ['left'];
  }

  return ['left', 'right'];
}

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: ContextMap = await parse('contextMap', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
