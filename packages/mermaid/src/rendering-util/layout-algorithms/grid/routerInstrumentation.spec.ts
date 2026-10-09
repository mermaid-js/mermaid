import { describe, expect, it } from 'vitest';
import {
  createGridRoutingInstrumentation,
  createGridRoutingInstrumentationCheckpoint,
  gridRoutingMetricDisposition,
  restoreGridRoutingInstrumentationCheckpoint,
  type GridRouteInstrumentation,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';

const route = (edgeId: string): GridRouteInstrumentation => ({
  edgeId,
  routeOrder: 0,
  laneOffset: 0,
  routeLength: 10,
  bendCount: 1,
  crossingCount: 0,
  sharedLength: 0,
  boundaryTransitionCount: 0,
  routeSignature: edgeId,
});

describe('grid routing instrumentation checkpoints', () => {
  it('classifies every metric as transactional or cumulative', () => {
    expect(Object.keys(gridRoutingMetricDisposition).sort()).toEqual(
      Object.keys(createGridRoutingInstrumentation()).sort()
    );
    expect(gridRoutingMetricDisposition.compatibilityFastPaths).toBe('cumulative');
    expect(gridRoutingMetricDisposition.labelOverlayBuilds).toBe('cumulative');
    expect(gridRoutingMetricDisposition.labelOverlayVertices).toBe('cumulative');

    const checkpoint = createGridRoutingInstrumentationCheckpoint(
      createGridRoutingInstrumentation()
    );
    const transactionalValueMetrics = Object.entries(gridRoutingMetricDisposition)
      .filter(
        ([key, disposition]) =>
          disposition === 'transactional' && key !== 'routeOrder' && key !== 'routes'
      )
      .map(([key]) => key)
      .sort();
    expect(Object.keys(checkpoint.values).sort()).toEqual(transactionalValueMetrics);
  });

  it('restores committed output while preserving work performed', () => {
    const metrics = createGridRoutingInstrumentation();
    metrics.routeOrder.push('committed');
    metrics.routes.push(route('committed'));
    const checkpoint = createGridRoutingInstrumentationCheckpoint(metrics);
    const beforeAttempt = structuredClone(metrics);
    const mutableMetrics = metrics as unknown as Record<keyof GridRoutingInstrumentation, unknown>;

    for (const key of Object.keys(metrics) as (keyof GridRoutingInstrumentation)[]) {
      const value = metrics[key];
      if (typeof value === 'number') {
        mutableMetrics[key] = value + 7;
      }
    }
    for (const reason of Object.keys(
      metrics.fallbackReasons
    ) as (keyof typeof metrics.fallbackReasons)[]) {
      metrics.fallbackReasons[reason] += 7;
    }
    metrics.routeOrder.push('failed-attempt');
    metrics.routes.push(route('failed-attempt'));
    const afterAttempt = structuredClone(metrics);

    restoreGridRoutingInstrumentationCheckpoint(metrics, checkpoint);

    for (const key of Object.keys(metrics) as (keyof GridRoutingInstrumentation)[]) {
      if (gridRoutingMetricDisposition[key] === 'transactional') {
        expect(metrics[key], key).toEqual(beforeAttempt[key]);
      } else {
        expect(metrics[key], key).toEqual(afterAttempt[key]);
      }
    }
  });
});
