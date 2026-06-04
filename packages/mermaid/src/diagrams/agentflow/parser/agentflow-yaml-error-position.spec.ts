// Regression spec for issue #56 part 2 — YAML errors inside `<id>@{ ... }`
// blocks must report absolute source coordinates, not block-relative ones.
//
// The DB hands the `@{ ... }` body to js-yaml wrapped either as a synthetic
// `{\n … \n}` (single-line form) or as the verbatim multi-line body. js-yaml's
// `(R:C)` reference, `mark`, and the `N |` excerpt prefixes therefore count
// from the start of that buffer, not the line the user sees. `addVertex` now
// catches the failure and, using the `shapeData` symbol's JISON location plus
// the frontmatter offset, rewrites the message, `mark`, and a JISON-style
// `hash.loc` into source space.
//
// As with the blank-line-fold spec, these call the default export's `parse`
// (the production wrapper) so the line numbers reflect what the editor sees.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

interface YamlPositionError extends Error {
  mark?: { line: number; column: number };
  hash?: { line: number; loc: Record<string, number> };
}

const parseExpectingError = (text: string, frontmatterOffset = 0): YamlPositionError => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  if (frontmatterOffset) {
    agentflow.parser.yy.setFrontmatterLineOffset(frontmatterOffset);
  }
  try {
    agentflow.parse(text);
  } catch (e) {
    return e as YamlPositionError;
  }
  throw new Error('expected the parse to throw a YAML error');
};

describe('issue #56 part 2: YAML @{ } errors report source coordinates', () => {
  it('single-line block: maps (block 2:16) to the source line of the @{ } block', () => {
    // `content_ref@{ ... }` is on source line 3 (line 2 is blank).
    const err = parseExpectingError(
      'agentflow TB\n\n  content_ref@{ shape: procs,* type: "BilingualContent" }'
    );
    expect(err.message).toContain('name of an alias node must contain at least one character');
    // Source line 3, column 31 — not the block-relative (2:16).
    expect(err.message).toContain('(3:31)');
    expect(err.message).not.toContain('(2:16)');
    // Excerpt is renumbered into source space (no synthetic `{`/`}` rows).
    expect(err.message).toContain(' 3 | ');
    expect(err.message).not.toMatch(/^ *[12] \| {/m);
    // Structured coordinates for editors that read them directly.
    expect(err.hash?.loc.first_line).toBe(3);
    expect(err.hash?.loc.first_column).toBe(30);
    expect(err.hash?.loc.last_column).toBe(31);
    // mark is rewritten to 0-based source space.
    expect(err.mark?.line).toBe(2);
    expect(err.mark?.column).toBe(30);
  });

  it('multi-line block: maps the body line into source space and keeps the tab caret', () => {
    // The malformed body is on source line 6 (the `@{` opens on line 5).
    const err = parseExpectingError(
      'agentflow\nflow f["F"]\n  a["A"]\n  b["B"]\n  c["C"]@{\n\tshape: rounded\n  }\nend'
    );
    expect(err.message).toContain('(6:7)');
    expect(err.message).not.toContain('(2:7)');
    // Body lines are verbatim source lines, renumbered 5/6/7.
    expect(err.message).toContain(' 6 | →shape: rounded');
    expect(err.hash?.loc.first_line).toBe(6);
    expect(err.hash?.loc.first_column).toBe(6);
  });

  it('multi-line block: error on the @{ line itself maps with the content-column offset', () => {
    // The block opens on source line 2 and spans to line 3, so the buffer is
    // multi-line and the offending `*` sits on buffer line 0 — the tail of the
    // `@{` line. That line's columns are offset by the `@{ ` prefix, unlike the
    // verbatim later lines.
    const err = parseExpectingError('agentflow TB\n  a["A"]@{ x: *,\n    y: 1 }');
    expect(err.message).toContain('(2:16)');
    expect(err.message).not.toContain('(1:');
    // The excerpt shows the source `@{` line, renumbered to 2.
    expect(err.message).toContain(' 2 |  x: *,');
    expect(err.hash?.loc.first_line).toBe(2);
    expect(err.hash?.loc.first_column).toBe(15);
  });

  it('composes with the blank-line fold fix: a block below a @{ }+blank keeps its source line', () => {
    // `b@{ ... }` is on source line 4. With the fold bug this reported line 3.
    const err = parseExpectingError(
      'agentflow TB\n  a["A"]@{ shape: rounded }\n\n  b["B"]@{ shape: procs,* x: 1 }'
    );
    expect(err.hash?.loc.first_line).toBe(4);
    expect(err.message).toContain('(4:');
  });

  it('applies the frontmatter line offset on top of the block position', () => {
    // Same block as the single-line case (parse line 3), shifted by 2
    // frontmatter lines → source line 5.
    const err = parseExpectingError(
      'agentflow TB\n\n  content_ref@{ shape: procs,* type: "BilingualContent" }',
      2
    );
    expect(err.hash?.loc.first_line).toBe(5);
    expect(err.message).toContain('(5:31)');
  });

  it('does not touch non-YAML errors raised after a block parses', () => {
    // A well-formed block with an invalid shape throws a plain Error from
    // addVertex *after* yaml.load succeeds — it must pass through unchanged,
    // with no (R:C) reference or hash attached by the YAML translator.
    const err = parseExpectingError('agentflow TB\n  a["A"]@{ shape: Rounded }');
    expect(err.message).toContain('No such shape');
    expect(err.message).not.toMatch(/\(\d+:\d+\)/);
    expect(err.hash).toBeUndefined();
  });

  it('a well-formed @{ } block parses without throwing', () => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
    expect(() =>
      agentflow.parse('agentflow TB\n  a["A"]@{ shape: rounded }\n\n  b["B"]')
    ).not.toThrow();
  });
});
