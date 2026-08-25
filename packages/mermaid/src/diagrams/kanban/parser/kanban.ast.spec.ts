// cspell:ignore knsv
/**
 * The source-mapped read-model the parser records on the db. Nothing in the rendering path reads
 * it, so these assertions are what keep it honest — above all that every span slices back to the
 * text it claims to describe.
 */
import kanbanDb from '../kanbanDb.js';
import type { KanbanAST, KanbanGraphStatement, Span } from '../kanbanTypes.js';
import { kanbanFixtures } from './kanban.fixtures.js';
import { parser as kanbanParser } from './kanban.chevrotain.js';

const DIAGRAM = `kanban
  %% a comment
  id1[Todo]
    id2[Create tests]@{ ticket: MC-2038, assigned: 'knsv', priority: 'High' }
    :::hot
    ::icon(bomb)

  Doing
    (no id here)
`;

function parse(text: string): KanbanAST {
  kanbanParser.yy = kanbanDb;
  kanbanDb.clear();
  kanbanParser.parse(text);
  const ast = kanbanDb.getAST();
  if (!ast) {
    throw new Error('parse produced no AST');
  }
  return ast;
}

/** Every span in a statement, so the round-trip check cannot miss one. */
function spansOf(statement: KanbanGraphStatement): Span[] {
  const spans: Span[] = [statement.span];
  if (statement.valueSpan) {
    spans.push(statement.valueSpan);
  }
  for (const node of statement.nodes ?? []) {
    spans.push(node.span);
    for (const span of [node.idSpan, node.labelSpan, node.metadataSpan]) {
      if (span) {
        spans.push(span);
      }
    }
    for (const entry of node.metadata ?? []) {
      spans.push(entry.span, entry.keySpan, entry.valueSpan);
    }
  }
  return spans;
}

