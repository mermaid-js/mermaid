// Regression spec for issue #83 — an empty / whitespace-only `@{ ... }`
// metadata block must be a no-op, never a fatal TypeError.
//
// A whitespace-only YAML document loads as `null` (not `{}`), so the
// multi-line branch of the metadata handler used to hand `doc = null` to the
// vertex branch, whose `doc !== undefined` guard let it through to a
// `doc.shape` read: "Cannot read properties of null (reading 'shape')" — a
// fatal with no source position that wiped the whole diagram. Single-line `@{}` already
// behaved (its brace-wrap loads as `{}`); multi-line must match it.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(text);
  const db = agentflow.parser.yy as AgentFlowDB;
  db.getData();
  return db;
};

const vertex = (db: AgentFlowDB, id: string) => db.getVertices().get(id);

describe('issue #83: empty/whitespace @{ } metadata block', () => {
  it('multi-line empty block @{\\n} parses without crashing (the reported repro)', () => {
    const db = parse(`agentflow-beta TB
  newtask["Example"]@{
}`);
    const v = vertex(db, 'newtask');
    expect(v).toBeDefined();
    expect(v?.text).toBe('Example');
  });

  it('whitespace-only multi-line block parses without crashing', () => {
    const db = parse(`agentflow-beta TB
  a["A"]@{

}`);
    expect(vertex(db, 'a')).toBeDefined();
  });

  it('whitespace-only single-line block @{   } parses without crashing', () => {
    const db = parse(`agentflow-beta TB
  a["A"]@{   }`);
    expect(vertex(db, 'a')).toBeDefined();
  });

  it('multi-line empty block behaves identically to single-line @{}', () => {
    const single = parse(`agentflow-beta TB
  a["A"]@{}`);
    const multi = parse(`agentflow-beta TB
  a["A"]@{
}`);
    expect(vertex(multi, 'a')?.metadata).toEqual(vertex(single, 'a')?.metadata);
    expect(vertex(multi, 'a')?.type).toEqual(vertex(single, 'a')?.type);
  });

  it('empty multi-line block on a flow parses and matches single-line @{} behaviour', () => {
    const single = parse(`agentflow-beta TB
  flow f["F"]
    a --> b
  end
  f@{}`);
    const multi = parse(`agentflow-beta TB
  flow f["F"]
    a --> b
  end
  f@{
}`);
    const flowOf = (db: AgentFlowDB) => db.getSubGraphs().find((s) => s.id === 'f');
    expect(flowOf(multi)).toBeDefined();
    expect(flowOf(multi)?.metadata).toEqual(flowOf(single)?.metadata);
    expect(vertex(multi, 'f')).toEqual(vertex(single, 'f'));
  });

  it('a genuinely malformed block still throws a positioned YAML error, not a TypeError', () => {
    let err: Error | undefined;
    try {
      parse(`agentflow-beta TB
  a["A"]@{
:
}`);
    } catch (e) {
      err = e as Error;
    }
    expect(err).toBeDefined();
    expect(err).not.toBeInstanceOf(TypeError);
    // rethrowMetadataYamlError bakes absolute source coordinates into the message
    expect(err?.message).toMatch(/\(\d+:\d+\)/);
  });

  it('a non-string shape value is rejected as an unknown shape, not a TypeError', () => {
    let err: Error | undefined;
    try {
      parse(`agentflow-beta TB
  a["A"]@{ shape: 123 }`);
    } catch (e) {
      err = e as Error;
    }
    expect(err).toBeDefined();
    expect(err).not.toBeInstanceOf(TypeError);
    expect(err?.message).toMatch(/No such shape/);
  });

  it('a valid metadata block is unaffected', () => {
    const db = parse(`agentflow-beta TB
  a["A"]@{ shape: task }`);
    // `task` is a v0.8.1 alias resolved to the canonical shape id
    expect(vertex(db, 'a')?.type).toBe('roundedRect');
  });
});
