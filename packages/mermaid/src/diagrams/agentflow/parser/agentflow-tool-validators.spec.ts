/**
 * Shape-based tool model (v0.8.1).
 *
 * Per AGENTFLOW-SYNTAX.md §10, a tool definition is any named node whose
 * resolved shape is `subroutine` (canonical) — accessible via the alias
 * `tool` plus historical aliases `subprocess`, `subproc`,
 * `framed-rectangle`.
 *
 * This spec covers:
 *   - `isToolDefinition(vertex)` and `getTools()` derived accessors
 *   - `vertexKind: 'tool'` surfaced in `getSemanticModel()`
 *
 * The win-pane instance machinery from v0.7.0 is removed in v0.8.1; reuse
 * happens through MCP-callable `action` nodes instead. The `requires` /
 * `deny` / `permits` capability metadata is also removed.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow shape-based tool model', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  describe('tool recognition by shape', () => {
    it('recognises `shape: subroutine` (canonical) as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subroutine, returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const search = db.getVertices().get('search')!;
      expect(db.isToolDefinition(search)).toBe(true);
    });

    it('recognises the alias `tool` as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: tool }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const search = db.getVertices().get('search')!;
      expect(db.isToolDefinition(search)).toBe(true);
    });

    it('recognises the alias `subprocess` as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subprocess }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const search = db.getVertices().get('search')!;
      expect(db.isToolDefinition(search)).toBe(true);
    });

    it('does NOT recognise a default-shape node as a tool', () => {
      agentflow.parser.parse(`agentflow TB
  plain["plain node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const plain = db.getVertices().get('plain')!;
      expect(db.isToolDefinition(plain)).toBe(false);
    });

    it('does NOT recognise an input / action node as a tool', () => {
      agentflow.parser.parse(`agentflow TB
  i["i"]
  i@{ shape: input }
  h["h"]
  h@{ shape: action }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(db.isToolDefinition(db.getVertices().get('i')!)).toBe(false);
      expect(db.isToolDefinition(db.getVertices().get('h')!)).toBe(false);
    });

    it('`getTools()` returns all tool-shaped vertices', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: subroutine }
  b["b"]
  b@{ shape: tool }
  c["c"]
  d["d"]
  d@{ shape: framed-rectangle }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const tools = db
        .getTools()
        .map((v) => v.id)
        .sort();
      expect(tools).toEqual(['a', 'b', 'd']);
    });
  });

  describe('semantic model surfaces vertexKind', () => {
    it('tool nodes get vertexKind: "tool" in getSemanticModel()', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: tool, returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const search = model.vertices.find((v) => v.id === 'search')!;
      expect(search.vertexKind).toBe('tool');
      expect(search.metadata).toMatchObject({
        returns: 'Result',
      });
    });

    it('alias-shaped tools also surface vertexKind: "tool"', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: subprocess }
  b["b"]
  b@{ shape: framed-rectangle }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      expect(model.vertices.find((v) => v.id === 'a')!.vertexKind).toBe('tool');
      expect(model.vertices.find((v) => v.id === 'b')!.vertexKind).toBe('tool');
    });
  });

  describe('tool retry / cache metadata still parses', () => {
    it('retry + cache survive on a tool', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: tool, retry: 3, cache: "24h", returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const search = db.getVertices().get('search')!;
      expect(search.metadata?.retry).toBe(3);
      expect(search.metadata?.cache).toBe('24h');
      expect(search.metadata?.returns).toBe('Result');
    });
  });
});
