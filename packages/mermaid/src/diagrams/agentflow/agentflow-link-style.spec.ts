/**
 * `linkStyle <n>` and `linkStyle <n> interpolate <curve>` both take an edge
 * index. `updateLink` rejected an out-of-range index with an actionable
 * message; `updateLinkInterpolate` indexed straight into the array and surfaced
 * `TypeError: Cannot set properties of undefined` instead.
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

const oneEdge = `agentflow-beta TB
  a["Alpha"]
  b["Beta"]
  a --> b`;

describe('linkStyle index bounds', () => {
  it('rejects an out-of-range index for interpolate with the bounds message', () => {
    const db = parse(oneEdge);
    expect(() => db.updateLinkInterpolate([99], 'basis')).toThrow(
      /index 99 for linkStyle is out of bounds/
    );
  });

  it('rejects an out-of-range index for style with the same message', () => {
    const db = parse(oneEdge);
    expect(() => db.updateLink([99], ['stroke:red'])).toThrow(
      /index 99 for linkStyle is out of bounds/
    );
  });

  it('still applies interpolate at a valid index', () => {
    const db = parse(oneEdge);
    db.updateLinkInterpolate([0], 'basis');
    expect(db.getEdges()[0].interpolate).toBe('basis');
  });

  it('still applies the default interpolate', () => {
    const db = parse(oneEdge);
    db.updateLinkInterpolate(['default'], 'basis');
    expect(db.getEdges().defaultInterpolate).toBe('basis');
  });
});
