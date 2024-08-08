import type { DiagramDB } from '../../diagram-api/types.js';
import type { GitGraphDiagramConfig } from '../../config.type.js';

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

export interface GitGraphDB extends DiagramDB {
  // config
  getConfig: () => GitGraphDiagramConfig | undefined;

  // common db
  clear: () => void;
  setDiagramTitle: (title: string) => void;
  getDiagramTitle: () => string;
  setAccTitle: (title: string) => void;
  getAccTitle: () => string;
  setAccDescription: (description: string) => void;
  getAccDescription: () => string;

  // diagram db
  commitType: CommitType;
  setDirection: (direction: DiagramOrientation) => void;
  getDirection: () => DiagramOrientation;
  setOptions: (options: string) => void;
  getOptions: () => string;
  commit: (msg: string, id: string, type: number, tags?: string[] | undefined) => void;
  branch: (name: string, order: number) => void;
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
  getBranchesAsObjArray: () => { name: string }[];
  getBranches: () => Map<string, string | null>;
  getCommits: () => Map<string, Commit>;
  getCommitsArray: () => Commit[];
  getCurrentBranch: () => string;
  getHead: () => Commit | null;
}

export type DiagramOrientation = 'LR' | 'TB' | 'BT';
