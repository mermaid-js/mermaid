/**
 * Shape-based tool model + validators (closes #6 — wave-2 PR 1).
 *
 * Per AGENTFLOW-SYNTAX.md §8 (revision 7), a tool definition is any
 * named node whose resolved shape is `subroutine` (canonical name +
 * accepted aliases `subprocess`, `subproc`, `framed-rectangle`).
 *
 * This PR ships:
 *   - `isToolDefinition(vertex)` and `getTools()` derived accessors
 *   - `vertexKind: 'tool'` surfaced in `getSemanticModel()`
 *   - `validateInstanceTargets()` post-parse validator: every win-pane
 *     instance whose `def` resolves to a node MUST resolve to a tool
 *     definition; non-tool target emits `INSTANCE_KIND_MISMATCH`.
 *
 * Out of scope (handled in PR 4):
 *   - Missing `def` (`INSTANCE_DEF_MISSING`)
 *   - Cyclic `def` chains (`INSTANCE_DEF_CYCLE`)
 *   - Kind validation for the other four instance shapes
 *     (`tag-rect` → agent, `delay` → flow, `lin-rect` → skill,
 *     `curv-trap` → directive)
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

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  describe('tool recognition by shape', () => {
    it('recognises `shape: subroutine` as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subroutine, returns: "Result" }`);
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

    it('recognises the alias `subproc` as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subproc }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const search = db.getVertices().get('search')!;
      expect(db.isToolDefinition(search)).toBe(true);
    });

    it('recognises the alias `framed-rectangle` as a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: framed-rectangle }`);
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

    it('does NOT recognise a doc/lean-right/hex node as a tool', () => {
      agentflow.parser.parse(`agentflow TB
  d["d"]
  d@{ shape: doc }
  i["i"]
  i@{ shape: lean-right }
  h["h"]
  h@{ shape: hex }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(db.isToolDefinition(db.getVertices().get('d')!)).toBe(false);
      expect(db.isToolDefinition(db.getVertices().get('i')!)).toBe(false);
      expect(db.isToolDefinition(db.getVertices().get('h')!)).toBe(false);
    });

    it('`getTools()` returns all tool-shaped vertices', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: subroutine }
  b["b"]
  b@{ shape: subprocess }
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
  search@{ shape: subroutine, returns: "Result", requires: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const search = model.vertices.find((v) => v.id === 'search')!;
      expect(search.vertexKind).toBe('tool');
      expect(search.metadata).toMatchObject({
        returns: 'Result',
        requires: ['net.read'],
      });
    });

    it('non-tool nodes have vertexKind undefined in getSemanticModel()', () => {
      agentflow.parser.parse(`agentflow TB
  plain["plain"]
  artifact["doc"]
  artifact@{ shape: doc }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      expect(model.vertices.find((v) => v.id === 'plain')!.vertexKind).toBeUndefined();
      expect(model.vertices.find((v) => v.id === 'artifact')!.vertexKind).toBeUndefined();
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

  describe('win-pane → tool kind validation', () => {
    it('does NOT warn when win-pane def points at a tool definition', () => {
      agentflow.parser.parse(`agentflow TB
  search_def["search"]
  search_def@{ shape: subroutine, returns: "Result" }
  search_inst["search instance"]
  search_inst@{ shape: win-pane, def: "search_def" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('warns INSTANCE_KIND_MISMATCH when win-pane def points at a non-tool node', () => {
      agentflow.parser.parse(`agentflow TB
  not_a_tool["plain node"]
  bad_inst["bad"]
  bad_inst@{ shape: win-pane, def: "not_a_tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warnings = diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].nodeId).toBe('bad_inst');
      expect(warnings[0].severity).toBe('warning');
    });

    it('does NOT emit INSTANCE_KIND_MISMATCH for a missing def (PR 4 handles that)', () => {
      agentflow.parser.parse(`agentflow TB
  bad_inst["bad"]
  bad_inst@{ shape: win-pane, def: "nonexistent" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // The kind validator only fires when the def resolves; a missing def
      // is PR 4's INSTANCE_DEF_MISSING domain, which doesn't exist yet.
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('emits one warning per offending win-pane instance', () => {
      agentflow.parser.parse(`agentflow TB
  not_tool_a["a"]
  not_tool_b["b"]
  inst1["inst1"]
  inst1@{ shape: win-pane, def: "not_tool_a" }
  inst2["inst2"]
  inst2@{ shape: win-pane, def: "not_tool_b" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warnings = diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH');
      expect(warnings).toHaveLength(2);
      expect(warnings.map((w) => w.nodeId).sort()).toEqual(['inst1', 'inst2']);
    });

    it('alias-shaped tool target also resolves cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  search_def["search"]
  search_def@{ shape: subprocess }
  search_inst["search instance"]
  search_inst@{ shape: win-pane, def: "search_def" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('warning is idempotent across repeated getData() calls', () => {
      agentflow.parser.parse(`agentflow TB
  not_a_tool["plain"]
  bad_inst["bad"]
  bad_inst@{ shape: win-pane, def: "not_a_tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });
  });
});
