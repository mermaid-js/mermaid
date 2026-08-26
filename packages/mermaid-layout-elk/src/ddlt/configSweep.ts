/**
 * Comparing ELK configurations over the DDLT fixture corpus.
 *
 * ## Why `validateLayout().score` alone is not the metric here
 *
 * `score` is zeroed whenever `ok` is false. That is the right contract for a
 * gate — a broken drawing has no quality — but it makes the aggregate blind
 * while most of the corpus is invalid: every candidate config scores 0 on every
 * broken fixture, so a change that halves the bends is indistinguishable from
 * one that does nothing. The ELK corpus starts in exactly that state.
 *
 * So a variant is measured on three axes, reported side by side and never
 * blended into one number:
 *
 *   1. `hardIssues`  — the gate. Fewer is strictly better; this is the axis to
 *                      drive to zero, and no amount of `quality` compensates.
 *   2. `quality`     — the score's own formula (bends + crossings + soft
 *                      penalties against a 1000 ceiling) computed WITHOUT the
 *                      validity gate, so it keeps ranking invalid layouts.
 *                      Identical to `result.score` once a fixture is valid.
 *   3. `crossings`   — reported, not priced beyond what `quality` already
 *                      charges, because it is the axis config changes move most
 *                      visibly and it is worth watching separately.
 *
 * Blending them would need an exchange rate between "wrong" and "ugly" that
 * nothing justifies, and would hide which side of a trade moved.
 */
import type { LayoutData } from 'mermaid';
import {
  isSoftIssueType,
  validateLayout,
  type Issue,
  type ValidateLayoutResult,
} from 'mermaid/src/rendering-util/layout-algorithms/layout-utils/validateLayout.js';
import type { LayoutTestFixture } from 'mermaid/src/rendering-util/layout-algorithms/ddlt/index.js';
import { parseApplySizesAndRunElk, type RunElkDdltOptions } from './backend.js';

/** Score ceiling, mirroring `MAX_SCORE` in `validateLayout.ts`. */
const MAX_SCORE = 1000;

/** A named ELK configuration to measure. */
export interface ElkConfigVariant {
  /** Short identifier used in the report. */
  name: string;
  /** What this variant is testing, for the write-up. */
  note?: string;
  options: RunElkDdltOptions;
}

export interface FixtureMeasurement {
  id: string;
  /** Hard issues — the validity gate. */
  hardIssues: number;
  /** Soft issues — priced into `quality`, never into validity. */
  softIssues: number;
  /** `validateLayout().ok`. */
  valid: boolean;
  /** Ungated quality in [0, 1000] — see the module comment. */
  quality: number;
  /** `validateLayout().score`: the real, gate-respecting score. */
  score: number;
  crossings: number;
  bendPenalty: number;
  /** Distinct hard issue types, sorted — the shape of what is wrong. */
  hardTypes: string[];
  /** Set when the backend threw; every numeric field is then a worst case. */
  error?: string;
}

export interface VariantMeasurement {
  name: string;
  note?: string;
  /** Summed over fixtures. Lower is better. */
  hardIssues: number;
  softIssues: number;
  /** Summed ungated quality. Higher is better. */
  quality: number;
  /** Summed gate-respecting score — 0 for every invalid fixture. */
  score: number;
  crossings: number;
  invalidCount: number;
  fixtureCount: number;
  byFixture: FixtureMeasurement[];
}

/**
 * The score formula from `validateLayout`, minus the `ok` gate.
 *
 * Deliberately recomputed from `breakdown` + `issues` rather than read off
 * `result.score`, because `score` is the gated number and the whole point here
 * is to see through the gate. When a fixture is valid the two agree exactly.
 */
function ungatedQuality(result: ValidateLayoutResult): number {
  const softPenalty = result.issues.reduce(
    (sum, issue) =>
      isSoftIssueType(issue.type)
        ? sum + ((issue.details?.softPenalty as number | undefined) ?? 0)
        : sum,
    0
  );
  const raw =
    MAX_SCORE - result.breakdown.totalBendPenalty - result.breakdown.crossingPenalty - softPenalty;
  return Math.max(0, Math.min(MAX_SCORE, raw));
}

