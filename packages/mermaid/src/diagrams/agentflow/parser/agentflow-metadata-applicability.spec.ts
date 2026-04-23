/**
 * Metadata applicability validator (closes #11 — wave-3 PR A).
 *
 * Per AGENTFLOW-SYNTAX.md §13, metadata keys are restricted to the element
 * kinds listed in the applicability table:
 *
 *   | Element                         | Valid metadata keys                      |
 *   | ------------------------------- | ---------------------------------------- |
 *   | agent                           | model, permits, memory, fallbacks        |
 *   | flow                            | params, returns                          |
 *   | task                            | execution, params, returns, fallbacks    |
 *   | skill                           | strategy, params, returns, fallbacks     |
 *   | tool                            | params, returns, requires, deny, retry,  |
 *   |                                 | cache, validate, handler, transport,     |
 *   |                                 | command, connectorRef                    |
 *   | connector-designated node       | protocol, endpoint, transport, command,  |
 *   |                                 | auth, token_required                     |
 *   | directive                       | rule, severity, context, params          |
 *   | testCase                        | assert, expects                          |
 *   | artifact nodes (`doc`, etc.)    | output                                   |
 *   | reference nodes (`procs`)       | typeRef, templateRef, src                |
 *
 * `description` (§13.1) is cross-cutting — valid on any authored element.
 * Presentation and structural keys (`shape`, `label`, `labelType`, `def`,
 * `view`, `icon`, `img`, `w`, `h`, `class`, `style`, `form`, `pos`,
 * `animate`, `animation`, `curve`, `constraint`) are likewise universal
 * and are never flagged.
 *
 * Per §13.2, a known domain key on the wrong element emits
 * `METADATA_KEY_MISAPPLIED` — a warning in v0.5.0; future v1.0 promotes
 * it to an error. Unknown keys are preserved on the raw vertex metadata
 * without a warning in this PR (they pass through for downstream tooling).
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow metadata applicability (§13)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Valid placement — one per row in the applicability table
  // ────────────────────────────────────────────────────────────────────
  describe('A. valid placement per row', () => {
    it('agent accepts model, permits, memory, fallbacks', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ model: "claude-sonnet-4-20250514", permits: ["net.read"], memory: "shared", fallbacks: ["other_agent"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('flow accepts params, returns', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ params: ["input"], returns: "Output" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('task accepts execution, params, returns, fallbacks', () => {
      agentflow.parser.parse(`agentflow TB
  task t["T"]
    step["step"]
  end
  t@{ execution: "parallel", params: ["x"], returns: "Y", fallbacks: ["alt"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('skill accepts strategy, params, returns, fallbacks', () => {
      agentflow.parser.parse(`agentflow TB
  skill s["S"]
    step["step"]
  end
  s@{ strategy: "round-robin", params: ["q"], returns: "Result", fallbacks: ["alt"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('tool accepts params, returns, requires, deny, retry, cache, validate, handler, transport, command, connectorRef', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subroutine, params: ["q"], returns: "R", requires: ["net.read"], deny: ["fs.write"], retry: 3, cache: "session", validate: "schema", handler: "local", transport: "stdio", command: "run.sh", connectorRef: "conn1" }
  conn1["conn1"]
  conn1@{ protocol: "mcp" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('connector-designated node accepts protocol, endpoint, transport, command, auth, token_required', () => {
      agentflow.parser.parse(`agentflow TB
  conn["conn"]
  conn@{ protocol: "http", endpoint: "https://example.com", transport: "stdio", command: "run", auth: "bearer", token_required: true }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('directive accepts rule, severity, context, params', () => {
      agentflow.parser.parse(`agentflow TB
  directive d["D"]
    step["step"]
  end
  d@{ rule: "no PII", severity: "critical", context: "output", params: ["text"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('testCase accepts assert, expects', () => {
      agentflow.parser.parse(`agentflow TB
  testCase tc["TC"]
    step["step"]
  end
  tc@{ assert: "result.ok", expects: "OutputType" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('artifact node (`doc`) accepts output', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: doc, output: "Report.pdf" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('reference node (`procs`) accepts typeRef, templateRef, src', () => {
      agentflow.parser.parse(`agentflow TB
  r1["r1"]
  r1@{ shape: procs, typeRef: "Report" }
  r2["r2"]
  r2@{ shape: procs, templateRef: "triage" }
  r3["r3"]
  r3@{ shape: procs, src: "./spec.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Invalid placement — ≥5 cases
  // ────────────────────────────────────────────────────────────────────
  describe('B. invalid placement emits METADATA_KEY_MISAPPLIED', () => {
    it('agent with `strategy` (skill key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ strategy: "round-robin" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('a');
      expect(warns[0].severity).toBe('warning');
    });

    it('flow with `execution` (task key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ execution: "parallel" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('tool with `model` (agent key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subroutine, model: "claude-sonnet-4-20250514" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('directive with `returns` (flow/task/skill/tool key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  directive d["D"]
    step["step"]
  end
  d@{ returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('artifact node with `requires` (tool key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: doc, requires: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('reference node with `model` (agent key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, model: "claude-sonnet" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. description is cross-cutting (§13.1)
  // ────────────────────────────────────────────────────────────────────
  describe('C. description is cross-cutting', () => {
    it('description accepted on agent', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ description: "researcher agent" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('description accepted on flow', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ description: "pipeline" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('description accepted on tool', () => {
      agentflow.parser.parse(`agentflow TB
  s["s"]
  s@{ shape: subroutine, description: "search tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('description accepted on directive', () => {
      agentflow.parser.parse(`agentflow TB
  directive d["D"]
    step["step"]
  end
  d@{ description: "safety rule" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('description accepted on artifact', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: doc, description: "the report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Universal / presentation keys never warn
  // ────────────────────────────────────────────────────────────────────
  describe('D. universal presentation and structural keys never warn', () => {
    it('`icon`, `img`, `w`, `h`, `view`, `class`, `style` accepted everywhere', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ icon: "fa:user", view: "expanded", class: "highlight", style: "fill:#f00" }
  b["b"]
  b@{ img: "./pic.png", w: 100, h: 50, style: "stroke:blue" }
  c["c"]
  c@{ shape: subroutine, class: "tool-class" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('`def` on an instance vertex does not warn', () => {
      agentflow.parser.parse(`agentflow TB
  tool_def["t"]
  tool_def@{ shape: subroutine }
  inst["i"]
  inst@{ shape: win-pane, def: "tool_def" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Unknown-key preservation (no warning)
  // ────────────────────────────────────────────────────────────────────
  describe('E. unknown-key preservation', () => {
    it('unknown keys are preserved in raw metadata without a warning', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ totallyCustomKey: "opaque" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // Preserved on raw vertex/subgraph metadata.
      const agentSub = db.getSubGraphs().find((sg) => sg.id === 'a')!;
      expect(agentSub.metadata?.totallyCustomKey).toBe('opaque');
      // No warning in this PR — unknown-key warnings are out of scope.
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('unknown keys on a vertex are preserved', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: subroutine, myExtension: 42 }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const v = db.getVertices().get('search')!;
      expect(v.metadata?.myExtension).toBe(42);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // F. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('F. cross-cutting invariants', () => {
    it('untyped `subgraph` is unrestricted (no warnings on any metadata)', () => {
      agentflow.parser.parse(`agentflow TB
  subgraph g["grouping"]
    step["step"]
  end
  g@{ strategy: "round-robin", execution: "parallel", rule: "nope" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // subgraph / group containers are the legacy escape hatch — unrestricted.
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('plain (unclassified) vertex with any metadata does not warn', () => {
      agentflow.parser.parse(`agentflow TB
  plain["plain"]
  plain@{ foo: "bar", baz: "qux" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('all misapplied-key warnings are severity: "warning"', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ strategy: "x" }
  flow f["F"]
    fstep["step"]
  end
  f@{ execution: "x" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED');
      expect(warns.length).toBeGreaterThanOrEqual(2);
      for (const w of warns) {
        expect(w.severity).toBe('warning');
      }
    });

    it('repeated getData() calls are idempotent — no duplicate warnings', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ strategy: "x" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('multiple misapplied keys on one element emit one warning per key', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    step["step"]
  end
  a@{ strategy: "x", execution: "y", rule: "z" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED');
      expect(warns).toHaveLength(3);
      expect(warns.every((w) => w.nodeId === 'a')).toBe(true);
    });
  });
});