describe('kanban AST', () => {
  it('records the header and the resolved graph', () => {
    const ast = parse(DIAGRAM);

    expect(ast.version).toBe(1);
    expect(ast.diagramType).toBe('kanban');
    expect(ast.source).toBe(DIAGRAM);
    expect(ast.header.keyword).toBe('kanban');
    expect(DIAGRAM.slice(...ast.header.span)).toBe('kanban');
    expect(ast.edges).toStrictEqual([]);

    expect(Object.keys(ast.groups)).toStrictEqual(['id1', 'Doing']);
    expect(ast.groups.id1).toStrictEqual({
      title: 'Todo',
      nodes: ['id2'],
      attrs: { kind: 'kanbanSection', level: 2 },
    });
    expect(Object.keys(ast.nodes)).toStrictEqual(['id1', 'id2', 'Doing', 'no id here']);
    expect(ast.nodes.id2).toStrictEqual({
      label: 'Create tests',
      shape: 'kanbanItem',
      attrs: {
        level: 4,
        icon: 'bomb',
        assigned: 'knsv',
        ticket: 'MC-2038',
        priority: 'High',
        parentId: 'id1',
      },
    });
  });

  it('records the statements in source order', () => {
    const ast = parse(DIAGRAM);
    // The empty line after `::icon(bomb)` terminates that statement rather than becoming one of
    // its own — a blank line is only a statement when nothing precedes it on the line before.
    expect(ast.statements.map((statement) => statement.kind)).toStrictEqual([
      'comment',
      'node',
      'node',
      'classAssign',
      'icon',
      'node',
      'node',
    ]);
    expect(ast.statements.map((statement) => statement.level)).toStrictEqual([
      undefined,
      2,
      4,
      4,
      4,
      2,
      4,
    ]);
  });

  it('records every comment, including those folded into a statement terminator', () => {
    // `stop` greedily consumes the terminators after a statement, so all but the first comment in
    // a document reaches the visitor through the terminator rather than as a statement.
    const source = 'kanban\n  %% first\n  a\n  %% second\n  b\n  %% third\n';
    const ast = parse(source);

    expect(ast.statements.map((statement) => statement.kind)).toStrictEqual([
      'comment',
      'node',
      'comment',
      'node',
      'comment',
    ]);
    expect(
      ast.statements
        .filter((statement) => statement.kind === 'comment')
        .map((statement) => source.slice(...statement.span).trim())
    ).toStrictEqual(['%% first', '%% second', '%% third']);
  });

  it('records a comment written above the kanban keyword', () => {
    const ast = parse('%% a preamble\nkanban\n  a\n');
    expect(ast.statements.map((statement) => statement.kind)).toStrictEqual(['comment', 'node']);
  });

  it('folds blank lines between statements into the preceding terminator', () => {
    const ast = parse('kanban\nroot\n A\n \n\n B');
    expect(ast.statements.map((statement) => statement.kind)).toStrictEqual([
      'node',
      'node',
      'node',
    ]);
  });

  it('records a blank line that is the whole document', () => {
    const ast = parse('kanban\n\n');
    expect(ast.statements.map((statement) => statement.kind)).toStrictEqual(['blank']);
    expect(ast.nodes).toStrictEqual({});
  });

  it('spans the id, label and metadata of a node', () => {
    const [, , item] = parse(DIAGRAM).statements;
    const [node] = item.nodes!;

    expect(node.id).toBe('id2');
    expect(node.defines).toBe(true);
    expect(DIAGRAM.slice(...node.span)).toBe(
      "id2[Create tests]@{ ticket: MC-2038, assigned: 'knsv', priority: 'High' }"
    );
    expect(DIAGRAM.slice(...node.idSpan!)).toBe('id2');
    expect(DIAGRAM.slice(...node.labelSpan!)).toBe('Create tests');
    expect(DIAGRAM.slice(...node.metadataSpan!)).toBe(
      "@{ ticket: MC-2038, assigned: 'knsv', priority: 'High' }"
    );
    expect(
      node.metadata!.map((entry) => [
        entry.key,
        DIAGRAM.slice(...entry.keySpan),
        DIAGRAM.slice(...entry.valueSpan),
      ])
    ).toStrictEqual([
      ['ticket', 'ticket', 'MC-2038'],
      ['assigned', 'assigned', "'knsv'"],
      ['priority', 'priority', "'High'"],
    ]);
  });

  it('keeps a flow sequence in one metadata occurrence', () => {
    // A comma inside `[…]` separates sequence entries, not metadata keys. Splitting on it would
    // end the `tags` value span after `x`, so an editor could not rewrite the field.
    const source = 'kanban\n  a@{ tags: [x, y], priority: high }\n';
    const [node] = parse(source).statements[0].nodes!;

    expect(
      node.metadata!.map((entry) => [entry.key, source.slice(...entry.valueSpan)])
    ).toStrictEqual([
      ['tags', '[x, y]'],
      ['priority', 'high'],
    ]);
  });

  it.each([
    ['an id the db rewrites', 'kanban\n  a<b[Label]\n', 'a'],
    ['an id that sanitizes away entirely', 'kanban\n  ["<script>"]\n', 'kbn0'],
    ['an id the db keeps as written', 'kanban\n  a&b[Label]\n', 'a&b'],
  ])('resolves %s against the graph', (_name, source, expected) => {
    // The db sanitizes ids and generates one when that leaves nothing, so an occurrence carrying
    // the raw source text would not find its own node.
    const ast = parse(source);
    const [node] = ast.statements[0].nodes!;

    expect(node.id).toBe(expected);
    expect(ast.nodes[node.id]).toBeDefined();
  });

  it('marks a shape written without an id, but still resolves it', () => {
    const ast = parse(DIAGRAM);
    const [node] = ast.statements.at(-1)!.nodes!;

    expect(node.id).toBe('no id here');
    expect(node.idSpan).toBeUndefined();
    expect(DIAGRAM.slice(...node.labelSpan!)).toBe('no id here');
    expect(ast.nodes[node.id]).toBeDefined();
  });

  it('spans a multi-line metadata block', () => {
    const source = 'kanban\n  root@{\n    icon: star\n    assigned: knsv\n  }\n';
    const [node] = parse(source).statements[0].nodes!;

    expect(source.slice(...node.metadataSpan!)).toBe('@{\n    icon: star\n    assigned: knsv\n  }');
    expect(
      node.metadata!.map((entry) => [entry.key, source.slice(...entry.valueSpan)])
    ).toStrictEqual([
      ['icon', 'star'],
      ['assigned', 'knsv'],
    ]);
  });

  it('keeps every span sliceable across every fixture', () => {
    for (const { name, text } of kanbanFixtures) {
      let ast: KanbanAST;
      try {
        ast = parse(text);
      } catch {
        continue; // Rejected inputs produce no AST; parity covers those.
      }
      for (const statement of ast.statements) {
        for (const [start, end] of spansOf(statement)) {
          expect(
            { name, start, end, valid: start >= 0 && start <= end && end <= text.length },
            `span [${start},${end}) is outside ${name}`
          ).toMatchObject({ valid: true });
        }
      }
    }
  });

  it('is not assembled during the parse, and is assembled only once after it', () => {
    // Building the model re-reads the resolved graph, which re-sanitizes every label. The render
    // path and `mermaid.parse()` must not pay for that.
    kanbanParser.yy = kanbanDb;
    kanbanDb.clear();
    const getData = vi.spyOn(kanbanDb, 'getData');
    try {
      kanbanParser.parse('kanban\n  id1[Todo]\n    id2[Card]\n');
      expect(getData).not.toHaveBeenCalled();

      expect(kanbanDb.getAST()?.nodes.id2).toBeDefined();
      expect(getData).toHaveBeenCalledTimes(1);

      kanbanDb.getAST();
      expect(getData).toHaveBeenCalledTimes(1);
    } finally {
      getData.mockRestore();
    }
  });

  it('is cleared with the rest of the db', () => {
    parse(DIAGRAM);
    expect(kanbanDb.getAST()).toBeDefined();
    kanbanDb.clear();
    expect(kanbanDb.getAST()).toBeUndefined();
  });
});