function measure(id: string, result: ValidateLayoutResult): FixtureMeasurement {
  const hard: Issue[] = result.issues.filter((issue) => !isSoftIssueType(issue.type));
  return {
    id,
    hardIssues: hard.length,
    softIssues: result.issues.length - hard.length,
    valid: result.ok,
    quality: ungatedQuality(result),
    score: result.score,
    crossings: result.breakdown.crossings,
    bendPenalty: result.breakdown.totalBendPenalty,
    hardTypes: [...new Set(hard.map((issue) => issue.type))].sort(),
  };
}

/**
 * A fixture the backend could not lay out at all.
 *
 * Recorded as a worst case rather than skipped: a config that crashes ELK on a
 * fixture must not come out ahead of one that merely lays it out badly, which
 * is what dropping the row would do.
 */
function measureFailure(id: string, error: unknown): FixtureMeasurement {
  return {
    id,
    hardIssues: Number.MAX_SAFE_INTEGER,
    softIssues: 0,
    valid: false,
    quality: 0,
    score: 0,
    crossings: 0,
    bendPenalty: 0,
    hardTypes: ['backend-error'],
    error: error instanceof Error ? error.message : String(error),
  };
}

/** Lay out every fixture under one variant and measure the result. */
export async function measureVariant(
  fixtures: LayoutTestFixture[],
  variant: ElkConfigVariant
): Promise<VariantMeasurement> {
  const byFixture: FixtureMeasurement[] = [];
  for (const fixture of fixtures) {
    try {
      const layout: LayoutData = await parseApplySizesAndRunElk(
        fixture.mmdPath,
        fixture.sizes,
        variant.options
      );
      byFixture.push(measure(fixture.id, validateLayout(layout)));
    } catch (error) {
      byFixture.push(measureFailure(fixture.id, error));
    }
  }

  const sum = (pick: (m: FixtureMeasurement) => number) =>
    byFixture.reduce((total, m) => total + pick(m), 0);

  return {
    name: variant.name,
    note: variant.note,
    hardIssues: sum((m) => (m.error ? 1000 : m.hardIssues)),
    softIssues: sum((m) => m.softIssues),
    quality: sum((m) => m.quality),
    score: sum((m) => m.score),
    crossings: sum((m) => m.crossings),
    invalidCount: byFixture.filter((m) => !m.valid).length,
    fixtureCount: byFixture.length,
    byFixture,
  };
}

/**
 * Order variants best-first: validity is lexicographically ahead of quality,
 * because a config that draws a wrong picture more prettily is not an
 * improvement.
 */
export function rankVariants(variants: VariantMeasurement[]): VariantMeasurement[] {
  return [...variants].sort(
    (a, b) => a.hardIssues - b.hardIssues || b.quality - a.quality || a.crossings - b.crossings
  );
}

/** One line per variant, deltas relative to `baseline`. Printed by the sweep spec. */
export function formatVariantTable(
  variants: VariantMeasurement[],
  baseline: VariantMeasurement
): string {
  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  const delta = (value: number, base: number, lowerIsBetter: boolean) => {
    const d = value - base;
    if (d === 0) {
      return '  ·   ';
    }
    const good = lowerIsBetter ? d < 0 : d > 0;
    return `${good ? '+' : '-'}${Math.abs(d).toFixed(0).padStart(5)}`;
  };

  const lines = [
    `${pad('variant', 34)} ${pad('hard', 6)} ${pad('Δ', 6)} ${pad('quality', 8)} ${pad('Δ', 6)} ${pad('xings', 6)} ${pad('Δ', 6)} invalid`,
    '-'.repeat(96),
  ];
  for (const v of rankVariants(variants)) {
    lines.push(
      `${pad(v.name, 34)} ${pad(v.hardIssues, 6)} ${pad(delta(v.hardIssues, baseline.hardIssues, true), 6)} ` +
        `${pad(v.quality.toFixed(0), 8)} ${pad(delta(v.quality, baseline.quality, false), 6)} ` +
        `${pad(v.crossings, 6)} ${pad(delta(v.crossings, baseline.crossings, true), 6)} ` +
        `${v.invalidCount}/${v.fixtureCount}`
    );
  }
  return lines.join('\n');
}
