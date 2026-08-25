/**
 * Assembles the kanban {@link KanbanAST} from the resolved graph plus the source-mapped statements
 * the parser collected, mirroring `usecaseAst.ts`.
 */
import type { KanbanNode } from '../../rendering-util/types.js';
import type {
  KanbanAST,
  KanbanGraphGroup,
  KanbanGraphNode,
  KanbanGraphStatement,
  KanbanMetadataOccurrence,
  Span,
} from './kanbanTypes.js';

export interface KanbanModelReader {
  getData: () => { nodes: KanbanNode[] };
}

function graphNode(node: KanbanNode): KanbanGraphNode {
  const attrs: Record<string, unknown> = { level: node.level };
  for (const key of ['icon', 'assigned', 'ticket', 'priority'] as const) {
    if (node[key] !== undefined) {
      attrs[key] = node[key];
    }
  }
  if (node.parentId !== undefined) {
    attrs.parentId = node.parentId;
  }
  // No `classes` here: `getData` does not carry `cssClasses` through to either sections or items,
  // so a `:::` assignment never reaches the rendered graph. The `classAssign` statements record
  // it with its source span instead.
  return {
    ...(node.label === undefined ? {} : { label: node.label }),
    ...(node.shape === undefined ? {} : { shape: node.shape }),
    attrs,
  };
}

export const buildKanbanAST = (
  model: KanbanModelReader,
  source: string,
  headerSpan: Span,
  statements: KanbanGraphStatement[]
): KanbanAST => {
  const { nodes: layoutNodes } = model.getData();

  // Children are collected in one pass; scanning per group would be O(sections x nodes).
  const childIds = new Map<string, string[]>();
  for (const node of layoutNodes) {
    if (node.parentId !== undefined) {
      const siblings = childIds.get(node.parentId);
      if (siblings) {
        siblings.push(node.id);
      } else {
        childIds.set(node.parentId, [node.id]);
      }
    }
  }

  const nodes: Record<string, KanbanGraphNode> = {};
  const groups: Record<string, KanbanGraphGroup> = {};
  for (const node of layoutNodes) {
    nodes[node.id] = graphNode(node);
    if (node.isGroup) {
      groups[node.id] = {
        ...(node.label === undefined ? {} : { title: node.label }),
        nodes: childIds.get(node.id) ?? [],
        attrs: { kind: 'kanbanSection', level: node.level },
      };
    }
  }

  return {
    version: 1,
    diagramType: 'kanban',
    source,
    header: { keyword: 'kanban', span: headerSpan },
    nodes,
    edges: [],
    groups,
    statements,
  };
};

/**
 * Best-effort spans for the `key: value` pairs inside an `@{ … }` block.
 *
 * The block itself is handed to a YAML parser, so this is a read-model for editors rather than a
 * second parse: it splits on top-level commas and newlines, ignores anything it cannot read as a
 * pair, and never affects what the diagram renders.
 *
 * Separators inside a `[…]` flow sequence do not split, so `tags: [a, b]` stays one occurrence.
 * Unbalanced brackets need no handling: js-yaml rejects them ("missed comma between flow
 * collection entries"), so such a block throws in `addNode` and no read-model is ever produced. A
 * flow *mapping* likewise cannot reach here — the lexer ends the block at the first `}`.
 */
export function metadataOccurrences(
  source: string,
  bodyStart: number,
  bodyEnd: number
): KanbanMetadataOccurrence[] {
  const occurrences: KanbanMetadataOccurrence[] = [];
  let quote: string | undefined;
  let itemStart = bodyStart;
  let depth = 0;

  const flush = (end: number) => {
    const raw = source.slice(itemStart, end);
    const trimmedStart = itemStart + (raw.length - raw.trimStart().length);
    const trimmedEnd = end - (raw.length - raw.trimEnd().length);
    if (trimmedEnd <= trimmedStart) {
      return;
    }
    const colon = source.indexOf(':', trimmedStart);
    if (colon === -1 || colon >= trimmedEnd) {
      return;
    }
    const key = source.slice(trimmedStart, colon).trim();
    if (!key) {
      return;
    }
    const value = source.slice(colon + 1, trimmedEnd);
    const valueStart = colon + 1 + (value.length - value.trimStart().length);
    occurrences.push({
      key,
      span: [trimmedStart, trimmedEnd],
      keySpan: [trimmedStart, trimmedStart + key.length],
      valueSpan: [valueStart, trimmedEnd],
    });
  };

  for (let index = bodyStart; index < bodyEnd; index++) {
    const character = source[index];
    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[' || character === ']') {
      depth += character === '[' ? 1 : -1;
      continue;
    }
    if (depth === 0 && (character === ',' || character === '\n')) {
      flush(index);
      itemStart = index + 1;
    }
  }
  flush(bodyEnd);
  return occurrences;
}
