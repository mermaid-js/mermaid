/**
 * Metadata applicability validator (v0.8.1).
 *
 * Per AGENTFLOW-SYNTAX.md §10, metadata keys are restricted to the
 * element kinds listed in the applicability table:
 *
 *   | Element                          | Valid metadata keys                                                            |
 *   | -------------------------------- | ------------------------------------------------------------------------------ |
 *   | flow                             | model, memory, params, returns                                                 |
 *   | task (default)                   | execution, params, returns                                                     |
 *   | tool (`shape: tool`)             | params, returns, retry, cache, validate, handler, output, transport, command, |
 *   |                                  | connectorRef                                                                   |
 *   | action (`shape: action`)         | params, returns, connectorRef                                                  |
 *   | connector                        | protocol, endpoint, transport, command, auth, token_required                   |
 *   | input (`shape: input`)           | type, value                                                                    |
 *   | refdoc (`shape: refdoc`)         | (presentation only; cross-cutting only)                                        |
 *   | edge                             | instruction (only)                                                             |
 *
 * `description` and `instruction` are cross-cutting — valid on any
 * authored element (edges accept only `instruction`).
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow metadata applicability (§10)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Valid placement — one per row
  // ────────────────────────────────────────────────────────────────────
  describe('A. valid placement per row', () => {
    it('flow accepts model, memory, params, returns', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ model: "claude-sonnet-4-20250514", memory: "shared", params: "x :: String", returns: "Output" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('task (default-shape vertex) accepts execution, params, returns', () => {
      agentflow.parser.parse(`agentflow TB
  t["task"]
  t@{ execution: "parallel", params: "x :: String", returns: "Y" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('tool accepts params, returns, retry, cache, validate, handler, output, transport, command, connectorRef', () => {
      agentflow.parser.parse(`agentflow TB
  connector conn1["c1"]
  conn1@{ protocol: "mcp" }
  search["search"]
  search@{ shape: tool, params: "q :: String", returns: "R", retry: 3, cache: "session", validate: "schema", handler: "local", output: "OutT", transport: "stdio", command: "run.sh", connectorRef: "conn1" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('action accepts params, returns, connectorRef', () => {
      agentflow.parser.parse(`agentflow TB
  connector conn1["c1"]
  conn1@{ protocol: "mcp" }
  a["a"]
  a@{ shape: action, params: "x", returns: "Out", connectorRef: "conn1" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('connector accepts protocol, endpoint, transport, command, auth, token_required', () => {
      agentflow.parser.parse(`agentflow TB
  connector conn["conn"]
  conn@{ protocol: "http", endpoint: "https://example.com", transport: "stdio", command: "run", auth: "bearer", token_required: true }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('input accepts type, value', () => {
      agentflow.parser.parse(`agentflow TB
  i["file_path"]
  i@{ shape: input, type: "String", value: "src/HelloWorld.java" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('refdoc accepts no element-specific keys (cross-cutting only)', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: refdoc, description: "guide" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Invalid placement — METADATA_KEY_MISAPPLIED fires
  // ────────────────────────────────────────────────────────────────────
  describe('B. invalid placement emits METADATA_KEY_MISAPPLIED', () => {
    it('flow with `execution` (task-only key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ execution: "parallel" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('tool with `model` (flow-only key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: tool, model: "claude-sonnet-4-20250514" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('input with `returns` (task/flow/tool key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  i["i"]
  i@{ shape: input, returns: "R" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('action with `retry` (tool-only key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  a@{ shape: action, retry: 3 }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('connector with `returns` (flow/task/tool/action key) warns', () => {
      agentflow.parser.parse(`agentflow TB
  connector c["c"]
  c@{ returns: "R" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. description / instruction are cross-cutting
  // ────────────────────────────────────────────────────────────────────
  describe('C. description and instruction are cross-cutting', () => {
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
  s@{ shape: tool, description: "search tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('instruction accepted on a task vertex', () => {
      agentflow.parser.parse(`agentflow TB
  t["t"]
  t@{ instruction: "Be concise" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('instruction accepted on a flow', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ instruction: "Do the thing" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Universal presentation keys never warn
  // ────────────────────────────────────────────────────────────────────
  describe('D. universal presentation keys never warn', () => {
    it('`icon`, `img`, `w`, `h`, `view`, `class`, `style` accepted everywhere', () => {
      agentflow.parser.parse(`agentflow TB
  flow a["A"]
    step["step"]
  end
  a@{ icon: "fa:user", view: "expanded", class: "highlight", style: "fill:#f00" }
  b["b"]
  b@{ img: "./pic.png", w: 100, h: 50, style: "stroke:blue" }
  c["c"]
  c@{ shape: tool, class: "tool-class" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Unknown-key preservation (no warning)
  // ────────────────────────────────────────────────────────────────────
  describe('E. unknown-key preservation', () => {
    it('unknown keys on a flow are preserved without a warning', () => {
      agentflow.parser.parse(`agentflow TB
  flow a["A"]
    step["step"]
  end
  a@{ totallyCustomKey: "opaque" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const sub = db.getSubGraphs().find((sg) => sg.id === 'a')!;
      expect(sub.metadata?.totallyCustomKey).toBe('opaque');
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(0);
    });

    it('unknown keys on a vertex are preserved', () => {
      agentflow.parser.parse(`agentflow TB
  search["search"]
  search@{ shape: tool, myExtension: 42 }`);
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
    it('all misapplied-key warnings are severity: "warning"', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    fstep["step"]
  end
  f@{ execution: "x" }
  search["search"]
  search@{ shape: tool, model: "x" }`);
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
  flow f["F"]
    step["step"]
  end
  f@{ execution: "x" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED')).toHaveLength(1);
    });

    it('multiple misapplied keys on one element emit one warning per key', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    step["step"]
  end
  f@{ execution: "x", retry: 3, value: "z" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'METADATA_KEY_MISAPPLIED');
      expect(warns).toHaveLength(3);
      expect(warns.every((w) => w.nodeId === 'f')).toBe(true);
    });
  });
});
