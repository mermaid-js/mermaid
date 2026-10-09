import { describe, it, expect } from 'vitest';
import { combineValidateLayoutResults, type NamedValidateResult } from './aggregateValidate.js';
import type { ValidateLayoutResult } from '../layout-utils/validateLayout.js';

function makeResult(overrides: Partial<ValidateLayoutResult>): ValidateLayoutResult {
  return {
    ok: true,
    issues: [],
    score: 1000,
    breakdown: {
      nodeCount: 0,
      edgeCount: 0,
      crossings: 0,
      totalPoints: 0,
      totalBendPenalty: 0,
      crossingPenalty: 0,
      edges: [],
      pointsHistogram: { '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 },
    },
    ...overrides,
  };
}

describe('combineValidateLayoutResults', () => {
  it('returns zeros for empty input', () => {
    const report = combineValidateLayoutResults([]);
    expect(report).toEqual({
      totalScore: 0,
      avgScore: 0,
      minScore: 0,
      invalidCount: 0,
      byCase: [],
    });
  });

  it('aggregates totals, averages, and minima across valid runs', () => {
    const items: NamedValidateResult[] = [
      { id: 'a', result: makeResult({ score: 1000 }) },
      { id: 'b', result: makeResult({ score: 800 }) },
      { id: 'c', result: makeResult({ score: 600 }) },
    ];
    const report = combineValidateLayoutResults(items);

    expect(report.totalScore).toBe(2400);
    expect(report.avgScore).toBe(800);
    expect(report.minScore).toBe(600);
    expect(report.invalidCount).toBe(0);
    expect(report.byCase).toEqual([
      { id: 'a', score: 1000, valid: true, issueTypes: [] },
      { id: 'b', score: 800, valid: true, issueTypes: [] },
      { id: 'c', score: 600, valid: true, issueTypes: [] },
    ]);
  });

  it('counts invalid runs and surfaces deduplicated sorted issue types', () => {
    const items: NamedValidateResult[] = [
      {
        id: 'good',
        result: makeResult({ score: 950 }),
      },
      {
        id: 'bad',
        result: makeResult({
          ok: false,
          score: 0,
          issues: [
            {
              type: 'edge-non-orthogonal',
              message: 'x',
            },
            {
              type: 'edge-non-orthogonal',
              message: 'y',
            },
            {
              type: 'edge-bend-near-endpoint',
              message: 'z',
            },
          ],
        }),
      },
    ];
    const report = combineValidateLayoutResults(items);

    expect(report.invalidCount).toBe(1);
    expect(report.minScore).toBe(0);
    expect(report.totalScore).toBe(950);
    expect(report.avgScore).toBe(475);
    expect(report.byCase[1]).toEqual({
      id: 'bad',
      score: 0,
      valid: false,
      issueTypes: ['edge-bend-near-endpoint', 'edge-non-orthogonal'],
    });
  });

  it('preserves caller order in byCase', () => {
    const items: NamedValidateResult[] = [
      { id: 'second', result: makeResult({ score: 500 }) },
      { id: 'first', result: makeResult({ score: 1000 }) },
    ];
    const report = combineValidateLayoutResults(items);
    expect(report.byCase.map((r) => r.id)).toEqual(['second', 'first']);
  });
});
