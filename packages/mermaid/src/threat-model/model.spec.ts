// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { load, JSON_SCHEMA } from 'js-yaml';
import { deploymentBlockers, parseThreatModel } from './model.js';
import type { ThreatModel } from './model.js';
import { validateFlowchart } from './flowchart.js';
import type { FlowDB } from '../diagrams/flowchart/flowDb.js';

const fixture = (): ThreatModel => ({
  version: 1,
  id: 'api',
  state: 'draft',
  elements: [{ id: 'API', kind: 'process' }],
  threats: [
    {
      id: 'T1',
      title: 'Tenant bypass',
      description: 'Missing tenant check',
      targets: ['API'],
      severity: 'high',
      status: 'open',
    },
  ],
});

describe('threat model schema', () => {
  it('preserves the complete example through JSON serialization', () => {
    const source = readFileSync(
      new URL('../../../../demos/threat-model.mmd', import.meta.url),
      'utf8'
    );
    const metadata = load(source.split('---')[1], { schema: JSON_SCHEMA }) as {
      threatModel: unknown;
    };
    const model = parseThreatModel(metadata.threatModel);
    expect(parseThreatModel(JSON.parse(JSON.stringify(model)))).toEqual(model);
    expect(model.threats).toHaveLength(3);
  });
  it('accepts a minimal model without inferring security from shapes', () => {
    expect(parseThreatModel(fixture())).toEqual(fixture());
  });
  it.each([null, [], 'model', { ...fixture(), version: 2 }, { ...fixture(), typo: true }])(
    'rejects invalid roots: %j',
    (value) => {
      expect(() => parseThreatModel(value)).toThrow('Threat model');
    }
  );
  it.each([
    ['severity', 'urgent'],
    ['status', 'resolved'],
    ['category', 'SQL injection'],
    ['targets', []],
    ['targets', ['missing']],
    ['actors', ['missing']],
    ['context', ['missing']],
    ['id', '<script>'],
    ['evidence', 'not-an-array'],
    ['score', { value: -1, method: 'risk', rationale: 'test' }],
    ['score', { value: Infinity, method: 'risk', rationale: 'test' }],
  ])('rejects invalid threat %s', (key, value) => {
    const model = fixture();
    Object.assign(model.threats[0], { [key]: value });
    expect(() => parseThreatModel(model)).toThrow();
  });
  it('rejects duplicate IDs and unknown asset references', () => {
    const model = fixture();
    model.elements.push(model.elements[0]);
    expect(() => parseThreatModel(model)).toThrow('duplicate id');
    model.elements.pop();
    model.elements[0].assets = ['missing'];
    expect(() => parseThreatModel(model)).toThrow('unknown reference');
  });
  it('requires evidence and mitigation for a mitigated threat', () => {
    const model = fixture();
    model.threats[0].status = 'mitigated';
    expect(() => parseThreatModel(model)).toThrow('evidence');
    Object.assign(model.threats[0], { mitigation: 'Tenant filter', evidence: ['repo/file#L20'] });
    expect(parseThreatModel(model)).toEqual(model);
  });
  it.each(['accepted', 'transferred', 'excluded'] as const)(
    'requires a rationale for %s',
    (status) => {
      const model = fixture();
      model.threats[0].status = status;
      expect(() => parseThreatModel(model)).toThrow('rationale');
    }
  );
  it('rejects acceptance of high or critical risks even with a rationale', () => {
    const model = fixture();
    Object.assign(model.threats[0], { status: 'accepted', decision: 'Shipping anyway' });
    expect(() => parseThreatModel(model)).toThrow('cannot be accepted');
    model.threats[0].severity = 'low';
    expect(parseThreatModel(model)).toEqual(model);
  });
  it('reports state and unresolved high/critical threats as advisory blockers', () => {
    const model = fixture();
    expect(deploymentBlockers(model)).toEqual(['Model is draft', 'T1: high / open']);
    model.state = 'actual';
    model.threats[0].status = 'transferred';
    expect(deploymentBlockers(model)).toEqual(['T1: high / transferred']);
    model.threats[0].status = 'mitigated';
    expect(deploymentBlockers(model)).toEqual([]);
  });
});

describe('flowchart references', () => {
  const db = {
    getVertices: () =>
      new Map([
        ['API', {}],
        ['DB', {}],
        ['Zone', {}],
      ]),
    getEdges: () => [
      { id: 'query', isUserDefinedId: true },
      { id: 'auto', isUserDefinedId: false },
    ],
    getSubGraphs: () => [{ id: 'Zone' }],
  } as unknown as FlowDB;
  it('binds components, explicit edges and boundaries', () => {
    const model = fixture();
    model.elements.push({ id: 'query', kind: 'flow' }, { id: 'Zone', kind: 'boundary' });
    expect(() => validateFlowchart(model, db)).not.toThrow();
  });
  it.each([
    { id: 'missing', kind: 'process' },
    { id: 'API', kind: 'boundary' },
    { id: 'auto', kind: 'flow' },
    { id: 'Zone', kind: 'process' },
  ] as ThreatModel['elements'])('rejects missing or mismatched reference %j', (element) => {
    const model = fixture();
    model.elements = [element];
    expect(() => validateFlowchart(model, db)).toThrow('no matching');
  });
});
