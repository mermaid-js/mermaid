import type { C4, C4Element } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { C4BetaDB } from './db.js';
import type { C4Arrow, C4DiagramKind, C4Direction, C4ElementKind } from './types.js';

const addElement = (db: C4BetaDB, element: C4Element, parentId?: string) => {
  db.addElement({
    id: element.id,
    kind: element.kind as C4ElementKind,
    name: element.name,
    description: element.description,
    technology: element.technology,
    tags: [...element.tags],
    parentId,
  });
  for (const child of element.children) {
    addElement(db, child, element.id);
  }
};

export const populateDb = (ast: C4, db: C4BetaDB) => {
  populateCommonDb(ast, db);
  if (ast.kind) {
    db.setKind(ast.kind as C4DiagramKind);
  }
  if (ast.direction) {
    db.setDirection(ast.direction as C4Direction);
  }
  for (const element of ast.elements) {
    addElement(db, element);
  }
  for (const style of ast.styles) {
    db.addStyle(
      style.tag,
      style.entries.map(({ key, value }) => ({ key, value }))
    );
  }
  for (const relationship of ast.relationships) {
    db.addRelationship({
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      arrow: relationship.arrow as C4Arrow,
      description: relationship.description,
      technology: relationship.technology,
      step: relationship.step,
      tags: [...relationship.tags],
    });
  }
};

export const parser: ParserDefinition = {
  parser: {
    // @ts-expect-error - C4BetaDB is not assignable to DiagramDB
    yy: undefined,
  },
  parse: async (input: string): Promise<void> => {
    const ast: C4 = await parse('c4', input);
    log.debug(ast);
    const db = parser.parser?.yy;
    if (!(db instanceof C4BetaDB)) {
      throw new Error(
        'parser.parser?.yy was not a C4BetaDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    populateDb(ast, db);
  },
};
