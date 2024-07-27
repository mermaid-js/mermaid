import type { GitGraph } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './gitGraphAst.js';
import { commitType } from './gitGraphAst.js';
import type {
  CheckoutAst,
  CherryPickingAst,
  MergeAst,
  CommitAst,
  BranchAst,
} from './gitGraphTypes.js';

const populate = (ast: GitGraph) => {
  populateCommonDb(ast, db);
  // @ts-ignore: this wont exist if the direction is not specified
  if (ast.dir) {
    // @ts-ignore: this wont exist if the direction is not specified
    db.setDirection(ast.dir);
  }
  for (const statement of ast.statements) {
    parseStatement(statement);
  }
};

const parseStatement = (statement: any) => {
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
      log.warn(`Unknown statement type`);
  }
};

const parseCommit = (commit: CommitAst) => {
  const id = commit.id;
  const message = commit.message ?? '';
  const tags = commit.tags ?? undefined;
  const type = commit.type !== undefined ? commitType[commit.type] : 0;
  db.commit(message, id, type, tags);
};

const parseBranch = (branch: BranchAst) => {
  const name = branch.name;
  const order = branch.order ?? 0;
  db.branch(name, order);
};

const parseMerge = (merge: MergeAst) => {
  const branch = merge.branch;
  const id = merge.id ?? '';
  const tags = merge.tags ?? undefined;
  const type = merge.type !== undefined ? commitType[merge.type] : undefined;
  db.merge(branch, id, type, tags);
};

const parseCheckout = (checkout: CheckoutAst) => {
  const branch = checkout.branch;
  db.checkout(branch);
};

const parseCherryPicking = (cherryPicking: CherryPickingAst) => {
  const id = cherryPicking.id;
  const tags = cherryPicking.tags ?? undefined;
  const parent = cherryPicking.parent;
  db.cherryPick(id, '', tags, parent);
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: GitGraph = await parse('gitGraph', input);
    log.debug(ast);
    populate(ast);
  },
};
