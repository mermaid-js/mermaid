/**
 * Agentflow's shape catalogue (§4.3) is the six domain shapes. The icon and
 * image shapes are outside it.
 *
 * The DB used to inherit flowchart's icon/image plumbing: `addVertex` promoted
 * `icon`, `img`, `form`, `pos`, `w` and `h` onto the vertex and
 * `getTypeFromVertex` turned them into `icon` / `iconCircle` / `iconSquare` /
 * `iconRounded` / `imageSquare`. None of those are in `ALLOWED_SHAPES`, so
 * every one was replaced with the default and reported as SHAPE_UNSUPPORTED
 * before reaching the renderer — roughly 30 lines that could only ever produce
 * a warning. For a bare `@{ img: … }` the warning was actively confusing: it
 * named `imageSquare`, a shape the author never wrote.
 *
 * The keys stay authorable; they are carried as ordinary metadata.
 */
import { describe, expect, it } from 'vitest';
import { AgentFlowDB } from './agentflowDb.js';
import agentflow from './parser/agentflowParser.js';

const parse = (text: string) => {
  const db = new AgentFlowDB();
  agentflow.parser.yy = db;
  db.clear();
  db.setGen('gen-2');
  agentflow.parser.parse(text);
  return db;
};

const nodeFor = (source: string, id: string) => {
  const db = parse(source);
  const { nodes } = db.getData();
  return { db, node: nodes.find((n) => n.id === id) };
};

describe('agentflow shape catalogue', () => {
  it('carries icon metadata through without selecting an icon shape', () => {
    const { db, node } = nodeFor(
      `agentflow-beta TB
  a["A"]@{ icon: "fa:bell", form: circle }
  b["B"]
  a --> b`,
      'a'
    );

    expect(node?.shape).toBe('roundedRect');
    expect(node?.metadata).toMatchObject({ icon: 'fa:bell', form: 'circle' });
    // No shape was authored, so nothing to complain about.
    expect(db.getDiagnostics()).toStrictEqual([]);
  });

  it('carries image metadata through without selecting an image shape', () => {
    const { db, node } = nodeFor(
      `agentflow-beta TB
  a["A"]@{ img: "https://example.com/x.png", w: 40, h: 40 }
  b["B"]
  a --> b`,
      'a'
    );

    expect(node?.shape).toBe('roundedRect');
    expect(node?.metadata).toMatchObject({ img: 'https://example.com/x.png', w: 40, h: 40 });
    expect(db.getDiagnostics()).toStrictEqual([]);
  });

  it('keeps the label when icon or image metadata is present', () => {
    const { node } = nodeFor(
      `agentflow-beta TB
  a["Real label"]@{ icon: "fa:bell" }
  b["B"]
  a --> b`,
      'a'
    );
    // The old icon path blanked the label whenever the metadata carried none.
    expect(node?.label).toBe('Real label');
  });

  it('still reports an explicitly authored out-of-catalogue shape', () => {
    const { db, node } = nodeFor(
      `agentflow-beta TB
  a["A"]@{ shape: icon, icon: "fa:bell" }
  b["B"]
  a --> b`,
      'a'
    );

    expect(node?.shape).toBe('roundedRect');
    // The author did write `shape: icon`, so the warning is about their input.
    expect(db.getDiagnostics().map((d) => d.id)).toContain('SHAPE_UNSUPPORTED');
  });

  it('strips presentation keys from the semantic model', () => {
    const db = parse(`agentflow-beta TB
  a["A"]@{ icon: "fa:bell", img: "x.png", w: 40, h: 40, description: "kept" }
  b["B"]
  a --> b`);

    const vertex = db.getSemanticModel().vertices.find((v) => v.id === 'a');
    expect(vertex?.metadata).toMatchObject({ description: 'kept' });
    for (const key of ['icon', 'img', 'w', 'h']) {
      expect(vertex?.metadata).not.toHaveProperty(key);
    }
  });

  it('leaves the six domain shapes working', () => {
    const db = parse(`agentflow-beta TB
  t["T"]@{ shape: task }
  o["O"]@{ shape: tool }
  i["I"]@{ shape: input }
  d["D"]@{ shape: decision }
  r["R"]@{ shape: refdoc }
  c["C"]@{ shape: action }
  t --> o --> i --> d --> r --> c`);

    const shapes = Object.fromEntries(db.getData().nodes.map((n) => [n.id, n.shape]));
    expect(shapes).toStrictEqual({
      t: 'roundedRect',
      o: 'subroutine',
      i: 'lean-right',
      d: 'diamond',
      r: 'lin-doc',
      c: 'hexagon',
    });
    expect(db.getDiagnostics()).toStrictEqual([]);
  });
});
