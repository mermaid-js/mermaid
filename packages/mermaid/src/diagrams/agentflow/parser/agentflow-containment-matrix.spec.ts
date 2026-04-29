/**
 * Containment matrix validator (closes #8 — wave-3 PR F).
 *
 * Per AGENTFLOW-SYNTAX.md §3.3 each typed container has a fixed
 * allowed-children set. Legacy `subgraph` and `group` containers are
 * the escape hatch and accept anything.
 *
 *   | Parent      | Allowed children                                        |
 *   | ----------- | ------------------------------------------------------- |
 *   | agent       | flow, task, skill, directive, testCase, tool, node      |
 *   | flow        | task, agent, skill, directive, testCase, tool, node     |
 *   | task        | tool, directive, node                                   |
 *   | skill       | tool, flow, directive, node                             |
 *   | directive   | node                                                    |
 *   | testCase    | directive, node                                         |
 *   | subgraph    | unrestricted                                            |
 *
 * Tools are leaves (cannot be parents). A "node" is any plain vertex
 * that isn't a typed container or a tool.
 *
 * Violations emit `CONTAINMENT_VIOLATION` at warning severity in v0.5.0;
 * the v1.0 strict-flip release promotes to error via the future
 * `agentflow.strictContainment` flag.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow containment matrix (§3.3)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const violations = (db: AgentFlowDB) =>
    db.getDiagnostics().filter((d) => d.id === 'CONTAINMENT_VIOLATION');

  // ────────────────────────────────────────────────────────────────────
  // A. Allowed child per row (one per matrix row)
  // ────────────────────────────────────────────────────────────────────
  describe('A. allowed children per row', () => {
    it('agent may contain flow, task, skill, directive, testCase, tool, node', () => {
      agentflow.parser.parse(`agentflow TB
  agent outer["A"]
    flow nestedFlow["F"]
      fnode["f"]
    end
    task nestedTask["T"]
      tnode["t"]
    end
    skill nestedSkill["S"]
      snode["s"]
    end
    directive nestedDir["D"]
      dnode["d"]
    end
    testCase nestedTc["TC"]
      tcnode["tc"]
    end
    nestedTool["tool"]
    nestedTool@{ shape: subroutine }
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('flow may contain task, agent, skill, directive, testCase, tool, node', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["F"]
    task nt["T"]
      tnode["t"]
    end
    agent na["A"]
      anode["a"]
    end
    skill ns["S"]
      snode["s"]
    end
    directive nd["D"]
      dnode["d"]
    end
    testCase ntc["TC"]
      tcnode["tc"]
    end
    nestedTool["tool"]
    nestedTool@{ shape: subroutine }
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('task may contain tool, directive, node', () => {
      agentflow.parser.parse(`agentflow TB
  task outer["T"]
    toolChild["c"]
    toolChild@{ shape: subroutine }
    directive nd["D"]
      dnode["d"]
    end
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('skill may contain tool, flow, directive, node', () => {
      agentflow.parser.parse(`agentflow TB
  skill outer["S"]
    toolChild["c"]
    toolChild@{ shape: subroutine }
    flow nf["F"]
      fnode["f"]
    end
    directive nd["D"]
      dnode["d"]
    end
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('directive may contain only plain nodes', () => {
      agentflow.parser.parse(`agentflow TB
  directive outer["D"]
    a["a"]
    b["b"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('testCase may contain directive and nodes', () => {
      agentflow.parser.parse(`agentflow TB
  testCase outer["TC"]
    directive nd["D"]
      dnode["d"]
    end
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('untyped `subgraph` is unrestricted (legacy escape hatch)', () => {
      agentflow.parser.parse(`agentflow TB
  subgraph outer["any"]
    agent na["A"]
      anode["a"]
    end
    tool_child["c"]
    tool_child@{ shape: subroutine }
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Forbidden pairs emit CONTAINMENT_VIOLATION
  // ────────────────────────────────────────────────────────────────────
  describe('B. forbidden pairs', () => {
    it('task cannot contain agent', () => {
      agentflow.parser.parse(`agentflow TB
  task outer["T"]
    agent inner["A"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = violations(db);
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns.some((w) => w.nodeId === 'inner')).toBe(true);
      expect(warns[0].severity).toBe('warning');
    });

    it('task cannot contain flow', () => {
      agentflow.parser.parse(`agentflow TB
  task outer["T"]
    flow inner["F"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('task cannot contain skill', () => {
      agentflow.parser.parse(`agentflow TB
  task outer["T"]
    skill inner["S"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('skill cannot contain task', () => {
      agentflow.parser.parse(`agentflow TB
  skill outer["S"]
    task inner["T"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('skill cannot contain agent', () => {
      agentflow.parser.parse(`agentflow TB
  skill outer["S"]
    agent inner["A"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('directive cannot contain tool', () => {
      agentflow.parser.parse(`agentflow TB
  directive outer["D"]
    t["t"]
    t@{ shape: subroutine }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = violations(db);
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns.some((w) => w.nodeId === 't')).toBe(true);
    });

    it('directive cannot contain a nested container', () => {
      agentflow.parser.parse(`agentflow TB
  directive outer["D"]
    agent inner["A"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('testCase cannot contain agent', () => {
      agentflow.parser.parse(`agentflow TB
  testCase outer["TC"]
    agent inner["A"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('testCase cannot contain tool', () => {
      agentflow.parser.parse(`agentflow TB
  testCase outer["TC"]
    t["t"]
    t@{ shape: subroutine }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });

    it('testCase cannot contain flow', () => {
      agentflow.parser.parse(`agentflow TB
  testCase outer["TC"]
    flow inner["F"]
      inode["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db).length).toBeGreaterThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Nested structural containment
  // ────────────────────────────────────────────────────────────────────
  describe('C. nested structural containment', () => {
    it('agent > flow > task > tool is a valid 4-level nesting', () => {
      agentflow.parser.parse(`agentflow TB
  agent outer["A"]
    flow f["F"]
      task t["T"]
        toolLeaf["tool"]
        toolLeaf@{ shape: subroutine }
      end
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('agent > testCase > directive > node is valid', () => {
      agentflow.parser.parse(`agentflow TB
  agent outer["A"]
    testCase tc["TC"]
      directive d["D"]
        leaf["leaf"]
      end
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('violation at any level emits a warning for the offending child', () => {
      agentflow.parser.parse(`agentflow TB
  agent outer["A"]
    flow midFlow["F"]
      task innerTask["T"]
        flow badNested["bad"]
          leaf["leaf"]
        end
      end
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = violations(db);
      expect(warns.some((w) => w.nodeId === 'badNested')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('D. invariants', () => {
    it('plain vertex as child is always allowed everywhere', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    pa["p"]
  end
  flow f["F"]
    pf["p"]
  end
  task t["T"]
    pt["p"]
  end
  skill s["S"]
    ps["p"]
  end
  directive d["D"]
    pd["p"]
  end
  testCase tc["TC"]
    ptc["p"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('synthetic declaration groups (types / templates) are not validated', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  template %tri {
    TITLE: String <<x>>
  }
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  task outer["T"]
    agent inner["A"]
      i["i"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      const warns = violations(db);
      // Exactly one violation for `inner` — re-running getData() does
      // not duplicate it.
      const forInner = warns.filter((w) => w.nodeId === 'inner');
      expect(forInner).toHaveLength(1);
    });

    it('all containment violations are severity: "warning"', () => {
      agentflow.parser.parse(`agentflow TB
  directive outer["D"]
    badTool["t"]
    badTool@{ shape: subroutine }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = violations(db);
      expect(warns.length).toBeGreaterThanOrEqual(1);
      for (const w of warns) {
        expect(w.severity).toBe('warning');
      }
    });
  });
});
