import type { Usecase } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './usecaseDb.js';
import type { RelationshipType } from './usecaseDb.js';

const populate = (ast: Usecase) => {
  populateCommonDb(ast, db);

  if (!ast.statements) {
    return;
  }

  for (const stmt of ast.statements) {
    if (stmt.$type === 'ActorStatement') {
      for (const item of stmt.items) {
        const alias = item.alias ?? item.label;
        if (alias) {
          db.addActor(alias, (item.label ?? item.alias)!);
        }
      }
    } else if (stmt.$type === 'ExternalStatement') {
      for (const item of stmt.items) {
        const alias = item.alias ?? item.label;
        if (alias) {
          db.addExternal(alias, (item.label ?? item.alias)!);
        }
      }
    } else if (stmt.$type === 'SystemStatement') {
      const systemLabel = stmt.label ?? stmt.name ?? 'System';
      db.setSystem(systemLabel);
      if (stmt.items) {
        for (const uc of stmt.items) {
          const alias = uc.alias ?? uc.label;
          if (alias) {
            db.addUseCase(alias, (uc.label ?? uc.alias)!);
          }
        }
      }
    } else if (stmt.$type === 'UsecaseStatement') {
      for (const item of stmt.items) {
        const alias = item.alias ?? item.label;
        if (alias) {
          db.addUseCase(alias, (item.label ?? item.alias)!);
        }
      }
    } else if (stmt.$type === 'CollaborationStatement') {
      for (const item of stmt.items) {
        const alias = item.alias ?? item.label;
        if (alias) {
          db.addCollaboration(alias, (item.label ?? item.alias)!);
        }
      }
    } else if (stmt.$type === 'NoteStatement') {
      for (const item of stmt.items) {
        const alias = item.alias ?? item.label;
        if (alias) {
          db.addNote(alias, (item.label ?? item.alias)!);
        }
      }
    } else if (stmt.$type === 'AssociationStatement') {
      const from = stmt.from;
      for (const target of stmt.targets) {
        const to = target.to;
        if (from && to) {
          db.addConnection(from, 'association' as RelationshipType, to, target.label);
        }
      }
    } else if (stmt.$type === 'RelationshipStatement') {
      const type = stmt.type as RelationshipType;
      for (const pair of stmt.pairs) {
        if (pair.from && pair.to) {
          db.addConnection(pair.from, type, pair.to, pair.label);
        }
      }
    }
  }

  // Infer usecases from connection endpoints that were not explicitly declared
  db.inferUseCases();
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Usecase = await parse('usecase', input);
    log.debug(ast);
    populate(ast);
  },
};
