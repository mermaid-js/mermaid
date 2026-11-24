// Regression spec for issue #59 — sibling subgraph span overlap.
//
// A flow's mapping `endLine` used to bleed past its own `end` into the next
// sibling's header line, because the `end` lexer token greedily consumed
// trailing newlines (`"end"\b\s*`), inflating its location. The token now
// only eats spaces/tabs (`"end"\b[ \t]*`), so the `end` keyword's line is its
// true end.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

describe('issue #59: sibling subgraph span overlap', () => {
  it('two sibling flows do not overlap on the boundary line', () => {
    const db = parse(`agentflow-beta TB

  flow f2["F2"]
    a --> b
  end

  flow f1["F1"]
    c --> d
  end`);
    const f2 = db.getElementById('f2');
    const f1 = db.getElementById('f1');
    expect(f2?.position).toMatchObject({ startLine: 3, endLine: 5 });
    expect(f1?.position).toMatchObject({ startLine: 7, endLine: 9 });
    // The defining assertion: f2 must end strictly before f1 begins.
    expect(f2!.position.endLine).toBeLessThan(f1!.position.startLine);
  });

  it('a nested inner flow ends at its own `end`, not the parent content', () => {
    const db = parse(`agentflow-beta TB
  flow outer["Outer"]
    flow inner["Inner"]
      a --> b
    end
    c --> d
  end`);
    const inner = db.getElementById('inner');
    const outer = db.getElementById('outer');
    // inner `end` is line 5; the parent's `c --> d` (line 6) must NOT be inside inner.
    expect(inner?.position).toMatchObject({ startLine: 3, endLine: 5 });
    expect(outer?.position).toMatchObject({ startLine: 2, endLine: 7 });
  });

  it('a flow whose `end` is the last line (no trailing newline) still parses and maps', () => {
    const db = parse(`agentflow-beta TB
  flow f["F"]
    a --> b
  end`);
    const f = db.getElementById('f');
    expect(f?.position).toMatchObject({ startLine: 2, endLine: 4 });
    // Sanity: parsing was not broken by the lexer change.
    expect(db.getVertices().has('a')).toBe(true);
    expect(db.getVertices().has('b')).toBe(true);
  });
});

// `getElementAtPosition` returns the innermost candidate. The ranking compares
// [lineSpan, columnSpan] lexicographically; it used to fold them into
// `lineSpan * 1000 + columnSpan`, which cannot order a 1-line/1200-column span
// against a 2-line/3-column span correctly and produces a negative column term
// whenever a span crosses a line break. No diagram the current grammar accepts
// puts those two shapes at the same point, so this is a latent ordering bug
// rather than a reproducible one — these tests pin the behaviour the exact
// comparison guarantees.
describe('innermost-match ranking', () => {
  it('prefers the tighter span when a nested container shares the point', () => {
    const db = parse(`agentflow-beta TB
  flow outer["Outer"]
    flow inner["Inner"]
      a["Alpha"]
    end
  end`);
    expect(db.getElementAtPosition(4, 8)?.id).toBe('a');
    // One column left of the vertex, only the containers cover the point.
    expect(db.getElementAtPosition(3, 5)?.id).toBe('inner');
  });

  it('still resolves the innermost element when a label is wider than 1000 columns', () => {
    const wide = 'W'.repeat(1200);
    const db = parse(`agentflow-beta TB
  flow outer["Outer"]
    a["${wide}"] --> b["B"]
  end`);
    expect(db.getElementAtPosition(3, 10)?.id).toBe('a');
    expect(db.getElementAtPosition(3, 1216)?.id).toBe('b');
  });
});
