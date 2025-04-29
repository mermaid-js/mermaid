/* eslint-disable unicorn/better-regex */
/* eslint-disable @cspell/spellchecker */
import type { UseCaseDiagram } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
// import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
// import { populateCommonDb } from '../common/populateCommonDb.js';
import type { UseCaseDB } from './useCaseTypes.js';
import { db } from './useCaseDb.js';

const populateDb = (ast: UseCaseDiagram, db: UseCaseDB) => {
  // populateCommonDb(ast, db);
  const containerId = ast.system?.id ?? ''; // empty string = root
  // Add actors
  ast.actors?.forEach((actor) =>
    db.addActor({
      id: actor.id,
      type: 'actor',
      position: actor.position ?? 'left',
      label: actor.id,
    })
  );

  // Add use cases (standalone)
  ast.useCases?.forEach((uc) =>
    db.addUseCase({
      id: uc.name.replace(/"/g, ''), // Always use the name field for ID
      type: 'usecase',
      label: uc.name.replace(/"/g, ''),
    })
  );

  // Add system group (if exists)
  if (ast.system) {
    ast.system.useCases?.forEach((uc) =>
      db.addUseCase({
        id: uc.name.replace(/"/g, ''),
        type: 'usecase',
        label: uc.name.replace(/"/g, ''),
        in: ast.system?.id,
      })
    );
  }

  // // Prepare a set of existing use case IDs
  // const existingUCs = new Set(db.getUseCases().map((node) => node.id));

  // function ensureUseCase(rawId: string) {
  //   // eslint-disable-next-line unicorn/better-regex
  //   const cleanId = rawId.replace(/['"]+/g, '').trim();
  //   if (!existingUCs.has(cleanId)) {
  //     db.addUseCase({
  //       id: cleanId,
  //       type: 'usecase',
  //       label: cleanId,
  //       in: containerId, // assign the container here
  //     });
  //     existingUCs.add(cleanId);
  //   }
  // }

  // // Add edges (Actor → UseCase & UseCase → UseCase)
  // ast.edges?.forEach((edge) => {
  //   // ensureUseCase(edge.lhsId);
  //   ensureUseCase(edge.rhsId);
  //   db.addEdge({
  //     from: edge.lhsId.replace(/["']+/g, ''),
  //     to:   edge.rhsId.replace(/["']+/g, ''),
  //     dashed: !!edge.dashed,
  //     title: edge.title?.replace(/[[\]]/g, ''),
  //   });
  // });
  /* ─── Helper to auto-create missing UCs ──────────────────── */
  const actorIds = new Set(ast.actors?.map((a) => a.id) ?? []);
  const existingUCs = new Set(db.getUseCases().map((n) => n.id));

  function ensureUseCase(rawId: string) {
    const clean = rawId.replace(/["']+/g, '').trim();
    if (actorIds.has(clean) || existingUCs.has(clean)) {
      return;
    }
    db.addUseCase({
      id: clean,
      type: 'usecase',
      label: clean,
      in: containerId,
    });
    existingUCs.add(clean);
  }

  // Edges (Actor→UseCase & UseCase→UseCase)
  ast.edges?.forEach((edge) => {
    ensureUseCase(edge.lhsId);
    ensureUseCase(edge.rhsId);

    db.addEdge({
      from: edge.lhsId.replace(/["']+/g, ''),
      to: edge.rhsId.replace(/["']+/g, ''),
      // dashed: !!edge.dashed,
      title: edge.title?.replace(/[[\]]/g, ''),
    });
  });
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    try {
      const ast: UseCaseDiagram = await parse('use_case', input);
      // console.log('[useCaseParser] AST:', ast);
      // console.log('[useCaseParser] Populating DB...');
      populateDb(ast, db);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[useCaseParser] Parse error:', err);
      throw err;
    }
  },
};
