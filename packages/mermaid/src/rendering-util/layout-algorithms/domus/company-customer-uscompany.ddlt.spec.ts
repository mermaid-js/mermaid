/**
 * DDLT regression spec for Company.mmd's `Customer --> USCompany` edge.
 *
 * Symptom (browser): the edge enters USCompany at its centroid and is drawn
 * passing UNDER USCompany's rectangle. Customer sits to the east of USCompany,
 * so the natural orthogonal route leaves Customer's west side and enters
 * USCompany's east side. The bug was libavoid's per-candidate acceptance gate
 * accepting routes that terminated inside the endpoint node's interior in
 * exchange for fewer global crossings; the per-edge veto in `libavoidFallback`
 * now rejects those candidates.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData } from '../../types.js';
import type { Point } from './types.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

const FIXTURE_NAME = 'Company';

function rectFor(layout: LayoutData, id: string) {
  const node = layout.nodes.find((n) => String(n.id) === id);
  if (!node) {
    throw new Error(`node "${id}" missing from layout`);
  }
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const w = (node as { width?: number }).width ?? 0;
  const h = (node as { height?: number }).height ?? 0;
  return {
    left: x - w / 2,
    right: x + w / 2,
    top: y - h / 2,
    bottom: y + h / 2,
  };
}

function segmentCrossesRect(
  a: Point,
  b: Point,
  rect: { left: number; right: number; top: number; bottom: number }
): boolean {
  const eps = 0.5;
  if (Math.abs(a.x - b.x) < eps) {
    const x = a.x;
    if (x <= rect.left + eps || x >= rect.right - eps) {
      return false;
    }
    const yLo = Math.min(a.y, b.y);
    const yHi = Math.max(a.y, b.y);
    return yHi > rect.top + eps && yLo < rect.bottom - eps;
  }
  if (Math.abs(a.y - b.y) < eps) {
    const y = a.y;
    if (y <= rect.top + eps || y >= rect.bottom - eps) {
      return false;
    }
    const xLo = Math.min(a.x, b.x);
    const xHi = Math.max(a.x, b.x);
    return xHi > rect.left + eps && xLo < rect.right - eps;
  }
  return false;
}

describe(`Domus DDLT — ${FIXTURE_NAME}.mmd: Customer→USCompany port-direction regression`, () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture(FIXTURE_NAME);
  });

  it('Customer→USCompany edge does not cross USCompany interior', () => {
    const edge = (layout.edges ?? []).find(
      (e) => String(e.start) === 'Customer' && String(e.end) === 'USCompany'
    );
    expect(edge, 'Customer→USCompany edge missing from layout').toBeTruthy();
    const points = (edge as { points?: Point[] }).points ?? [];
    expect(points.length, 'edge should be routed (>=2 points)').toBeGreaterThanOrEqual(2);

    const usc = rectFor(layout, 'USCompany');
    const violations: { idx: number; a: Point; b: Point }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentCrossesRect(points[i], points[i + 1], usc)) {
        violations.push({ idx: i, a: points[i], b: points[i + 1] });
      }
    }

    expect(
      violations,
      `Customer→USCompany has ${violations.length} segment(s) crossing USCompany interior. ` +
        `points=${JSON.stringify(points)} usc=${JSON.stringify(usc)}`
    ).toEqual([]);
  });

  it('Customer→USCompany enters USCompany from the side facing Customer', () => {
    const edge = (layout.edges ?? []).find(
      (e) => String(e.start) === 'Customer' && String(e.end) === 'USCompany'
    );
    expect(edge).toBeTruthy();
    const points = (edge as { points?: Point[] }).points ?? [];
    expect(points.length).toBeGreaterThanOrEqual(2);

    const usc = rectFor(layout, 'USCompany');
    const customer = rectFor(layout, 'Customer');

    const customerCenterX = (customer.left + customer.right) / 2;
    const uscCenterX = (usc.left + usc.right) / 2;
    const expectedSide = customerCenterX > uscCenterX ? 'east' : 'west';

    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const eps = 1;
    const enteredFromWest = Math.abs(last.x - usc.left) < eps && prev.x < last.x;
    const enteredFromEast = Math.abs(last.x - usc.right) < eps && prev.x > last.x;
    const enteredFromNorth = Math.abs(last.y - usc.top) < eps && prev.y < last.y;
    const enteredFromSouth = Math.abs(last.y - usc.bottom) < eps && prev.y > last.y;

    const side = enteredFromWest
      ? 'west'
      : enteredFromEast
        ? 'east'
        : enteredFromNorth
          ? 'north'
          : enteredFromSouth
            ? 'south'
            : 'unknown';

    expect(
      side,
      `Customer→USCompany entered USCompany from ${side}, expected ${expectedSide}. ` +
        `last=${JSON.stringify(last)} prev=${JSON.stringify(prev)} usc=${JSON.stringify(usc)}`
    ).toBe(expectedSide);
  });

  it('USCompany→HongKongCompany avoids the HK endpoint-band validator issue', () => {
    const validation = validateLayout(layout);
    const endpointBandIssues = validation.issues.filter(
      (issue) =>
        issue.type === 'edge-bend-near-endpoint' &&
        issue.edgeId === 'L_USCompany_HongKongCompany_0' &&
        issue.nodeIds?.includes('HongKongCompany')
    );

    expect(
      endpointBandIssues,
      `expected no HK endpoint-band issues on L_USCompany_HongKongCompany_0, got ${JSON.stringify(
        endpointBandIssues
      )}`
    ).toEqual([]);
  });

  it('keeps the Company layout free of conventional edge crossings', () => {
    const validation = validateLayout(layout);
    expect(validation.breakdown.crossings).toBe(0);
  });

  it('keeps the USCompany↔HongKongCompany reciprocal pair bend-light around Customer', () => {
    const toHk = (layout.edges ?? []).find(
      (candidate) => String(candidate.id) === 'L_USCompany_HongKongCompany_0'
    );
    const fromHk = (layout.edges ?? []).find(
      (candidate) => String(candidate.id) === 'L_HongKongCompany_USCompany_0'
    );
    const toHkPoints = (toHk as { points?: Point[] } | undefined)?.points ?? [];
    const fromHkPoints = (fromHk as { points?: Point[] } | undefined)?.points ?? [];

    expect(
      fromHkPoints.length,
      `L_HongKongCompany_USCompany_0 points=${JSON.stringify(fromHkPoints)}`
    ).toBeLessThanOrEqual(4);
    expect(
      toHkPoints.length + fromHkPoints.length,
      `reciprocal pair points=${JSON.stringify({ toHkPoints, fromHkPoints })}`
    ).toBeLessThanOrEqual(10);
  });
});
