import type { GitGraphDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export interface CommitType {
  NORMAL: number;
  REVERSE: number;
  HIGHLIGHT: number;
  MERGE: number;
  CHERRY_PICK: number;
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

export interface Position {
  x: number;
  y: number;
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
  tags?: string[];
  parent: string;
}

export interface GitGraphDB extends DiagramDBBase<GitGraphDiagramConfig> {
  commitType: CommitType;
  setDirection: (dir: DiagramOrientation) => void;
  setOptions: (rawOptString: string) => void;
  getOptions: () => any;
  commit: (msg: string, id: string, type: number, tags?: string[]) => void;
  branch: (name: string, order?: number) => void;
  merge: (
    otherBranch: string,
    customId?: string,
    overrideType?: number,
    customTags?: string[]
  ) => void;
  cherryPick: (
    sourceId: string,
    targetId: string,
    tags: string[] | undefined,
    parentCommitId: string
  ) => void;
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
  commitType: CommitType;
  setDirection: (dir: DiagramOrientation) => void;
  commit: (msg: string, id: string, type: number, tags?: string[]) => void;
  branch: (name: string, order?: number) => void;
  merge: (
    otherBranch: string,
    customId?: string,
    overrideType?: number,
    customTags?: string[]
  ) => void;
  cherryPick: (
    sourceId: string,
    targetId: string,
    tags: string[] | undefined,
    parentCommitId: string
  ) => void;
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
