// `metadata` and `getSemanticModel()` are consumer-facing surfaces. js-yaml
// copies an authored `__proto__` key onto the parsed document as an own
// property, so a downstream `merge(target, node.metadata)` would pollute
// `Object.prototype` even though mermaid itself never does. The parser strips
// prototype-shaped keys at the `@{ }` boundary so no consumer inherits that.
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

describe('agentflow @{ } metadata: prototype-shaped keys are stripped', () => {
  it('drops an authored __proto__ key from vertex metadata', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  a@{
    __proto__:
      polluted: true
  }`);
    const metadata = db.getVertices().get('a')?.metadata ?? {};
    expect(Object.keys(metadata)).not.toContain('__proto__');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('drops constructor and prototype keys too', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  a@{ constructor: "x", prototype: "y", description: "kept" }`);
    const metadata = db.getVertices().get('a')?.metadata ?? {};
    expect(Object.keys(metadata)).toEqual(['description']);
    expect(metadata.description).toBe('kept');
  });

  it('strips nested prototype keys while keeping the surrounding structure', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  a@{
    params:
      - name: first
        __proto__:
          polluted: true
    description: "kept"
  }`);
    const metadata = db.getVertices().get('a')?.metadata ?? {};
    expect(metadata.description).toBe('kept');
    const params = metadata.params as Record<string, unknown>[];
    expect(params).toHaveLength(1);
    expect(params[0].name).toBe('first');
    expect(Object.keys(params[0])).not.toContain('__proto__');
  });

  it('leaves ordinary metadata untouched', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  a@{ shape: rounded, description: "hello", myExtension: 42 }`);
    const metadata = db.getVertices().get('a')?.metadata ?? {};
    expect(metadata.description).toBe('hello');
    expect(metadata.myExtension).toBe(42);
  });
});
