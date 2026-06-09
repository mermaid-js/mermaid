import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData, Node } from '../../types.js';
import { runDomusOrthogonalDdlt } from '../ddlt/backends.js';
import { injectDomusEdgeLabelNodes } from '../ddlt/domusEdgeLabelInject.js';
import { applySyntheticContentSizes, applySyntheticLabelSizes } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectFor(node: Node): Rect {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function overlaps(a: Rect, b: Rect, tolerance = 0.5): boolean {
  return (
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > tolerance &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > tolerance
  );
}

function contentNodes(layout: LayoutData): Node[] {
  return (layout.nodes ?? []).filter(
    (node) =>
      !node.isGroup &&
      !(node as { isEdgeLabel?: boolean }).isEdgeLabel &&
      String(node.id ?? '').startsWith('a')
  );
}

describe('Orthogonal layout regression: labels-long.mmd', () => {
  let layout: LayoutData;
  let layoutMs = 0;

  beforeAll(async () => {
    addDiagrams();
    const fixturePath = resolve(
      process.cwd(),
      'cypress/platform/dev-diagrams/layout-tests/labels-long.mmd'
    );
    layout = await parseMmdFileToLayoutData(fixturePath, {
      stampFlowchartRendererFields: true,
    });
    (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'domus';

    applySyntheticContentSizes(layout, {
      minWidth: 120,
      height: 60,
      charWidth: 7,
      padding: 24,
    });
    injectDomusEdgeLabelNodes(layout);
    applySyntheticLabelSizes(layout);

    const started = performance.now();
    await runDomusOrthogonalDdlt(layout);
    layoutMs = performance.now() - started;
  }, 30_000);

  it('keeps all long-label content nodes finite and non-overlapping', () => {
    const nodes = contentNodes(layout);
    expect(nodes.map((node) => String(node.id)).sort()).toEqual([
      'a1',
      'a10',
      'a2',
      'a3',
      'a4',
      'a5',
      'a6',
      'a7',
      'a8',
      'a9',
    ]);

    const invalid = nodes
      .filter(
        (node) =>
          !Number.isFinite(node.x) ||
          !Number.isFinite(node.y) ||
          !Number.isFinite(node.width) ||
          !Number.isFinite(node.height)
      )
      .map((node) => String(node.id));
    expect(invalid, `invalid long-label node geometry: ${invalid.join(', ')}`).toEqual([]);

    const failures: { a: string; b: string; rectA: Rect; rectB: Rect }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const rectA = rectFor(a);
        const rectB = rectFor(b);
        if (overlaps(rectA, rectB)) {
          failures.push({
            a: String(a.id),
            b: String(b.id),
            rectA,
            rectB,
          });
        }
      }
    }

    expect(failures, `long-label overlaps: ${JSON.stringify(failures)}`).toEqual([]);
  });

  it('does not fall into the slow long-label layout path', () => {
    expect(layoutMs).toBeLessThan(5_000);
  });

  it('keeps validateLayout free of long-label node overlaps', () => {
    const validation = validateLayout(layout);
    const nodeOverlaps = validation.issues.filter((issue) => issue.type === 'node-overlap');
    expect(nodeOverlaps, `validation node overlaps: ${JSON.stringify(nodeOverlaps)}`).toEqual([]);
  });
});
