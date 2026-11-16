import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

const graph = (direction = 'TD') => `flowchart ${direction}
  A --> B & C
  B --> D
  C --> D
  A --> D
  D --> D`;

// These tests assert on the drawn `d` paths, so they take no screenshots: the layered
// `.mmd` fixtures already hold the visual baselines.
test.describe('layered edge routing', () => {
  for (const direction of ['TD', 'BT', 'LR', 'RL']) {
    test(`rounds default edges and self-loops in ${direction}`, async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, graph(direction), {
        layout: 'layered',
        screenshot: false,
      });
      const svg = diagramSvg(page);
      await expect(svg).not.toHaveAttribute('data-layout-fallback');
      const paths = await svg.locator('path[data-edge="true"]').evaluateAll((edges) =>
        edges.map((e) => ({
          d: e.getAttribute('d') ?? '',
          marker: e.getAttribute('marker-end'),
        }))
      );
      expect(paths).toHaveLength(6);
      expect(paths.some(({ d }) => d.includes('A5,5'))).toBe(true);
      expect(paths.at(-1)?.d).toContain('A5,5');
      for (const { d, marker } of paths) {
        expect(d).not.toMatch(/[CQ]|NaN|Infinity/);
        expect(marker).toContain('pointEnd');
      }

      await renderGraph(page, testInfo, graph(direction), {
        layout: 'layered',
        layered: { edgeRouting: 'rounded' },
        screenshot: false,
      });
      const explicit = await diagramSvg(page)
        .locator('path[data-edge="true"]')
        .evaluateAll((edges) => edges.map((e) => e.getAttribute('d')));
      expect(explicit).toEqual(paths.map(({ d }) => d));
    });
  }

  for (const [edgeRouting, curve, command] of [
    ['curved', 'basis', 'C'],
    ['curved', 'step', 'Q'],
    ['curved', 'linear', 'L'],
    ['stepped', 'basis', 'Q'],
    ['straight', 'basis', 'L'],
  ] as const) {
    test(`honors ${edgeRouting} routing with curve ${curve}`, async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, graph(), {
        layout: 'layered',
        layered: { edgeRouting },
        flowchart: { curve },
        screenshot: false,
      });
      await expect(diagramSvg(page)).not.toHaveAttribute('data-layout-fallback');
      const paths = await diagramSvg(page)
        .locator('path[data-edge="true"]')
        .evaluateAll((edges) => edges.map((e) => e.getAttribute('d') ?? ''));
      expect(paths).toHaveLength(6);
      expect(paths.some((d) => d.includes(command))).toBe(true);
      expect(paths.every((d) => !d.includes('A'))).toBe(true);
      if (command === 'L') {
        expect(paths.every((d) => !/[CQ]/.test(d))).toBe(true);
      }
    });
  }
});
