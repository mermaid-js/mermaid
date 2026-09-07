/**
 * `diagnostics.ts` states that renaming a diagnostic ID is a breaking change,
 * which makes the ID list versioned public API. Most of the vocabulary is
 * emitted by the semantics module rather than by anything in this package, so
 * the split between "can fire from mermaid" and "reserved" is declared as data
 * rather than prose — and every ID claimed as emitted is reproduced here from a
 * real diagram, so the claim cannot rot into fiction.
 */
import { describe, expect, it } from 'vitest';
import {
  AgentflowWarning,
  PARSER_EMITTED_DIAGNOSTICS,
  RESERVED_DIAGNOSTICS,
} from './diagnostics.js';
import { AgentFlowDB } from './agentflowDb.js';
import agentflow from './parser/agentflowParser.js';

const diagnosticsFor = (text: string) => {
  const db = new AgentFlowDB();
  agentflow.parser.yy = db;
  db.clear();
  db.setGen('gen-2');
  agentflow.parser.parse(text);
  db.getData();
  return db.getDiagnostics();
};

/** One diagram per emitted ID, chosen to raise exactly that diagnostic. */
const REPRODUCTIONS: Record<string, string> = {
  SHAPE_UNSUPPORTED: `agentflow-beta TB
  a["Alpha"]
  a@{ shape: "triangle" }
  b["Beta"]
  a --> b`,
  SHAPE_REMOVED: `agentflow-beta TB
  a["Alpha"]
  a@{ shape: "cylinder" }
  b["Beta"]
  a --> b`,
  CONTAINMENT_VIOLATION: `agentflow-beta TB
  flow A["Flow A"]
    a1["Task A1"]
    a1 --> B
  end
  flow B["Flow B"]
    b1["Task B1"]
    b1 --> A
  end`,
};

describe('agentflow diagnostic vocabulary', () => {
  it('partitions every ID into emitted or reserved', () => {
    const all = [...new Set(Object.values(AgentflowWarning))].sort();
    const partitioned = [
      ...new Set([...PARSER_EMITTED_DIAGNOSTICS, ...RESERVED_DIAGNOSTICS]),
    ].sort();
    expect(partitioned).toStrictEqual(all);
    for (const id of PARSER_EMITTED_DIAGNOSTICS) {
      expect(RESERVED_DIAGNOSTICS.has(id)).toBe(false);
    }
  });

  it('has a reproduction for every ID claimed as emitted', () => {
    expect(Object.keys(REPRODUCTIONS).sort()).toStrictEqual([...PARSER_EMITTED_DIAGNOSTICS].sort());
  });

  it.each(Object.entries(REPRODUCTIONS))('actually emits %s', (id, source) => {
    expect(diagnosticsFor(source).map((d) => d.id)).toContain(id);
  });

  it('emits nothing for a clean diagram', () => {
    expect(
      diagnosticsFor(`agentflow-beta TB
  a["Alpha"]
  b["Beta"]
  a --> b`)
    ).toStrictEqual([]);
  });
});
