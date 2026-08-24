import type kanbanDb from './kanbanDb.js';

export type KanbanDB = typeof kanbanDb;

/** A half-open `[start, end)` range of offsets into the parsed source text. */
export type Span = [start: number, end: number];

export interface KanbanGraphNode {
  label?: string;
  shape?: string;
  classes?: string[];
  attrs?: Record<string, unknown>;
}

export interface KanbanGraphGroup {
  title?: string;
  nodes: string[];
  attrs?: Record<string, unknown>;
}

/** One `key: value` pair inside an `@{ … }` block, with spans for in-place edits. */
export interface KanbanMetadataOccurrence {
  key: string;
  span: Span;
  keySpan: Span;
  valueSpan: Span;
}

/**
 * Where a node was written. `id` is the identifier as it appears in the source, which is empty
 * for a shape with no explicit id — the db derives an id in that case, but only the source text
 * has a span worth pointing at.
 */
export interface KanbanNodeOccurrence {
  id: string;
  span: Span;
  idSpan?: Span;
  labelSpan?: Span;
  defines?: boolean;
  metadataSpan?: Span;
  metadata?: KanbanMetadataOccurrence[];
}

export interface KanbanGraphStatement {
  kind: 'node' | 'icon' | 'classAssign' | 'comment' | 'blank';
  span: Span;
  /** Indentation width, which is what decides whether a node is a column or a card. */
  level?: number;
  nodes?: KanbanNodeOccurrence[];
  /** The `::icon(…)` value or the `:::` class list, without its delimiters. */
  value?: string;
  valueSpan?: Span;
}

/**
 * A read-model of a parsed kanban diagram: the resolved graph plus a source-mapped record of the
 * statements that produced it. Built by the parser and kept on the db; nothing in the rendering
 * path reads it.
 */
export interface KanbanAST {
  version: 1;
  diagramType: 'kanban';
  source: string;
  header: {
    keyword: 'kanban';
    span: Span;
  };
  nodes: Record<string, KanbanGraphNode>;
  edges: never[];
  groups: Record<string, KanbanGraphGroup>;
  statements: KanbanGraphStatement[];
}
