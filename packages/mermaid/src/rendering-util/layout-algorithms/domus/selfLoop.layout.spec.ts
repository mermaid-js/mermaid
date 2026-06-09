import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { select } from 'd3';
import type { LayoutData } from '../../types.js';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import { measure, layout as layoutStage } from './index.js';
import { setLogLevel } from '../../../logger.js';

function isOrtho(points: { x: number; y: number }[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a.x !== b.x && a.y !== b.y) {
      return false;
    }
  }
  return true;
}

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

async function layoutFixture(name: string): Promise<LayoutData> {
  const diagram = readFileSync(
    resolve(process.cwd(), `cypress/platform/dev-diagrams/layout-tests/${name}.mmd`),
    'utf8'
  );

  flow.parser.yy = new FlowDB();
  flow.parser.yy.clear();
  await flow.parse(diagram);
  const layoutData = flow.parser.yy.getData() as LayoutData;

  document.body.innerHTML = '<svg><g></g></svg>';
  const svg = select('svg') as any;

  await measure(layoutData, svg);
  layoutStage(layoutData);

  return layoutData;
}

function semanticSelfLoops(layoutData: LayoutData): any[] {
  return (layoutData.edges as any[]).filter(
    (ed) =>
      ed?.start != null && ed?.end != null && String(ed.start) === String(ed.end) && !ed.isLabelEdge
  );
}

describe('Orthogonal layout regression: self-loop.mmd', () => {
  it('routes a self-loop (A-->A) with a valid orthogonal polyline', async () => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');

    // Stable bbox in JSDOM.
    const proto: any = (globalThis as any).SVGElement?.prototype;
    const originalGetBBox = proto?.getBBox;
    if (proto) {
      proto.getBBox = () => ({ x: 0, y: 0, width: 120, height: 60 });
    }

    try {
      const layoutData = await layoutFixture('self-loop');
      const e = semanticSelfLoops(layoutData).find(
        (ed) => String(ed?.start ?? '') === 'A' && String(ed?.end ?? '') === 'A'
      );
      expect(e, 'expected self-loop edge A->A').toBeTruthy();
      expect(Array.isArray(e.points), 'self-loop should have points').toBe(true);
      // 4 points: boundary → outside corner → outside corner → boundary
      expect(e.points.length).toBe(4);
      expect(isOrtho(e.points)).toBe(true);

      // Start and end should be on the same side but at different positions.
      const pStart = e.points[0];
      const pEnd = e.points[e.points.length - 1];
      const sameVerticalSide = approx(pStart.x, pEnd.x) && !approx(pStart.y, pEnd.y);
      const sameHorizontalSide = approx(pStart.y, pEnd.y) && !approx(pStart.x, pEnd.x);
      expect(
        sameVerticalSide || sameHorizontalSide,
        'start/end should be on same side but different positions'
      ).toBe(true);
    } finally {
      if (proto) {
        proto.getBBox = originalGetBBox;
      }
    }
  });

  it('routes every loop in self-loop-multi.mmd with separated boundary endpoints', async () => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');

    const proto: any = (globalThis as any).SVGElement?.prototype;
    const originalGetBBox = proto?.getBBox;
    if (proto) {
      proto.getBBox = () => ({ x: 0, y: 0, width: 120, height: 60 });
    }

    try {
      const layoutData = await layoutFixture('self-loop-multi');
      const loops = semanticSelfLoops(layoutData);

      expect(loops.map((edge) => String(edge.id)).sort()).toEqual([
        'L_A_A_0',
        'L_B_B_0',
        'L_C_C_0',
        'L_D_D_0',
      ]);

      for (const loop of loops) {
        expect(Array.isArray(loop.points), `${loop.id} should have routed points`).toBe(true);
        expect(loop.points.length, `${loop.id} should use a loop polyline`).toBeGreaterThanOrEqual(
          4
        );
        expect(isOrtho(loop.points), `${loop.id} should stay orthogonal`).toBe(true);

        const pStart = loop.points[0];
        const pEnd = loop.points[loop.points.length - 1];
        const sameVerticalSide = approx(pStart.x, pEnd.x) && !approx(pStart.y, pEnd.y);
        const sameHorizontalSide = approx(pStart.y, pEnd.y) && !approx(pStart.x, pEnd.x);
        expect(
          sameVerticalSide || sameHorizontalSide,
          `${loop.id} should start and end on the same side at different positions`
        ).toBe(true);
      }
    } finally {
      if (proto) {
        proto.getBBox = originalGetBBox;
      }
    }
  });
});
