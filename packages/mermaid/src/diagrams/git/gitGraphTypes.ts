export type CommitType = 'NORMAL' | 'REVERSE' | 'HIGHLIGHT' | 'MERGE' | 'CHERRY_PICK';

export interface Commit {
  id: string;
  message: string;
  seq: number;
  type: number;
  tags: string[] | undefined;
  parents: (string | null)[];
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
  tags?: string[];
  parent: string;
}

export type DiagramOrientation = 'LR' | 'TB';
