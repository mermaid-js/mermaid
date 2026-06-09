import { describe, it, expect } from 'vitest';
import { buildOrthoPipelineContext, type OrthogonalOptions } from './context.js';
import type { LayoutData } from '../../../types.js';

describe('domus/pipeline/context - ', () => {
  // iter-27 — `allowDomusWithGroups` default-on promotion. Prior to iter-27
  // the gate silently downgraded DOMUS to routing-graph whenever a group
  // node existed. Iter-26 diagnostic (`cluster-fixtures.ddlt.spec.ts`)
  // confirmed DOMUS-native produces identical validateLayout issue
  // profiles to the fallback on real cluster fixtures; the downgrade is
  // no longer needed. Explicit `allowDomusWithGroups: false` preserves
  // the escape hatch for regression triage.
  it('keeps DOMUS backend when groups exist (iter-27 default-on)', () => {
    const data = {
      nodes: [
        { id: 'G', isGroup: true },
        { id: 'A', isGroup: false },
        { id: 'B', isGroup: false },
      ],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as LayoutData;
    const ctx = buildOrthoPipelineContext(data, { routingBackend: 'domus' } as OrthogonalOptions);
    expect(ctx.requestedBackend).toBe('domus');
    expect(ctx.backend).toBe('domus');
  });

  it('escape hatch: downgrades to routing-graph when allowDomusWithGroups=false', () => {
    const data = {
      nodes: [
        { id: 'G', isGroup: true },
        { id: 'A', isGroup: false },
        { id: 'B', isGroup: false },
      ],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as LayoutData;
    const ctx = buildOrthoPipelineContext(data, {
      routingBackend: 'domus',
      allowDomusWithGroups: false,
    } as OrthogonalOptions);
    expect(ctx.requestedBackend).toBe('domus');
    expect(ctx.backend).toBe('routing-graph');
  });

  it('keeps requested backend when no groups exist', () => {
    const data = {
      nodes: [
        { id: 'A', isGroup: false },
        { id: 'B', isGroup: false },
      ],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as LayoutData;
    const ctx = buildOrthoPipelineContext(data, { routingBackend: 'domus' } as OrthogonalOptions);
    expect(ctx.backend).toBe('domus');
  });

  it('R11 / iter-13: preferAxisForVerticalFlow is undefined by default even when direction is set', () => {
    // Default-off: direction-derived nudger axis preference is opt-in. Without
    // the flag, A2 (direction → LayoutData propagation) is safe to land
    // because nudgers stay axis-neutral.
    const data = { direction: 'TB', nodes: [], edges: [] } as unknown as LayoutData;
    const ctx = buildOrthoPipelineContext(data, {} as OrthogonalOptions);
    expect(ctx.preferAxisForVerticalFlow).toBeUndefined();
  });

  it('R11 / iter-13: preferAxisForVerticalFlow becomes x when respectFlowDirectionInNudges is true', () => {
    const data = { direction: 'TB', nodes: [], edges: [] } as unknown as LayoutData;
    const ctx = buildOrthoPipelineContext(data, {
      respectFlowDirectionInNudges: true,
    } as OrthogonalOptions);
    expect(ctx.preferAxisForVerticalFlow).toBe('x');
  });
});
