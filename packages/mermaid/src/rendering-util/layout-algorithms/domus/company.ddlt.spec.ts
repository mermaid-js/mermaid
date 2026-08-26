import { beforeAll, describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { loadDdltFixture } from '../ddlt/index.js';
import { segmentIntersectsRectInterior } from '../layout-utils/helpers.js';
import { validateLayout } from './validateLayoutProxy.js';
import { rectForNode } from './core/helpers.js';
import { isSoftIssueType } from '../layout-utils/validateLayout.js';

function nodeById(layout: LayoutData, id: string): Node {
  const node = (layout.nodes ?? []).find((n) => String(n.id) === id);
  expect(node, `expected node ${id}`).toBeTruthy();
  return node!;
}

function edgeById(layout: LayoutData, id: string): Edge {
  const edge = (layout.edges ?? []).find((e) => String(e.id) === id);
  expect(edge, `expected edge ${id}`).toBeTruthy();
  return edge!;
}

describe('Domus DDLT — Company.mmd', () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture('domus/Company');
  }, 120_000);

  it('produces validator-clean geometry', () => {
    const result = validateLayout(layout);
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    expect(result.issues.filter((i) => !isSoftIssueType(i.type))).toEqual([]);
  });

  it('centers Income and Tax on the same straight column', () => {
    const income = nodeById(layout, 'Income');
    const tax = nodeById(layout, 'Tax');
    const edge = edgeById(layout, 'L_Income_Tax_0');

    expect(Number(tax.x)).toBeCloseTo(Number(income.x), 6);
    expect(edge.points?.length).toBe(2);
    expect(edge.points?.[0].x).toBeCloseTo(Number(income.x), 6);
    expect(edge.points?.[1].x).toBeCloseTo(Number(income.x), 6);
  });

  it('keeps HongKongCompany → USCompany clear of Customer', () => {
    const customerRect = rectForNode(nodeById(layout, 'Customer'));
    const edge = edgeById(layout, 'L_HongKongCompany_USCompany_0');
    const points = edge.points ?? [];

    const hits: string[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentIntersectsRectInterior(points[i], points[i + 1], customerRect)) {
        hits.push(`${i}:${JSON.stringify(points[i])}-${JSON.stringify(points[i + 1])}`);
      }
    }

    expect(hits).toEqual([]);
  });
});
