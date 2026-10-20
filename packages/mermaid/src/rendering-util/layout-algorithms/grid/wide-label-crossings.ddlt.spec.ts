import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { extractFrontMatter } from '../../../diagram-api/frontmatter.js';
import { applySyntheticContentSizes, applySyntheticLabelSizes } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { polylineIntersectsRect, rectForNode } from '../layout-utils/helpers.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';

describe('Grid DDLT - wide-label-crossings.mmd', () => {
  it('avoids a 400px label without losing endpoint or marker clearance', async () => {
    addDiagrams();
    const fixturePath = resolve(
      process.cwd(),
      'e2e/platform/dev-diagrams/layout-tests/grid/wide-label-crossings.mmd'
    );
    const layout = await parseMmdFileToLayoutData(fixturePath, {
      stampFlowchartRendererFields: true,
    });
    // The flowchart adapter does not retain the authored grid placement configuration.
    layout.config = extractFrontMatter(readFileSync(fixturePath, 'utf-8')).metadata.config!;
    applySyntheticContentSizes(layout, {
      minWidth: 20,
      height: 20,
      charWidth: 0,
      padding: 0,
    });
    prepareGridLayout(layout);
    applySyntheticLabelSizes(layout, {
      minWidth: 400,
      height: 20,
      charWidth: 0,
      padding: 0,
    });

    runGridLayoutCore(layout);

    const labelledEdge = layout.edges.find((edge) => edge.start === 'start')!;
    const labelNode = layout.nodes.find((node) => node.id === labelledEdge.labelNodeId)!;
    const crossingEdges = layout.edges.filter((edge) => edge.start.startsWith('top'));
    const labelRect = rectForNode(labelNode);

    expect(crossingEdges).toHaveLength(5);
    expect(
      crossingEdges.some((edge) => normalizePolyline(edge.points ?? []).points.length > 2)
    ).toBe(true);
    for (const edge of crossingEdges) {
      expect(polylineIntersectsRect(edge.points ?? [], labelRect)).toBe(false);
    }
    const report = validateLayout(layout, { requireEdgeLabelCenter: true });
    // Tight bends and reroute lanes remain quality trade-offs, not clearance guarantees.
    const acceptedTradeoffs = new Set([
      'edge-bend-near-endpoint',
      'edge-parallel-segment-too-close',
    ]);
    expect(report.issues.filter(({ type }) => !acceptedTradeoffs.has(type))).toEqual([]);
  });
});
