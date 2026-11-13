// Trailing commas in multi-line `@{ … }` metadata bodies (issue #82 follow-up).
//
// Single-line bodies are brace-wrapped into a YAML flow mapping, which already
// tolerates a trailing comma. Multi-line bodies are parsed as block YAML,
// where a line-trailing comma is a syntax error — the DB retries the parse
// with line-trailing commas stripped, so the comma-separated style works both
// with and without trailing commas. Commas that are content (inside quoted
// scalars, flow collections, or block scalar bodies) must survive.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

describe('trailing commas in multi-line @{ } metadata', () => {
  it('inline connector: every line comma-terminated', () => {
    const db = parse(`agentflow-beta TB
  connector github["GitHub"]@{
    protocol: "mcp",
    transport: "stdio",
  }`);
    const c = db.getConnectors()[0];
    expect(c.metadata).toMatchObject({ protocol: 'mcp', transport: 'stdio' });
  });

  it('inline connector: mixed lines with and without commas', () => {
    const db = parse(`agentflow-beta TB
  connector github["GitHub"]@{
    protocol: "mcp",
    endpoint: "https://api.github.com"
    token_required: true,
  }`);
    expect(db.getConnectors()[0].metadata).toMatchObject({
      protocol: 'mcp',
      endpoint: 'https://api.github.com',
      token_required: true,
    });
  });

  it('standalone vertex attachment with trailing commas', () => {
    const db = parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    description: "alpha node",
    instruction: "be careful",
  }`);
    expect(db.getVertices().get('a')?.metadata).toMatchObject({
      description: 'alpha node',
      instruction: 'be careful',
    });
  });

  it('flow header inline metadata with trailing commas', () => {
    const db = parse(`agentflow-beta TB
  flow f["Flow"]@{
    model: "claude-opus-4",
    memory: "shared",
  }
    a --> b
  end`);
    const sg = db.getSubGraphs().find((s) => s.id === 'f');
    expect(sg?.metadata).toMatchObject({ model: 'claude-opus-4', memory: 'shared' });
  });

  it('strips a comma sitting before a line-trailing comment', () => {
    const db = parse(`agentflow-beta TB
  connector github["GitHub"]@{
    protocol: "mcp", # main protocol
    transport: "stdio"
  }`);
    expect(db.getConnectors()[0].metadata).toMatchObject({
      protocol: 'mcp',
      transport: 'stdio',
    });
  });

  it('keeps commas inside block scalar content', () => {
    const db = parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    instruction: |
      Do a thing,
      then stop
    protocol: "mcp",
  }`);
    const md = db.getVertices().get('a')?.metadata;
    expect(md?.instruction).toBe('Do a thing,\nthen stop\n');
    expect(md?.protocol).toBe('mcp');
  });

  it('keeps separator commas in flow sequences spanning lines', () => {
    const db = parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    tools: ["read",
      "write"],
    protocol: "mcp"
  }`);
    const md = db.getVertices().get('a')?.metadata;
    expect(md?.tools).toEqual(['read', 'write']);
    expect(md?.protocol).toBe('mcp');
  });

  it('keeps a comma ending a line inside a single-quoted scalar', () => {
    const db = parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    note: 'first,
      second',
    protocol: "mcp"
  }`);
    const md = db.getVertices().get('a')?.metadata;
    // YAML folds the quoted scalar's newline into a space.
    expect(md?.note).toBe('first, second');
    expect(md?.protocol).toBe('mcp');
  });

  it('parses a full diagram around a trailing-comma connector declaration', () => {
    const db = parse(`agentflow-beta LR
  connector github["GitHub API"]@{
    protocol: "http",
    endpoint: "https://api.github.com",
    token_required: true,
  }

  query["query"]
  query@{ shape: input }
  fetch_issues["fetch_issues"]
  fetch_issues@{ shape: tool, connectorRef: "github.list_issues" }
  query --> fetch_issues`);
    expect(db.getConnectors()[0].metadata).toMatchObject({
      protocol: 'http',
      endpoint: 'https://api.github.com',
      token_required: true,
    });
    expect(db.getVertices().get('fetch_issues')?.metadata?.connectorRef).toBe('github.list_issues');
    expect(db.getEdges()).toHaveLength(1);
  });

  it('single-line form still tolerates a trailing comma', () => {
    const db = parse(`agentflow-beta TB
  connector github["GitHub"]@{ protocol: "mcp", }`);
    expect(db.getConnectors()[0].metadata?.protocol).toBe('mcp');
  });

  it('invalid YAML that commas cannot fix still throws', () => {
    expect(() =>
      parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    protocol: *undefined_alias,
  }`)
    ).toThrow();
  });
});
