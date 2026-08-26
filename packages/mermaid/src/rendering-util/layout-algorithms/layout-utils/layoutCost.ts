/**
 * Deterministic work accounting for layout algorithms.
 *
 * ## Why counted work and not wall-clock
 *
 * The DDLT sweep's value rests on its aggregate being an EXACT number: when it
 * moves, the layout moved. That property is what lets a refactor prove itself —
 * "aggregate unchanged at 55014 / invalid 7" is the gate every recent change to
 * DOMUS has been held to. Milliseconds would destroy it, because the number
 * could then move because a machine was busy, and it would stop distinguishing
 * a real regression from noise.
 *
 * So cost here is *counted work*, not elapsed time: reproducible across
 * machines and runs, comparable between revisions, and attributable to a pass. Wall-clock still has
 * its place — `ddlt/perf-layout.local.spec.ts` is the ruler for that — but it
 * belongs outside the graded suite.
 *
 * ## Why cost is not part of the score
 *
 * `validateLayout` grades a finished `LayoutData`. It cannot see what producing
 * that layout cost, so cost is not a property it could report even in
 * principle: it belongs to the computation, not the geometry. Cost is therefore
 * a SECOND AXIS, collected here and reported alongside the score, never folded
 * into it. Blending needs an exchange rate between quality points and work
 * units that nothing can justify, and it would hide which side of a trade moved
 * — the failure this axis exists to catch.
 *
 * ## Why it must never reach the render objective
 *
 * These counters must not feed `checkLayout`'s verdict. DOMUS hill-climbs on
 * that during a real render, so a cost term there would be self-referential —
 * the optimiser's own validation work would become part of what it optimises —
 * and would make an accept/reject decision depend on how much work happened to
 * have been done already. Read these only from the harness, after `layout()`
 * has returned.
 */

/** Counted work for one layout run. All fields are monotone within a run. */
export interface LayoutCost {
  /** `validateLayout` / `checkLayout` invocations, at any focus or abort setting. */
  validations: number;
  /**
   * (edge, rectangle) pairs actually scanned — those that survived the
   * polyline-extent reject and were tested segment by segment. Counting
   * survivors rather than candidates is deliberate: it is what makes the extent
   * reject show up here as the saving it is.
   */
  rectScans: number;
  /** Pairs compared by the quadratic passes: node/node and edge/edge. */
  pairChecks: number;
  /** Clause visits in the shape solver's unit propagation. */
  satPropagations: number;
}

const counters: LayoutCost = {
  validations: 0,
  rectScans: 0,
  pairChecks: 0,
  satPropagations: 0,
};

/**
 * Live counter object, incremented directly by the hot paths.
 *
 * Exposed as a mutable object rather than behind `add(...)` calls so a scan loop
 * pays a property increment instead of a function call. Treat it as write-only
 * from algorithm code and read it through {@link readLayoutCost}.
 */
export const LAYOUT_COST: LayoutCost = counters;

/** Zero the counters. Call immediately before the run you want to measure. */
export function resetLayoutCost(): void {
  counters.validations = 0;
  counters.rectScans = 0;
  counters.pairChecks = 0;
  counters.satPropagations = 0;
}

/** Snapshot of the counters since the last reset. */
export function readLayoutCost(): Readonly<LayoutCost> {
  return { ...counters };
}

/**
 * Relative cost of one unit of each weighted counter, cheapest = 1.
 *
 * Calibrated by non-negative least squares against measured layout time over
 * all 37 domus fixtures (R² = 0.988, every coefficient positive). The ordering
 * is the one the code predicts: a rect scan walks a polyline's segments against
 * a rectangle, a pair check is a handful of comparisons, and a clause visit is
 * one step of unit propagation.
 *
 * `validations` is deliberately absent. It is near-collinear with the scan
 * counts — more calls means proportionally more scanning — so the fit assigns
 * it nothing once those are present, and giving it an invented weight would
 * double-count. It stays in {@link LayoutCost} because "how many times did we
 * validate" is the first question worth asking when cost moves, but it informs
 * the diagnosis rather than the budget.
 *
 * A counter is only worth having if it earns its overhead. `routeExpansions`
 * did not: it needed an increment inside the routing search's inner loop, which
 * measured a consistent +2% on the corpus, and dropping it cost only 0.009 of
 * R². Instrumentation that makes real renders slower is not free telemetry, it
 * is a regression — the exact thing this module exists to catch.
 *
 * These are a calibration, not a law, and the ceiling in the fixture sweep is
 * denominated in them. Recalibrate deliberately and in its own change: moving a
 * weight silently reprices every fixture at once.
 */
export const LAYOUT_COST_WEIGHTS = {
  rectScans: 177,
  pairChecks: 11,
  satPropagations: 1,
} as const;

/**
 * Single work figure for budgets and regression gates.
 *
 * Dimensionless by design. It tracks time closely enough to rank fixtures and
 * catch a regression, but it is not milliseconds and must not be reported as
 * such — that is exactly the conflation this module exists to avoid.
 */
export function totalLayoutCost(cost: Readonly<LayoutCost> = counters): number {
  return (
    cost.rectScans * LAYOUT_COST_WEIGHTS.rectScans +
    cost.pairChecks * LAYOUT_COST_WEIGHTS.pairChecks +
    cost.satPropagations * LAYOUT_COST_WEIGHTS.satPropagations
  );
}
