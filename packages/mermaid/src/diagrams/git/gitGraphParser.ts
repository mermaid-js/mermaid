import type { GitGraph } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './gitGraphAst.js';
import type {
  Statement,
  CommitAst,
  Branch,
  Merge,
  Checkout,
  CherryPicking,
} from './gitGraphTypes.js';

const populate = (ast: any) => {
  populateCommonDb(ast, db);
  for (const statement of ast.statements) {
    parseStatement(statement);
  }
};

const parseStatement = (statement: Statement) => {
  switch (statement.$type) {
    case 'Commit':
      parseCommit(statement);
      break;
    case 'Branch':
      parseBranch(statement);
      break;
    case 'Merge':
      parseMerge(statement);
      break;
    case 'Checkout':
      parseCheckout(statement);
      break;
    case 'CherryPicking':
      parseCherryPicking(statement);
      break;
    default:
      throw new Error(`Unknown statement type: ${(statement as any).$type}`);
  }
};

function parseCommit(commit: CommitAst) {
  const message = commit.message ?? '';
  db.commit(message, commit.id, commit.tags, commit.type);
}

function parseBranch(branch: Branch) {
  db.branch(branch.name, branch.order);
}

function parseMerge(merge: Merge) {
  db.merge(merge.branch, merge.id, merge.tags, merge.type);
}

function parseCheckout(checkout: Checkout) {
  db.checkout(checkout.branch);
}

function parseCherryPicking(cherryPicking: CherryPicking) {
  db.cherryPick(cherryPicking.id, cherryPicking.tags, cherryPicking.parent);
}

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: GitGraph = await parse('gitGraph', input);
    log.debug(ast);
    populate(ast);
  },
};
