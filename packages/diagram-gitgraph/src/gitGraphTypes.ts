import type { GitGraphDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export const commitType = {
  NORMAL: 0,
  REVERSE: 1,
  HIGHLIGHT: 2,
  MERGE: 3,
  CHERRY_PICK: 4,
} as const;

export interface CommitDB {
  msg: string;
  id: string;
  type: number;
  tags?: string[];
}

export interface BranchDB {
  name: string;
  order: number;
}

export interface MergeDB {
  branch: string;
  id: string;
  type?: number;
  tags?: string[];
}

export interface CherryPickDB {
  id: string;
  targetId: string;
  parent: string;
  tags?: string[];
}

export interface Commit {
  id: string;
  message: string;
  seq: number;
  type: number;
  tags: string[];
  parents: string[];
  branch: string;
  customType?: number;
  customId?: boolean;
}

export interface GitGraph {
  statements: Statement[];
}

export type Statement = CommitAst | BranchAst | MergeAst | CheckoutAst | CherryPickingAst;

export interface CommitAst {
  $type: 'Commit';
  id: string;
  message?: string;
  tags?: string[];
  type?: 'NORMAL' | 'REVERSE' | 'HIGHLIGHT';
}

export interface BranchAst {
  $type: 'Branch';
  name: string;
  order?: number;
}

export interface MergeAst {
  $type: 'Merge';
  branch: string;
  id?: string;
  tags?: string[];
  type?: 'NORMAL' | 'REVERSE' | 'HIGHLIGHT';
}

export interface CheckoutAst {
  $type: 'Checkout';
  branch: string;
}

export interface CherryPickingAst {
  $type: 'CherryPicking';
  id: string;
  parent: string;
  tags?: string[];
}

export interface GitGraphDB extends DiagramDBBase<GitGraphDiagramConfig> {
  commitType: typeof commitType;
  setDirection: (dir: DiagramOrientation) => void;
  setOptions: (rawOptString: string) => void;
  getOptions: () => any;
  commit: (commitDB: CommitDB) => void;
  branch: (branchDB: BranchDB) => void;
  merge: (mergeDB: MergeDB) => void;
  cherryPick: (cherryPickDB: CherryPickDB) => void;
  checkout: (branch: string) => void;
  prettyPrint: () => void;
  clear: () => void;
  getBranchesAsObjArray: () => { name: string }[];
  getBranches: () => Map<string, string | null>;
  getCommits: () => Map<string, Commit>;
  getCommitsArray: () => Commit[];
  getCurrentBranch: () => string;
  getDirection: () => DiagramOrientation;
  getHead: () => Commit | null;
}

export interface GitGraphDBParseProvider extends Partial<GitGraphDB> {
  commitType: typeof commitType;
  setDirection: (dir: DiagramOrientation) => void;
  commit: (commitDB: CommitDB) => void;
  branch: (branchDB: BranchDB) => void;
  merge: (mergeDB: MergeDB) => void;
  cherryPick: (cherryPickDB: CherryPickDB) => void;
  checkout: (branch: string) => void;
}

export interface GitGraphDBRenderProvider extends Partial<GitGraphDB> {
  prettyPrint: () => void;
  clear: () => void;
  getBranchesAsObjArray: () => { name: string }[];
  getBranches: () => Map<string, string | null>;
  getCommits: () => Map<string, Commit>;
  getCommitsArray: () => Commit[];
  getCurrentBranch: () => string;
  getDirection: () => DiagramOrientation;
  getHead: () => Commit | null;
  getDiagramTitle: () => string;
}

export type DiagramOrientation = 'LR' | 'TB' | 'BT';
