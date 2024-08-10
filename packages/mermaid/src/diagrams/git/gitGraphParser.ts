import type { GitGraph } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './gitGraphAst.js';
import { commitType } from './gitGraphAst.js';
import type {
  CheckoutAst,
  CherryPickingAst,
  MergeAst,
  CommitAst,
  BranchAst,
  GitGraphDBProvider,
} from './gitGraphTypes.js';

const populate = (ast: GitGraph, db: GitGraphDBProvider) => {
  populateCommonDb(ast, db);
  // @ts-ignore: this wont exist if the direction is not specified
  if (ast.dir) {
    // @ts-ignore: this wont exist if the direction is not specified
    db.setDirection(ast.dir);
  }
  for (const statement of ast.statements) {
    parseStatement(statement, db);
  }
};

const parseStatement = (statement: any, db: GitGraphDBProvider) => {
  const parsers: Record<string, (stmt: any) => void> = {
    Commit: (stmt) => db.commit(...parseCommit(stmt)),
    Branch: (stmt) => db.branch(...parseBranch(stmt)),
    Merge: (stmt) => db.merge(...parseMerge(stmt)),
    Checkout: (stmt) => db.checkout(parseCheckout(stmt)),
    CherryPicking: (stmt) => db.cherryPick(...parseCherryPicking(stmt)),
  };

  const parser = parsers[statement.$type];
  if (parser) {
    parser(statement);
  } else {
    log.error(`Unknown statement type: ${statement.$type}`);
  }
};

const parseCommit = (commit: CommitAst): [string, string, number, string[] | undefined] => {
  const id = commit.id;
  const message = commit.message ?? '';
  const type = commit.type !== undefined ? commitType[commit.type] : commitType.NORMAL;
  const tags = commit.tags ?? undefined;

  return [message, id, type, tags];
};

const parseBranch = (branch: BranchAst): [string, number] => {
  const name = branch.name;
  const order = branch.order ?? 0;
  return [name, order];
};

const parseMerge = (
  merge: MergeAst
): [string, string, number | undefined, string[] | undefined] => {
  const branch = merge.branch;
  const id = merge.id ?? '';
  const type = merge.type !== undefined ? commitType[merge.type] : undefined;
  const tags = merge.tags ?? undefined;
  return [branch, id, type, tags];
};

const parseCheckout = (checkout: CheckoutAst): string => {
  const branch = checkout.branch;
  return branch;
};

const parseCherryPicking = (
  cherryPicking: CherryPickingAst
): [string, string, string[] | undefined, string] => {
  const id = cherryPicking.id;
  const tags = cherryPicking.tags?.length === 0 ? undefined : cherryPicking.tags;
  const parent = cherryPicking.parent;
  return [id, '', tags, parent];
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: GitGraph = await parse('gitGraph', input);
    log.debug(ast);
    populate(ast, db);
  },
};

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  const mockDB: GitGraphDBProvider = {
    commitType: commitType,
    setDirection: vi.fn(),
    commit: vi.fn(),
    branch: vi.fn(),
    merge: vi.fn(),
    cherryPick: vi.fn(),
    checkout: vi.fn(),
  };

  describe('GitGraph Parser', () => {
    it('should parse a commit statement', () => {
      const commit = {
        $type: 'Commit',
        id: '1',
        message: 'test',
        tags: ['tag1', 'tag2'],
        type: 'NORMAL',
      };
      parseStatement(commit, mockDB);
      expect(mockDB.commit).toHaveBeenCalledWith('test', '1', 0, ['tag1', 'tag2']);
    });
    it('should parse a branch statement', () => {
      const branch = {
        $type: 'Branch',
        name: 'newBranch',
        order: 1,
      };
      parseStatement(branch, mockDB);
      expect(mockDB.branch).toHaveBeenCalledWith('newBranch', 1);
    });
  });
}
