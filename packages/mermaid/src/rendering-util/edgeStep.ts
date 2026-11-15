import type { Edge } from './types.js';

/** Seconds the travelling dot spends on one step when `flowchart.stepDuration` is not set. */
export const EDGE_STEP_DURATION = 1;

/** The configured step length in seconds, or the default when it is not a positive number. */
export const getStepDuration = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : EDGE_STEP_DURATION;

/** True when the edge takes part in the step animation (a positive integer `step`). */
export const isStepEdge = (
  edge: Pick<Edge, 'step'>
): edge is Pick<Edge, 'step'> & { step: number } =>
  typeof edge.step === 'number' && Number.isInteger(edge.step) && edge.step > 0;
