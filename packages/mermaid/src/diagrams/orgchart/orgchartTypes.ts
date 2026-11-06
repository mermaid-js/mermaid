import type { DiagramDB } from '../../diagram-api/types.js';

export type OrgNodeKind = 'regular' | 'staff';

export interface OrgNode {
  id: string;
  /** Primary label: role, unit or title. */
  label: string;
  /** Optional secondary label, typically a person's name. */
  secondaryLabel?: string;
  kind: OrgNodeKind;
  parentId?: string;
  /** Regular reporting children; these form the primary hierarchy. */
  children: OrgNode[];
  /** Staff/advisor nodes anchored to this node; they never form a branch. */
  staff: OrgNode[];
}

/** A parsed node line, before it is attached to the hierarchy. */
export interface OrgNodeDeclaration {
  /** Indentation of the line, in columns. */
  indent: number;
  /** 1-based source line, used in validation errors. */
  line: number;
  /** 1-based source column, used in validation errors. */
  column: number;
  kind: OrgNodeKind;
  label: string;
  secondaryLabel?: string;
  /** Explicit id; generated when omitted. */
  id?: string;
}

export interface OrgChartDB extends DiagramDB {
  readonly preserveCommentsWhenParsing: true;
  clear: () => void;
  addNode: (declaration: OrgNodeDeclaration) => void;
  getRoot: () => OrgNode | undefined;
  getNode: (id: string) => OrgNode | undefined;
  getNodes: () => OrgNode[];
  getAccTitle: () => string;
  getAccDescription: () => string;
  getDiagramTitle: () => string;
  setAccDescription: (description: string) => void;
  setAccTitle: (title: string) => void;
  setDiagramTitle: (title: string) => void;
  setFrontmatterLineOffset: (offset: number) => void;
  getFrontmatterLineOffset: () => number;
}
