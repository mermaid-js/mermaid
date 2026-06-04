// Regression spec for issue #56 — parser error/position drift from a
// blank-line fold.
//
// `agentflowParser.parse` normalises trailing whitespace after a closing
// `}` so the grammar's `node shapeData separator` rule still reduces. The
// original normalisation (`/}\s*\n/g` → `}\n`) was too greedy: `\s` matches
// newlines, so a blank line *immediately following* an `@{ ... }` block was
// swallowed. Every position downstream of that fold (element mappings,
// `getData()` edge positions, thrown parse-error line numbers) then drifted
// one line per folded blank line, in folded coordinate space rather than
// source space.
//
// The fix narrows the normalisation to horizontal whitespace (`[^\S\n]`) so
// the blank line — and the newline jison counts for line tracking — survives.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

// NB: call the default export's `parse` (the wrapper that normalises trailing
// whitespace after `}`), not `agentflow.parser.parse` (raw jison). The fold
// lives in the wrapper, so the rest of the suite — which uses the raw parser —
// never exercises it.
const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

describe('issue #56: blank line after @{ } block must not fold source positions', () => {
  it('a blank line directly after an inline @{ } block does not shift the next node', () => {
    // Maintainer repro (a.4 / v0.8.2 grammar). `b` is on source line 5.
    const db = parse(`agentflow
flow f["F"]
  a["A"]@{ shape: rounded }

  b["B"]
end`);
    const b = db.getElementById('b');
    expect(b).toBeDefined();
    expect(b!.position.startLine).toBe(5);
    expect(b!.position.endLine).toBe(5);
  });

  it('the fold accumulates — two blank lines after @{ } would drift by two', () => {
    // `b` is on source line 6.
    const db = parse(`agentflow
flow f["F"]
  a["A"]@{ shape: rounded }


  b["B"]
end`);
    const b = db.getElementById('b');
    expect(b!.position.startLine).toBe(6);
  });

  it('a comment line after an @{ } block is already correct and stays correct', () => {
    // `b` is on source line 5; the comment is not foldable (non-whitespace
    // before the next newline), so this case worked before the fix too.
    const db = parse(`agentflow
flow f["F"]
  a["A"]@{ shape: rounded }
  %% a note
  b["B"]
end`);
    const b = db.getElementById('b');
    expect(b!.position.startLine).toBe(5);
  });

  it('an edge after a @{ }+blank block keeps its source line', () => {
    // `a --> c` is on source line 5.
    const db = parse(`agentflow TB
  a["A"]@{ shape: rounded }

  c["C"]
  a --> c`);
    const edge = db.getElementMappings().find((m) => m.type === 'edge');
    expect(edge).toBeDefined();
    expect(edge!.position.startLine).toBe(5);
  });

  it('a thrown parse error reports the source line, not a folded line', () => {
    // Two `@{ }`+blank blocks sit above the malformed line. The stray `"]`
    // makes `c` a syntax error on source line 6. Pre-fix the two folded blanks
    // dropped this to "line 4" (−2).
    let line: number | undefined;
    try {
      parse(`agentflow TB
  a["A"]@{ shape: rounded }

  b["B"]@{ shape: rounded }

  c["C"]"]
`);
    } catch (e) {
      const match = /[Pp]arse error on line (\d+)/.exec((e as Error).message);
      line = match ? Number(match[1]) : undefined;
    }
    expect(line).toBe(6);
  });

  it('still strips trailing whitespace after } so the statement reduces', () => {
    // The original purpose of the normalisation: trailing spaces/tabs after a
    // closing `}` must not break `node shapeData separator`. A blank line
    // after the (space-padded) block still must not fold.
    const db = parse('agentflow TB\n  a["A"]@{ shape: rounded }   \n\n  b["B"]');
    expect(db.getElementById('a')).toBeDefined();
    const b = db.getElementById('b');
    expect(b!.position.startLine).toBe(4);
  });
});
