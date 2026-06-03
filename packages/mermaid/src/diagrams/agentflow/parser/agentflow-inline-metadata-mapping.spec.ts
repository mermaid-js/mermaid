// Regression spec for issue #60 — inline annotation block mapping.
//
// For `id["..."]@{ ... }`, the node's element mapping previously spanned only
// the declaration line, so editor cursors inside the `@{ ... }` block fell
// through to the containing flow. The mapping must now span the whole block
// (through the closing `}`).
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

describe('issue #60: inline metadata block mapping', () => {
  it('inline id["..."]@{ ... } spans the block, so cursors inside resolve to the node', () => {
    const db = parse(`agentflow TB
  flow f["F"]
    a["Alpha"]@{
      instruction: "do the thing"
    }
  end`);
    const a = db.getElementById('a');
    expect(a?.type).toBe('vertex');
    // Declaration is line 3; the closing `}` is line 5.
    expect(a?.position.startLine).toBe(3);
    expect(a?.position.endLine).toBe(5);
    // A cursor on the block body line (4) resolves to the node, not the flow.
    const hit = db.getElementAtPosition(4, 8);
    expect(hit?.id).toBe('a');
    expect(hit?.type).toBe('vertex');
  });

  it('inline block on an edge destination (a --> b["..."]@{ ... }) spans the block', () => {
    const db = parse(`agentflow TB
  x --> b["Beta"]@{
    instruction: "hand off"
  }`);
    const b = db.getElementById('b');
    expect(b?.type).toBe('vertex');
    expect(b?.position.startLine).toBe(2);
    expect(b?.position.endLine).toBe(4);
    const hit = db.getElementAtPosition(3, 6);
    expect(hit?.id).toBe('b');
  });

  it('single-line inline metadata keeps the node on its declaration line', () => {
    const db = parse(`agentflow TB
  a["A"]
  b["B"]@{ shape: rect }
  a --> b`);
    const b = db.getElementById('b');
    expect(b?.position.startLine).toBe(3);
    expect(b?.position.endLine).toBe(3);
  });

  it('a node without inline metadata is unaffected (decl-only span)', () => {
    const db = parse(`agentflow TB
  a["Alpha"]
  a --> b`);
    const a = db.getElementById('a');
    expect(a?.position.startLine).toBe(2);
    expect(a?.position.endLine).toBe(2);
  });
});
