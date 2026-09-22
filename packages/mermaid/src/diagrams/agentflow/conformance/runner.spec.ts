/**
 * Unit tests for the conformance matcher itself.
 *
 * The fixture corpus can only be trusted if the harness fails closed: a
 * declared assertion that cannot be evaluated, or a diagnostic nobody asked
 * for, has to surface as a failure rather than as silence.
 */
import { describe, expect, it } from 'vitest';
import { matchExpected, runFixture } from './runner.js';
import type { FixtureExpectation, FixtureResult } from './runner.js';

const emptyResult = (overrides: Partial<FixtureResult> = {}): FixtureResult => ({
  outcome: 'valid',
  diagnostics: [],
  ...overrides,
});

describe('matchExpected', () => {
  it('fails when semanticAssertions are declared but no semantic model exists', () => {
    const expected: FixtureExpectation = {
      outcome: 'valid',
      semanticAssertions: { vertices: [{ id: 'a' }] },
    };
    const failures = matchExpected(emptyResult(), expected);

    expect(failures).toHaveLength(1);
    expect(failures[0].kind).toBe('semantic-mismatch');
    expect(failures[0].message).toContain('no semantic model');
  });

  it('fails on a diagnostic the fixture did not declare', () => {
    const result = emptyResult({
      outcome: 'warning',
      diagnostics: [
        { id: 'SHAPE_UNSUPPORTED', severity: 'warning', message: 'x', nodeId: 'x' },
        { id: 'CONTAINMENT_VIOLATION', severity: 'warning', message: 'y', nodeId: 'y' },
      ],
    });
    const failures = matchExpected(result, {
      outcome: 'warning',
      diagnostics: [{ id: 'SHAPE_UNSUPPORTED', nodeId: 'x' }],
    });

    expect(failures.map((f) => f.kind)).toContain('unexpected-diagnostic');
  });

  it('allows extra diagnostics when the fixture opts in', () => {
    const result = emptyResult({
      outcome: 'warning',
      diagnostics: [
        { id: 'SHAPE_UNSUPPORTED', severity: 'warning', message: 'x', nodeId: 'x' },
        { id: 'CONTAINMENT_VIOLATION', severity: 'warning', message: 'y', nodeId: 'y' },
      ],
    });
    const failures = matchExpected(result, {
      outcome: 'warning',
      diagnostics: [{ id: 'SHAPE_UNSUPPORTED', nodeId: 'x' }],
      allowExtraDiagnostics: true,
    });

    expect(failures).toHaveLength(0);
  });

  it('fails when the parse error does not match parseErrorContains', () => {
    const result = emptyResult({ outcome: 'parse-error', parseError: 'Parse error on line 4' });
    const failures = matchExpected(result, {
      outcome: 'parse-error',
      parseErrorContains: 'Lexical error',
    });

    expect(failures.map((f) => f.kind)).toContain('parse-error-mismatch');
  });
});

describe('runFixture', () => {
  it('produces a semantic model for a diagram that parses', () => {
    const result = runFixture(`agentflow-beta TB
  a["Alpha"]
  b["Beta"]
  a --> b`);
    expect(result.outcome).toBe('valid');
    expect(result.semanticModel).toBeDefined();
  });

  it('reports parse-error and no semantic model when the parser throws', () => {
    const result = runFixture(`agentflow-beta TB
  flow orphan["Orphan"]
    a["Alpha"]`);
    expect(result.outcome).toBe('parse-error');
    expect(result.semanticModel).toBeUndefined();
    expect(result.parseError).toBeTruthy();
  });
});
