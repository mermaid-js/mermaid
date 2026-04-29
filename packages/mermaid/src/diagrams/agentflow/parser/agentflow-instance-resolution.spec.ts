/**
 * Definition / instance resolution (closes #5 — wave-2 PR 4).
 *
 * Per AGENTFLOW-SYNTAX.md §11, an instance shape is a lightweight reference
 * to a definition. The target matrix (§11.1):
 *
 *   tag-rect / tagged-rectangle        → agent container
 *   delay / half-rounded-rectangle     → flow container
 *   lin-rect / lined-rectangle         → skill container
 *   win-pane / window-pane             → tool definition (shape: subroutine)
 *   curv-trap / curved-trapezoid       → directive container
 *
 * Validity (§11.2) — all three conditions are warnings in v0.6.0 and
 * errors in v1.0:
 *   - Missing `def`                   → INSTANCE_DEF_MISSING
 *   - Kind mismatch                   → INSTANCE_KIND_MISMATCH
 *   - Cyclic `def` chain              → INSTANCE_DEF_CYCLE
 *
 * Inheritance (§11.3):
 *   - Instances inherit domain metadata only. Core rendering fields
 *     (shape, view, icon, img, w, h) and structural wiring (def) do not
 *     inherit.
 *   - Local metadata overrides inherited metadata.
 *   - Structure does not auto-expand into the instance site.
 *
 * PR 1 shipped INSTANCE_KIND_MISMATCH for the win-pane → tool pair only;
 * this PR extends the validator to all five shape→kind pairs and layers
 * INSTANCE_DEF_MISSING, INSTANCE_DEF_CYCLE, and inheritance resolution
 * on top. Resolved metadata is surfaced on SemanticVertex.resolvedMetadata.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow instance resolution (§11)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. INSTANCE_KIND_MISMATCH extension (all five shape→kind pairs)
  // ────────────────────────────────────────────────────────────────────
  describe('A. INSTANCE_KIND_MISMATCH across the five shapes', () => {
    it('tag-rect → agent container: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  r_inst["Research instance"]
  r_inst@{ shape: tag-rect, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('tag-rect → flow container (wrong kind): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    p_step["step"]
  end
  bad["bad"]
  bad@{ shape: tag-rect, def: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('bad');
      expect(warns[0].severity).toBe('warning');
    });

    it('tag-rect → plain vertex (non-container): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  plain_node["plain"]
  bad["bad"]
  bad@{ shape: tag-rect, def: "plain_node" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });

    it('tag-rect alias `tagged-rectangle` → agent: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  r_inst["inst"]
  r_inst@{ shape: tagged-rectangle, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('delay → flow container: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    p_step["step"]
  end
  p_inst["inst"]
  p_inst@{ shape: delay, def: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('delay → agent container (wrong kind): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  bad["bad"]
  bad@{ shape: delay, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });

    it('delay alias `half-rounded-rectangle` → flow: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    p_step["step"]
  end
  p_inst["inst"]
  p_inst@{ shape: half-rounded-rectangle, def: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('lin-rect → skill container: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  skill web_search["Web Search"]
    ws_step["step"]
  end
  ws_inst["inst"]
  ws_inst@{ shape: lin-rect, def: "web_search" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('lin-rect → agent container (wrong kind): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  bad["bad"]
  bad@{ shape: lin-rect, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });

    it('lin-rect alias `lined-rectangle` → skill: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  skill web_search["Web Search"]
    ws_step["step"]
  end
  ws_inst["inst"]
  ws_inst@{ shape: lined-rectangle, def: "web_search" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('curv-trap → directive container: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  directive safety["Safety"]
    s_step["step"]
  end
  s_inst["inst"]
  s_inst@{ shape: curv-trap, def: "safety" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('curv-trap → flow container (wrong kind): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    p_step["step"]
  end
  bad["bad"]
  bad@{ shape: curv-trap, def: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });

    it('curv-trap alias `curved-trapezoid` → directive: no warning', () => {
      agentflow.parser.parse(`agentflow TB
  directive safety["Safety"]
    s_step["step"]
  end
  s_inst["inst"]
  s_inst@{ shape: curved-trapezoid, def: "safety" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('win-pane → tool (regression from PR 1): no warning', () => {
      agentflow.parser.parse(`agentflow TB
  search_def["search"]
  search_def@{ shape: subroutine, returns: "Result" }
  search_inst["inst"]
  search_inst@{ shape: win-pane, def: "search_def" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('win-pane → non-tool vertex (regression from PR 1): INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  not_a_tool["plain"]
  bad["bad"]
  bad@{ shape: win-pane, def: "not_a_tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });

    it('tag-rect → plain `subgraph` (untyped) container: INSTANCE_KIND_MISMATCH', () => {
      agentflow.parser.parse(`agentflow TB
  subgraph generic["Generic"]
    g_step["step"]
  end
  bad["bad"]
  bad@{ shape: tag-rect, def: "generic" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. INSTANCE_DEF_MISSING
  // ────────────────────────────────────────────────────────────────────
  describe('B. INSTANCE_DEF_MISSING', () => {
    it('tag-rect with no def: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: tag-rect }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'INSTANCE_DEF_MISSING');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('bad');
      expect(warns[0].severity).toBe('warning');
    });

    it('delay with no def: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: delay }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('lin-rect with no def: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: lin-rect }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('win-pane with no def: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: win-pane }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('curv-trap with no def: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: curv-trap }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('tag-rect with def pointing to nonexistent id: warn', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: tag-rect, def: "nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('win-pane with def pointing to nonexistent id: warn (previously silent in PR 1)', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: win-pane, def: "nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
      // And does NOT also emit INSTANCE_KIND_MISMATCH.
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('valid def on all five shapes: no INSTANCE_DEF_MISSING emitted', () => {
      agentflow.parser.parse(`agentflow TB
  agent the_agent["A"]
    aa["step"]
  end
  flow the_flow["F"]
    ff["step"]
  end
  skill the_skill["S"]
    ss["step"]
  end
  tool_def["T"]
  tool_def@{ shape: subroutine }
  directive the_dir["D"]
    dd["step"]
  end

  i1["a_inst"]
  i1@{ shape: tag-rect, def: "the_agent" }
  i2["f_inst"]
  i2@{ shape: delay, def: "the_flow" }
  i3["s_inst"]
  i3@{ shape: lin-rect, def: "the_skill" }
  i4["t_inst"]
  i4@{ shape: win-pane, def: "tool_def" }
  i5["d_inst"]
  i5@{ shape: curv-trap, def: "the_dir" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(0);
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. INSTANCE_DEF_CYCLE
  // ────────────────────────────────────────────────────────────────────
  describe('C. INSTANCE_DEF_CYCLE', () => {
    it('self-loop: A.def = A emits INSTANCE_DEF_CYCLE', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: win-pane, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'INSTANCE_DEF_CYCLE');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('two-step cycle on win-pane: A ↔ B emits INSTANCE_DEF_CYCLE', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: win-pane, def: "b" }
  b["b"]
  b@{ shape: win-pane, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_CYCLE').length).toBeGreaterThanOrEqual(1);
    });

    it('three-step cycle on tag-rect: A → B → C → A', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: tag-rect, def: "b" }
  b["b"]
  b@{ shape: tag-rect, def: "c" }
  c["c"]
  c@{ shape: tag-rect, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_CYCLE').length).toBeGreaterThanOrEqual(1);
    });

    it('non-cyclic chain (win-pane → win-pane → tool): no cycle, no kind mismatch', () => {
      agentflow.parser.parse(`agentflow TB
  tool_def["T"]
  tool_def@{ shape: subroutine, returns: "Result" }
  mid["mid"]
  mid@{ shape: win-pane, def: "tool_def" }
  top["top"]
  top@{ shape: win-pane, def: "mid" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_CYCLE')).toHaveLength(0);
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(0);
    });

    it('cycle suppresses kind-mismatch (no double-reporting)', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: win-pane, def: "b" }
  b["b"]
  b@{ shape: win-pane, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // Either A or B terminates via a cycle before any leaf exists,
      // so kind-mismatch MUST NOT also fire on them.
      expect(diagnosticsFor(db, 'INSTANCE_KIND_MISMATCH')).toHaveLength(0);
    });

    it('cycle suppresses def-missing (no double-reporting)', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: win-pane, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Inheritance (domain metadata merge, local wins)
  // ────────────────────────────────────────────────────────────────────
  describe('D. Inheritance', () => {
    const resolvedOf = (db: AgentFlowDB, id: string) => {
      const v = db.getSemanticModel().vertices.find((x) => x.id === id);
      return v?.resolvedMetadata;
    };

    it("win-pane inherits tool's `returns` and `requires`", () => {
      agentflow.parser.parse(`agentflow TB
  search_def["search"]
  search_def@{ shape: subroutine, returns: "Result", requires: ["net.read"] }
  inst["inst"]
  inst@{ shape: win-pane, def: "search_def" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({
        returns: 'Result',
        requires: ['net.read'],
      });
    });

    it('win-pane local `returns` overrides inherited', () => {
      agentflow.parser.parse(`agentflow TB
  search_def["search"]
  search_def@{ shape: subroutine, returns: "Result", requires: ["net.read"] }
  inst["inst"]
  inst@{ shape: win-pane, def: "search_def", returns: "CachedResult" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({
        returns: 'CachedResult',
        requires: ['net.read'],
      });
    });

    it("tag-rect inherits agent's `model` and `permits`", () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }
  inst["inst"]
  inst@{ shape: tag-rect, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({
        model: 'claude-sonnet-4-20250514',
        permits: ['net.read', 'llm.query'],
      });
    });

    it("tag-rect local `model` overrides agent's `model`", () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    r_step["step"]
  end
  researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read"] }
  inst["inst"]
  inst@{ shape: tag-rect, def: "researcher", model: "claude-opus-4-20250514" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({
        model: 'claude-opus-4-20250514',
        permits: ['net.read'],
      });
    });

    it("delay inherits flow's domain metadata", () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["P"]
    p_step["step"]
  end
  pipeline@{ params: ["input"], returns: "Output" }
  inst["inst"]
  inst@{ shape: delay, def: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({
        params: ['input'],
        returns: 'Output',
      });
    });

    it("lin-rect inherits skill's `strategy`", () => {
      agentflow.parser.parse(`agentflow TB
  skill websearch["Web Search"]
    ws["step"]
  end
  websearch@{ strategy: "round-robin" }
  inst["inst"]
  inst@{ shape: lin-rect, def: "websearch" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({ strategy: 'round-robin' });
    });

    it('curv-trap inherits directive metadata', () => {
      agentflow.parser.parse(`agentflow TB
  directive safety["Safety"]
    s_step["step"]
  end
  safety@{ scope: "global", severity: "high" }
  inst["inst"]
  inst@{ shape: curv-trap, def: "safety" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({ scope: 'global', severity: 'high' });
    });

    it("shape does NOT inherit (stays as instance's own shape)", () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine, returns: "X" }
  inst["inst"]
  inst@{ shape: win-pane, def: "t" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const resolved = resolvedOf(db, 'inst');
      expect(resolved).toBeDefined();
      expect(resolved).not.toHaveProperty('shape');
    });

    it('view/icon/img/w/h do NOT inherit', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine, returns: "X", icon: "fa:star", w: 100, h: 50 }
  inst["inst"]
  inst@{ shape: win-pane, def: "t" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const resolved = resolvedOf(db, 'inst')!;
      expect(resolved.returns).toBe('X');
      expect(resolved).not.toHaveProperty('icon');
      expect(resolved).not.toHaveProperty('w');
      expect(resolved).not.toHaveProperty('h');
      expect(resolved).not.toHaveProperty('view');
      expect(resolved).not.toHaveProperty('img');
    });

    it('`def` itself does NOT inherit into resolvedMetadata', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine, returns: "X" }
  inst["inst"]
  inst@{ shape: win-pane, def: "t" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const resolved = resolvedOf(db, 'inst')!;
      expect(resolved).not.toHaveProperty('def');
    });

    it('multi-step chain: local wins over closer def, closer def wins over deeper def', () => {
      agentflow.parser.parse(`agentflow TB
  base["base"]
  base@{ shape: subroutine, returns: "Base", requires: ["net.read"], a: 1 }
  mid["mid"]
  mid@{ shape: win-pane, def: "base", returns: "Mid", a: 2, b: 2 }
  top["top"]
  top@{ shape: win-pane, def: "mid", a: 3 }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const resolved = resolvedOf(db, 'top')!;
      // a: from top (local wins)
      expect(resolved.a).toBe(3);
      // b: inherited from mid (closer def wins over non-set base)
      expect(resolved.b).toBe(2);
      // returns: inherited from mid (closer def)
      expect(resolved.returns).toBe('Mid');
      // requires: inherited transitively from base
      expect(resolved.requires).toEqual(['net.read']);
    });

    it('empty domain metadata on def: instance resolvedMetadata equals its local domain', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine }
  inst["inst"]
  inst@{ shape: win-pane, def: "t", returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const resolved = resolvedOf(db, 'inst')!;
      expect(resolved).toMatchObject({ returns: 'Result' });
    });

    it('instance with no local metadata still gets full inheritance', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    aa["step"]
  end
  a@{ permits: ["net.read"] }
  inst["inst"]
  inst@{ shape: tag-rect, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(resolvedOf(db, 'inst')).toMatchObject({ permits: ['net.read'] });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Structural non-cloning
  // ────────────────────────────────────────────────────────────────────
  describe('E. Structural non-cloning', () => {
    it('win-pane instance of a tool with edges: instance gains no edges', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine }
  upstream["u"]
  upstream --> t
  inst["inst"]
  inst@{ shape: win-pane, def: "t" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const model = db.getSemanticModel();
      const instEdges = model.edges.filter((e) => e.start === 'inst' || e.end === 'inst');
      expect(instEdges).toHaveLength(0);
    });

    it('tag-rect instance of an agent: instance is NOT a subgraph, children stay with original', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    r_child["child"]
  end
  inst["inst"]
  inst@{ shape: tag-rect, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const model = db.getSemanticModel();
      // The instance is a vertex, not a subgraph.
      expect(model.subGraphs.find((sg) => sg.id === 'inst')).toBeUndefined();
      expect(model.vertices.find((v) => v.id === 'inst')).toBeDefined();
      // r_child remains a member of researcher, not of inst.
      const researcher = model.subGraphs.find((sg) => sg.id === 'researcher')!;
      expect(researcher.nodes).toContain('r_child');
    });

    it("instance is NOT added to the def's subgraph nodes list", () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    r_step["step"]
  end
  inst["inst"]
  inst@{ shape: tag-rect, def: "researcher" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const researcher = db.getSemanticModel().subGraphs.find((sg) => sg.id === 'researcher')!;
      expect(researcher.nodes).not.toContain('inst');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // F. Semantic-model exposure
  // ────────────────────────────────────────────────────────────────────
  describe('F. Semantic model', () => {
    it('resolved instance has resolvedMetadata populated', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine, returns: "X" }
  inst["inst"]
  inst@{ shape: win-pane, def: "t" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const inst = db.getSemanticModel().vertices.find((v) => v.id === 'inst')!;
      expect(inst.resolvedMetadata).toEqual({ returns: 'X' });
    });

    it('plain non-instance vertex has resolvedMetadata undefined', () => {
      agentflow.parser.parse(`agentflow TB
  plain["plain"]
  plain@{ model: "claude" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const plain = db.getSemanticModel().vertices.find((v) => v.id === 'plain')!;
      expect(plain.resolvedMetadata).toBeUndefined();
    });

    it('instance with INSTANCE_DEF_MISSING has resolvedMetadata undefined', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: win-pane, def: "nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const bad = db.getSemanticModel().vertices.find((v) => v.id === 'bad')!;
      expect(bad.resolvedMetadata).toBeUndefined();
    });

    it('cyclic instance has resolvedMetadata undefined', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: win-pane, def: "a" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const a = db.getSemanticModel().vertices.find((v) => v.id === 'a')!;
      expect(a.resolvedMetadata).toBeUndefined();
    });

    it("instance's `metadata` still reflects *authored* local metadata (backward compat)", () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ shape: subroutine, returns: "X" }
  inst["inst"]
  inst@{ shape: win-pane, def: "t", returns: "Local" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const inst = db.getSemanticModel().vertices.find((v) => v.id === 'inst')!;
      // `metadata` is what the instance itself authored; `resolvedMetadata`
      // is the merged view.
      expect(inst.metadata).toMatchObject({ returns: 'Local', def: 't' });
      // The inherited value only appears in resolvedMetadata.
      expect(inst.resolvedMetadata).toMatchObject({ returns: 'Local' });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // G. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('G. Cross-cutting invariants', () => {
    it('all new diagnostics are severity: "warning" in v0.6.0', () => {
      agentflow.parser.parse(`agentflow TB
  no_def["no_def"]
  no_def@{ shape: win-pane }
  cyclic["c"]
  cyclic@{ shape: win-pane, def: "cyclic" }
  wrong_kind["wk"]
  wrong_kind@{ shape: tag-rect, def: "plain" }
  plain["plain"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const all = db
        .getDiagnostics()
        .filter((d) =>
          ['INSTANCE_DEF_MISSING', 'INSTANCE_DEF_CYCLE', 'INSTANCE_KIND_MISMATCH'].includes(d.id)
        );
      expect(all.length).toBeGreaterThanOrEqual(3);
      for (const d of all) {
        expect(d.severity).toBe('warning');
      }
    });

    it('repeated getData() calls are idempotent — no duplicate warnings', () => {
      agentflow.parser.parse(`agentflow TB
  no_def["no_def"]
  no_def@{ shape: win-pane }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
    });

    it('validator fires via getSemanticModel() too (post-parse hook runs once)', () => {
      agentflow.parser.parse(`agentflow TB
  no_def["no_def"]
  no_def@{ shape: win-pane }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const missing = model.diagnostics.filter((d) => d.id === 'INSTANCE_DEF_MISSING');
      expect(missing).toHaveLength(1);
    });
  });
});
