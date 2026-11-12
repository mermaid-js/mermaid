import type { ValidateLayoutResult } from '../layout-utils/validateLayout.js';

/**
 * One named entry to be folded into an aggregate report. The `id` shows up in
 * the `byCase` rows so a developer can spot the worst-scoring fixture or the
 * one that has gone invalid.
 */
export interface NamedValidateResult {
  id: string;
  result: ValidateLayoutResult;
}

/**
 * Aggregate snapshot over a batch of `validateLayout` runs. Designed to be
 * dumped via `console.table(report.byCase)` or asserted on
 * (`report.invalidCount === 0`) in a fixture-sweep spec.
 */
export interface AggregateValidateReport {
  /** Sum of `result.score` across all entries. Zero entries → 0. */
  totalScore: number;
  /** `totalScore / count`. Zero entries → 0. */
  avgScore: number;
  /** Smallest `result.score` across all entries. Zero entries → 0. */
  minScore: number;
  /** Number of entries with `result.ok === false`. */
  invalidCount: number;
  /** Per-fixture rows ordered as supplied. */
  byCase: {
    id: string;
    score: number;
    valid: boolean;
    issueTypes: string[];
  }[];
}

/**
 * Combine multiple {@link ValidateLayoutResult}s into a single
 * {@link AggregateValidateReport}.
 *
 * The helper is intentionally pure and side-effect free — callers decide
 * whether to log, assert, or print the report. Per-case `issueTypes` is the
 * deduplicated, sorted list of issue types so `console.table` rows stay
 * compact.
 */
export function combineValidateLayoutResults(
  items: NamedValidateResult[]
): AggregateValidateReport {
  if (items.length === 0) {
    return {
      totalScore: 0,
      avgScore: 0,
      minScore: 0,
      invalidCount: 0,
      byCase: [],
    };
  }

  let totalScore = 0;
  let minScore = Number.POSITIVE_INFINITY;
  let invalidCount = 0;
  const byCase: AggregateValidateReport['byCase'] = [];

  for (const { id, result } of items) {
    totalScore += result.score;
    if (result.score < minScore) {
      minScore = result.score;
    }
    if (!result.ok) {
      invalidCount += 1;
    }
    const issueTypes = [...new Set(result.issues.map((i) => i.type))].sort();
    byCase.push({
      id,
      score: result.score,
      valid: result.ok,
      issueTypes,
    });
  }

  return {
    totalScore,
    avgScore: totalScore / items.length,
    minScore,
    invalidCount,
    byCase,
  };
}

/**
 * Number of hard-constraint issues of each type across a batch of `validateLayout` runs, keyed
 * by issue type in sorted order. Every issue `validateLayout` reports is a Level 1 violation.
 */
export function countIssuesByType(items: NamedValidateResult[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const { result } of items) {
    for (const issue of result.issues) {
      counts.set(issue.type, (counts.get(issue.type) ?? 0) + 1);
    }
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
