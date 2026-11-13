/**
 * `getDiagnostics()` exists for editor tooling, and tooling parses — it does not
 * render. The two live diagnostics (`SHAPE_REMOVED`, `SHAPE_UNSUPPORTED`) used
 * to be emitted only from `transformData`, which the renderer calls, so
 * `mermaid.parse(text)` followed by `getDiagnostics()` always returned `[]`.
 * They are now raised from `getData()`.
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

const withUnsupportedShape = `agentflow-beta TB
  a["Alpha"]
  a@{ shape: "triangle" }
  b["Beta"]
  a --> b`;

const withRemovedShape = `agentflow-beta TB
  a["Alpha"]
  a@{ shape: "cylinder" }
  b["Beta"]
  a --> b`;

describe('agentflow diagnostics lifecycle', () => {
  it('reports an unsupported shape after getData(), without rendering', () => {
    const db = parse(withUnsupportedShape);
    db.getData();

    const diagnostic = db.getDiagnostics().find((d) => d.id === 'SHAPE_UNSUPPORTED');
    expect(diagnostic).toBeDefined();
    expect(diagnostic?.nodeId).toBe('a');
    expect(diagnostic?.severity).toBe('warning');
  });

  it('reports a removed shape as an error after getData()', () => {
    const db = parse(withRemovedShape);
    db.getData();

    const diagnostic = db.getDiagnostics().find((d) => d.id === 'SHAPE_REMOVED');
    expect(diagnostic).toBeDefined();
    expect(diagnostic?.severity).toBe('error');
  });

  it('does not accumulate duplicates when getData() is called more than once', () => {
    const db = parse(withUnsupportedShape);
    db.getData();
    db.getData();
    db.getData();

    expect(db.getDiagnostics().filter((d) => d.id === 'SHAPE_UNSUPPORTED')).toHaveLength(1);
  });

  it('reports the position of the offending node when one was captured', () => {
    const db = parse(withUnsupportedShape);
    db.getData();

    const diagnostic = db.getDiagnostics().find((d) => d.id === 'SHAPE_UNSUPPORTED');
    expect(diagnostic?.position?.startLine).toBeGreaterThan(0);
  });
});
