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

/**
 * The grammar hands `linkStyle` positions to the db as the raw `NUM` lexeme, so
 * an index arrives as a string (`'1'`, not `1`). The specs above call the db
 * with numbers and never see that, so these go through the parser.
 */
describe('linkStyle index bounds through the grammar', () => {
  const outOfBounds = (index: string, last: number) =>
    new RegExp(`index ${index} for linkStyle is out of bounds.*between 0 and ${last}`);

  it('rejects a linkStyle index past the last edge with the bounds message', () => {
    expect(() => parse(`${oneEdge}\n  linkStyle 1 stroke:red`)).toThrow(outOfBounds('1', 0));
  });

  it('rejects a linkStyle interpolate index past the last edge with the bounds message', () => {
    expect(() => parse(`${oneEdge}\n  linkStyle 5 interpolate basis`)).toThrow(outOfBounds('5', 0));
  });

  it('names the first bad index when several are given', () => {
    expect(() => parse(`${oneEdge}\n  linkStyle 0,5 stroke:red`)).toThrow(outOfBounds('5', 0));
  });

  it('rejects an index that no integer can represent', () => {
    expect(() => parse(`${oneEdge}\n  linkStyle 99999999999999999999 stroke:red`)).toThrow(
      /out of bounds/
    );
  });

  it('rejects a position that is not an edge index when called directly', () => {
    const db = parse(oneEdge);
    expect(() => db.updateLink(['x'], ['stroke:red'])).toThrow(/index x for linkStyle/);
    expect(() => db.updateLinkInterpolate([-1], 'basis')).toThrow(/index -1 for linkStyle/);
  });

  it('styles the edge a valid index names', () => {
    const db = parse(`${oneEdge}\n  linkStyle 0 stroke:red`);
    expect(db.getEdges()[0].style).toEqual(['stroke:red', 'fill:none']);
  });

  it('applies interpolate to the edge a valid index names', () => {
    const db = parse(`${oneEdge}\n  linkStyle 0 interpolate basis`);
    expect(db.getEdges()[0].interpolate).toBe('basis');
  });

  it('reads an index written with a leading zero as the number it spells', () => {
    const db = parse(`${oneEdge}\n  a --> b\n  linkStyle 01 stroke:red`);
    expect(db.getEdges()[1].style).toEqual(['stroke:red', 'fill:none']);
    expect(db.getEdges()[0].style).toBeUndefined();
  });

  it('styles the default for linkStyle default', () => {
    const db = parse(`${oneEdge}\n  linkStyle default stroke:red`);
    expect(db.getEdges().defaultStyle).toEqual(['stroke:red']);
  });

  it('applies the default interpolate for linkStyle default interpolate', () => {
    const db = parse(`${oneEdge}\n  linkStyle default interpolate basis`);
    expect(db.getEdges().defaultInterpolate).toBe('basis');
  });
});
